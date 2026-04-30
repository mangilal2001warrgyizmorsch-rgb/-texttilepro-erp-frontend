"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  RefreshCw,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OcrResult = {
  partyName?: string;
  date?: string;
  challanNo?: string;
  weaverName?: string;
  weaverChallanNo?: string;
  weaverMarka?: string;
  chDate?: string;
  qualityName?: string;
  takaCount?: number;
  totalMeter?: number;
  takaRows?: { takaNo: string; meter: number; weight?: number }[];
  confidence: string;
  unmatchedFields?: string[];
};

type Props = {
  onFill: (data: any) => void;
  onClose: () => void;
  autoCamera?: boolean;
  autoSave?: boolean;
  onAutoSaveSuccess?: (orderIds: string[]) => void;
  variant?: "default" | "split";
};

export default function OcrChallanReader({
  onFill,
  onClose,
  autoCamera,
  autoSave,
  onAutoSaveSuccess,
  variant = "default",
}: Props) {
  const extractChallan = useMutation(api.ocr.extract);
  const createBatch = useMutation(api.orders.createBatch);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [enableAutoSave, setEnableAutoSave] = useState(autoSave ?? false);
  const [savedOrderIds, setSavedOrderIds] = useState<string[]>([]);

  // Auto-trigger camera if requested
  useEffect(() => {
    if (autoCamera && cameraRef.current) {
      cameraRef.current.click();
    }
  }, [autoCamera]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setOcrResult(null);
    setLastFile(file);
    setSavedOrderIds([]);
    try {
      setPreviewUrl(URL.createObjectURL(file));
      setMimeType(file.type);
      toast.success("File uploaded — running OCR...");
      await runOcr(file);
    } catch (e) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const runOcr = async (file: File) => {
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api"}/ocr/extract`,
        {
          method: "POST",
          body: formData,
          headers,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "OCR API failed" }));
        throw new Error(err.error || "OCR failed");
      }

      const data = await response.json();

      // Handle result (compatible with batch or single)
      const result = data.challans?.[0] || data;
      setOcrResult(result);
      toast.success("Data extracted successfully!");

      if (enableAutoSave) {
        setTimeout(() => handleAutoSave(data), 500);
      } else if (
        data.challans &&
        Array.isArray(data.challans) &&
        data.challans.length > 1
      ) {
        // Batch: pass full data object so BatchOrderEntry can create multiple pages
        onFill(data);
      } else {
        // Single: pass flattened result with fallbacks
        onFill({
          ...result,
          partyName: result.partyName ?? result.firm ?? result.party ?? "",
          date: result.date ?? result.challan_date ?? result.ch_date ?? "",
          challanNo: result.challanNo ?? result.challan_no ?? "",
          weaverName: result.weaverName ?? result.weaver ?? "",
          weaverChallanNo:
            result.weaverChallanNo ?? result.weaver_challan_no ?? "",
          weaverMarka: result.weaverMarka ?? result.weaver_marka ?? "",
          chDate: result.chDate ?? result.challan_date ?? result.ch_date ?? "",
          qualityName: result.qualityName ?? result.quality ?? "",
          takaCount: result.takaCount ?? result.taka ?? "",
          totalMeter: result.totalMeter ?? result.meter ?? "",
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "OCR failed");
    } finally {
      setExtracting(false);
    }
  };

  const handleAutoSave = async (ocrData: any) => {
    setAutoSaving(true);
    try {
      const challans = Array.isArray(ocrData.challans)
        ? ocrData.challans
        : [ocrData];

      toast.info("📋 Auto-filling form fields with extracted data...");
      onFill(ocrData);

      const todayDate = new Date().toISOString().split("T")[0];
      const payload = challans
        .filter((c: any) => c && typeof c === "object") // Filter out undefined/null items
        .map((c: any) => ({
          orderDate: todayDate,
          firmId: c.firmId || "",
          firmName: c.firmName || c.firm || c.delivery_at || "",
          partyId: c.partyId || "",
          partyName: c.partyName || c.party || "",
          partyChNo: c.challanNo || c.challan_no || c.ch_no || "",
          marka: c.marka || c.mka || "",
          weaverId: c.weaverId || "",
          weaverName: c.weaverName || c.weaver || "",
          weaverChNo: c.weaverChNo || c.weaver_challan_no || "",
          weaverMarka: c.weaverMarka || c.weaver_marka || c.mka || "",
          weaverChDate: c.chDate || c.challan_date || c.ch_date || "",
          qualityId: c.qualityId || "",
          qualityName: c.qualityName || c.quality || "",
          width: Number(c.width) || 0,
          weight: Number(c.weight) || 0,
          length: Number(c.length) || 0,
          chadti: Number(c.chadhti || c.chadti) || 0,
          totalTaka: Number(c.totalTaka || c.takaCount || c.taka) || 1,
          totalMeter: Number(c.totalMeter || c.meter) || 0,
          jobRate: Number(c.jobRate) || 0,
          greyRate: Number(c.greyRate) || 0,
          shippingMode: "DirectMills",
          lrNo: c.lrNo || c.lr_no || "",
          lrDate: c.lrDate || c.lr_date || "",
          transportName: c.transporterName || c.transporter || "",
          vehicleNo: c.vehicleNo || c.vehicle_no || "",
          driverMobile: c.driverMobile || c.driver_mobile || "",
          gstin: c.gstin || c.gstin_no || "",
          address: c.address || c.party_address || "",
          partyGstin: c.partyGstin || c.gstin || c.gstin_no || "",
          partyAddress: c.partyAddress || c.address || c.party_address || "",
          weaverGstin: c.weaverGstin || "",
          weaverAddress: c.weaverAddress || "",
          brokerName: c.broker || c.agent || "",
          takaDetails: (c.takaRows || c.table || []).map((r: any) => ({
            takaNo: (r.takaNo || r.tn || "").toString(),
            marka: (r.marka || r.mka || "").toString(),
            meter: Number(r.meter) || 0,
            weight: Number(r.weight) || 0,
          })),
          ocrFileId: c.ocrFileId || "",
          ocrExtractedData: JSON.stringify(c),
        }));

      if (payload.length === 0) {
        toast.error("No valid data extracted from PDF");
        return;
      }

      const result = await createBatch({ challans: payload });
      const orderIds =
        result?.map((r: any) => r.order?._id).filter(Boolean) || [];

      setSavedOrderIds(orderIds);
      toast.success(
        `✅ Successfully created ${orderIds.length} order(s)! Form fields auto-populated.`
      );

      if (onAutoSaveSuccess) {
        onAutoSaveSuccess(orderIds);
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to auto-save orders"
      );
      console.error("Auto-save error:", e);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRetry = () => {
    if (lastFile) runOcr(lastFile);
  };

  const confidenceColor =
    ocrResult?.confidence === "high"
      ? "bg-green-100 text-green-700"
      : ocrResult?.confidence === "medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  const isLoading = uploading || extracting || autoSaving;

  return (
    <Card className="border-primary/20 bg-muted/30 mb-6 shadow-md overflow-hidden flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            {variant === "split" ? "Document Preview" : "OCR Challan Reader"}
          </CardTitle>
          {variant !== "split" && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="cursor-pointer h-7 w-7"
            >
              <X size={16} />
            </Button>
          )}
        </div>
        {variant !== "split" && (
          <p className="text-xs text-muted-foreground">
            Upload a challan image or PDF — AI will extract and auto-fill the
            order form
          </p>
        )}

        {/* Auto-save toggle */}
        <div className="mt-3 flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <input
            type="checkbox"
            id="auto-save-toggle"
            checked={enableAutoSave}
            onChange={(e) => setEnableAutoSave(e.target.checked)}
            className="cursor-pointer"
          />
          <label
            htmlFor="auto-save-toggle"
            className="text-sm cursor-pointer flex items-center gap-2"
          >
            <Save size={14} className="text-primary" />
            <span className="font-medium">Auto-save orders after extraction</span>
            <span className="text-xs text-muted-foreground">
              (Creates orders directly without editing)
            </span>
          </label>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 overflow-y-auto flex-1 pb-6">
        {/* Upload Zone */}
        {!isLoading && !ocrResult && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <Upload size={22} className="text-muted-foreground" />
                <span className="text-sm font-medium">Upload File</span>
                <span className="text-xs text-muted-foreground">
                  PDF / JPG / PNG
                </span>
              </button>
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <Camera size={22} className="text-muted-foreground" />
                <span className="text-sm font-medium">Camera Scan</span>
                <span className="text-xs text-muted-foreground">
                  Mobile camera
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div className="mt-4 flex justify-center">
              <a
                href="/challan-template.pdf"
                download="Challan_Template.pdf"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <FileText size={14} /> Download Template PDF
              </a>
            </div>
          </>
        )}

        {/* PDF / Image Preview */}
        {previewUrl && (
          <div
            className={cn(
              "relative w-full rounded-lg border border-border overflow-hidden bg-muted/30",
              variant === "split" && "sticky top-4"
            )}
          >
            {mimeType.startsWith("image/") ? (
              <img
                src={previewUrl}
                alt="Challan preview"
                className="w-full max-h-[80vh] object-contain"
              />
            ) : mimeType === "application/pdf" ? (
              <div className="flex flex-col">
                <object
                  data={previewUrl}
                  type="application/pdf"
                  className={cn(
                    "w-full",
                    variant === "split" ? "h-[85vh]" : "h-[500px]"
                  )}
                >
                  <embed src={previewUrl} type="application/pdf" />
                  <div className="p-10 text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      PDF preview not supported by your browser.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(previewUrl || "", "_blank")}
                    >
                      Open PDF in New Tab
                    </Button>
                  </div>
                </object>
              </div>
            ) : null}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-6 border-t border-border mt-4">
            <Spinner />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              {uploading
                ? "Uploading challan..."
                : extracting
                  ? "Reading challan with AI OCR..."
                  : "Auto-saving orders..."}
            </p>
          </div>
        )}

        {/* Result Details */}
        {!isLoading && ocrResult && (
          <div className="space-y-4 border-t border-border pt-4">
            {/* Success message for auto-save */}
            {savedOrderIds.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={20}
                    className="text-green-600 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-green-900">
                      ✅ Orders Auto-Saved & Form Populated!
                    </p>
                    <p className="text-sm text-green-800 mt-1">
                      Successfully created {savedOrderIds.length} order(s) with
                      ID: {savedOrderIds.join(", ")}
                    </p>
                    <p className="text-xs text-green-700 mt-2 italic">
                      Form fields have been automatically filled with extracted
                      data. You can now review and submit to proceed to challan
                      creation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Confidence badge */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${confidenceColor}`}
              >
                {ocrResult.confidence === "high"
                  ? "High Confidence"
                  : ocrResult.confidence === "medium"
                    ? "Medium Confidence"
                    : "Low Confidence — Please Verify"}
              </span>
              {ocrResult.unmatchedFields &&
                ocrResult.unmatchedFields.length > 0 && (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Verify: {ocrResult.unmatchedFields.join(", ")}
                  </span>
                )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetry}
                className="cursor-pointer gap-1"
              >
                <RefreshCw size={13} /> Re-scan
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setOcrResult(null);
                  setPreviewUrl(null);
                  setSavedOrderIds([]);
                }}
                className="cursor-pointer gap-1"
              >
                <Upload size={13} /> New File
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
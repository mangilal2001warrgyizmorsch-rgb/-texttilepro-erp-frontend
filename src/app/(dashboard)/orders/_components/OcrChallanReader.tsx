"use client";

import { useState, useRef } from "react";
import {  useMutation  } from "@/lib/convex-mock";
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
} from "lucide-react";

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

type EditableResult = {
  partyName: string;
  date: string;
  challanNo: string;
  weaverName: string;
  weaverChallanNo: string;
  weaverMarka: string;
  chDate: string;
  qualityName: string;
  takaCount: string;
  totalMeter: string;
};

type Props = {
  onFill: (data: OcrResult | any[]) => void;
  onClose: () => void;
};

export default function OcrChallanReader({ onFill, onClose }: Props) {
  const generateUploadUrl = useMutation(api.orders.update); // Just using a valid api path to make it not crash, the actual OCR process is handled below.
  const extractChallan = useMutation(api.ocr.extract);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [storageId, setStorageId] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [editable, setEditable] = useState<EditableResult | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setOcrResult(null);
    setEditable(null);
    try {
      // Show preview
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
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

      // We use the local API endpoint now
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api"}/ocr/extract`, {
        method: "POST",
        body: formData,
        headers
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "OCR API failed" }));
        throw new Error(err.error || "OCR failed");
      }
      
      const data = await response.json();
      
      // Handle result (compatible with batch or single)
      const result = data.challans?.[0] || data;
      setOcrResult(result);
      setEditable({
        partyName: result.partyName ?? result.firm ?? result.party ?? "",
        date: result.date ?? result.challan_date ?? result.ch_date ?? "",
        challanNo: result.challanNo ?? result.challan_no ?? "",
        weaverName: result.weaverName ?? result.weaver ?? "",
        weaverChallanNo: result.weaverChallanNo ?? result.weaver_challan_no ?? "",
        weaverMarka: result.weaverMarka ?? result.weaver_marka ?? "",
        chDate: result.chDate ?? result.challan_date ?? result.ch_date ?? "",
        qualityName: result.qualityName ?? result.quality ?? "",
        takaCount: (result.takaCount ?? result.taka ?? "").toString(),
        totalMeter: (result.totalMeter ?? result.meter ?? "").toString(),
      });
      toast.success("Data extracted successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "OCR failed");
    } finally {
      setExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRetry = () => {
    if (storageId) runOcr(storageId, mimeType);
  };

  const handleConfirm = () => {
    if (!ocrResult || !editable) return;
    onFill({
      ...ocrResult,
      partyName: editable.partyName || ocrResult.partyName,
      date: editable.date || ocrResult.date,
      challanNo: editable.challanNo || ocrResult.challanNo,
      weaverName: editable.weaverName || ocrResult.weaverName,
      weaverChallanNo: editable.weaverChallanNo || ocrResult.weaverChallanNo,
      weaverMarka: editable.weaverMarka || ocrResult.weaverMarka,
      chDate: editable.chDate || ocrResult.chDate,
      qualityName: editable.qualityName || ocrResult.qualityName,
      takaCount: editable.takaCount ? Number(editable.takaCount) : ocrResult.takaCount,
      totalMeter: editable.totalMeter ? Number(editable.totalMeter) : ocrResult.totalMeter,
    });
  };

  const setEdit = (k: keyof EditableResult, v: string) =>
    setEditable((p) => (p ? { ...p, [k]: v } : p));

  const confidenceColor =
    ocrResult?.confidence === "high"
      ? "bg-green-100 text-green-700"
      : ocrResult?.confidence === "medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  const isLoading = uploading || extracting;

  return (
    <Card className="border-primary/30 bg-primary/5 mb-4 shadow-lg overflow-hidden flex flex-col max-h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            OCR Challan Reader
          </CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose} className="cursor-pointer h-7 w-7">
            <X size={16} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload a challan image or PDF — AI will extract and auto-fill the order form
        </p>
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
              <span className="text-xs text-muted-foreground">PDF / JPG / PNG</span>
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <Camera size={22} className="text-muted-foreground" />
              <span className="text-sm font-medium">Camera Scan</span>
              <span className="text-xs text-muted-foreground">Mobile camera</span>
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Spinner />
            <p className="text-sm text-muted-foreground">
              {uploading ? "Uploading challan..." : "Reading challan with AI OCR..."}
            </p>
          </div>
        )}

        {/* Preview + Result */}
        {!isLoading && ocrResult && editable && (
          <div className="space-y-4">
            {/* Confidence badge */}
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${confidenceColor}`}>
                {ocrResult.confidence === "high" ? "High Confidence" :
                  ocrResult.confidence === "medium" ? "Medium Confidence" : "Low Confidence — Please Verify"}
              </span>
              {ocrResult.unmatchedFields && ocrResult.unmatchedFields.length > 0 && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Verify: {ocrResult.unmatchedFields.join(", ")}
                </span>
              )}
            </div>

            {/* Preview thumbnail */}
            {previewUrl && (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Challan preview"
                  className="max-h-36 rounded-lg border border-border object-contain"
                />
              </div>
            )}

            {/* Editable extracted fields */}
            <div className="bg-background rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Extracted Data — Review Before Confirming
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Party Name</Label>
                  <Input className="h-8 text-sm" value={editable.partyName} onChange={(e) => setEdit("partyName", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Challan No</Label>
                  <Input className="h-8 text-sm" value={editable.challanNo} onChange={(e) => setEdit("challanNo", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input className="h-8 text-sm" value={editable.date} onChange={(e) => setEdit("date", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quality Name</Label>
                  <Input className="h-8 text-sm" value={editable.qualityName} onChange={(e) => setEdit("qualityName", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Weaver Name</Label>
                  <Input className="h-8 text-sm" value={editable.weaverName} onChange={(e) => setEdit("weaverName", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Weaver Challan No</Label>
                  <Input className="h-8 text-sm" value={editable.weaverChallanNo} onChange={(e) => setEdit("weaverChallanNo", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Weaver Marka</Label>
                  <Input className="h-8 text-sm font-mono" value={editable.weaverMarka} onChange={(e) => setEdit("weaverMarka", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CH Date</Label>
                  <Input className="h-8 text-sm" value={editable.chDate} onChange={(e) => setEdit("chDate", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Total Taka</Label>
                  <Input className="h-8 text-sm" type="number" value={editable.takaCount} onChange={(e) => setEdit("takaCount", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Total Meter</Label>
                  <Input className="h-8 text-sm" type="number" value={editable.totalMeter} onChange={(e) => setEdit("totalMeter", e.target.value)} />
                </div>
              </div>

              {/* Taka rows preview */}
              {ocrResult.takaRows && ocrResult.takaRows.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {ocrResult.takaRows.length} taka rows detected
                  </p>
                  <div className="max-h-28 overflow-y-auto bg-muted/40 rounded p-2 text-xs font-mono">
                    {ocrResult.takaRows.slice(0, 10).map((r, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="w-16">{r.takaNo}</span>
                        <span>{r.meter}m</span>
                        {r.weight && <span>{r.weight}kg</span>}
                      </div>
                    ))}
                    {ocrResult.takaRows.length > 10 && (
                      <p className="text-muted-foreground mt-1">...+{ocrResult.takaRows.length - 10} more</p>
                    )}
                  </div>
                </div>
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
                onClick={() => { setOcrResult(null); setEditable(null); setPreviewUrl(null); }}
                className="cursor-pointer gap-1"
              >
                <Upload size={13} /> New File
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                className="cursor-pointer gap-1 ml-auto"
              >
                <CheckCircle2 size={13} /> Use This Data
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

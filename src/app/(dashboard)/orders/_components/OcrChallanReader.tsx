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
  onFill: (data: any) => void;
  onClose: () => void;
};

export default function OcrChallanReader({ onFill, onClose }: Props) {
  const generateUploadUrl = useMutation(api.orders.update); // Just using a valid api path to make it not crash, the actual OCR process is handled below.
  const extractChallan = useMutation(api.ocr.extract);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setOcrResult(null);
    setLastFile(file);
    try {
      // Show preview for both images and PDFs
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
      toast.success("Data extracted successfully!");
      // Automatically feed into the parent form
      onFill({
        ...result,
        partyName: result.partyName ?? result.firm ?? result.party ?? "",
        date: result.date ?? result.challan_date ?? result.ch_date ?? "",
        challanNo: result.challanNo ?? result.challan_no ?? "",
        weaverName: result.weaverName ?? result.weaver ?? "",
        weaverChallanNo: result.weaverChallanNo ?? result.weaver_challan_no ?? "",
        weaverMarka: result.weaverMarka ?? result.weaver_marka ?? "",
        chDate: result.chDate ?? result.challan_date ?? result.ch_date ?? "",
        qualityName: result.qualityName ?? result.quality ?? "",
        takaCount: result.takaCount ?? result.taka ?? "",
        totalMeter: result.totalMeter ?? result.meter ?? "",
      });
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
    if (lastFile) runOcr(lastFile);
  };

  const confidenceColor =
    ocrResult?.confidence === "high"
      ? "bg-green-100 text-green-700"
      : ocrResult?.confidence === "medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  const isLoading = uploading || extracting;

  return (
    <Card className="border-primary/20 bg-muted/30 mb-6 shadow-md overflow-hidden flex flex-col">
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
        {!isLoading && ocrResult && (
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

            {/* Preview Document */}
            {previewUrl && (
              <div className="relative w-full rounded-lg border border-border overflow-hidden bg-muted/30">
                {mimeType.startsWith("image/") ? (
                  <img
                    src={previewUrl}
                    alt="Challan preview"
                    className="w-full max-h-[400px] object-contain"
                  />
                ) : mimeType === "application/pdf" ? (
                  <iframe
                    src={`${previewUrl}#toolbar=0`}
                    className="w-full h-[400px] border-none"
                    title="PDF Preview"
                  />
                ) : null}
              </div>
            )}

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
                onClick={() => { setOcrResult(null); setPreviewUrl(null); }}
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

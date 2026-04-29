"use client";

import { useState } from "react";
import { useMutation } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { Button } from "@/components/ui/button";
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
  Loader2,
  Zap,
} from "lucide-react";

interface QuickOrderUploadProps {
  onSuccess?: (orderIds: string[]) => void;
  onClose?: () => void;
  onFormFill?: (data: any) => void;
}

export function QuickOrderUpload({ onSuccess, onClose, onFormFill }: QuickOrderUploadProps) {
  const createBatch = useMutation(api.orders.createBatch);

  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [createdOrders, setCreatedOrders] = useState<string[]>([]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setProcessing(false);
    setCompleted(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Extract OCR data
      const ocrResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api"}/ocr/extract`,
        {
          method: "POST",
          body: formData,
          headers,
        }
      );

      if (!ocrResponse.ok) {
        const err = await ocrResponse
          .json()
          .catch(() => ({ error: "OCR API failed" }));
        throw new Error(err.error || "OCR failed");
      }

      const ocrData = await ocrResponse.json();
      setUploading(false);
      setProcessing(true);

      // First, populate the form with extracted data - pass full ocrData
      if (onFormFill) {
        onFormFill(ocrData);
        toast.info("📋 Form auto-filled with extracted data...");
      }

      // Transform to Order format
      const challans = Array.isArray(ocrData.challans)
        ? ocrData.challans
        : [ocrData];

      const payload = challans.map((c: any) => ({
        orderDate:
          c.date ||
          c.orderDate ||
          c.challan_date ||
          new Date().toISOString().split("T")[0],
        firmId: c.firmId || "",
        firmName: c.firmName || c.firm || c.delivery_at || "",
        partyId: c.partyId || "",
        partyName: c.partyName || c.party || "",
        partyChNo: c.challanNo || c.challan_no || c.ch_no || "",
        marka: c.marka || c.mka || "",
        weaverId: c.weaverId || "",
        weaverName: c.weaverName || c.weaver || c.firm || "",
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
        takaDetails: (c.takaRows || c.table || []).map((r: any) => ({
          takaNo: (r.takaNo || r.tn || "").toString(),
          marka: (r.marka || r.mka || "").toString(),
          meter: Number(r.meter) || 0,
          weight: Number(r.weight) || 0,
        })),
        ocrFileId: c.ocrFileId || "",
        ocrExtractedData: JSON.stringify(c),
      }));

      // Create batch orders
      const result = await createBatch({ challans: payload });
      const orderIds = result
        ?.map((r: any) => r.order?._id)
        .filter(Boolean) || [];

      setCreatedOrders(orderIds);
      setCompleted(true);

      toast.success(`✅ Successfully created ${orderIds.length} order(s)!`);

      if (onSuccess) {
        onSuccess(orderIds);
      }

      // Auto-close after 3 seconds if successful
      setTimeout(() => {
        if (onClose) onClose();
      }, 3000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to process file");
      console.error("Upload error:", e);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  if (completed) {
    return (
      <Card className="border-green-200 bg-green-50 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-green-900">
                ✅ Orders Auto-Saved & Form Populated!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {createdOrders.length} order{createdOrders.length !== 1 ? "s" : ""}{" "}
                created and form fields auto-filled with extracted data.
              </p>
              {createdOrders.length > 0 && (
                <div className="mt-3 p-2 bg-white rounded border border-green-200">
                  <p className="text-xs font-mono text-green-800">
                    Order IDs: {createdOrders.join(", ")}
                  </p>
                </div>
              )}
              <p className="text-xs text-green-700 mt-3 italic">
                You can now review the populated form and submit to proceed to challan creation.
              </p>
            </div>
            <Button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer"
            >
              Close & Review Form
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLoading = uploading || processing;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Zap size={18} className="text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Quick Order Upload</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a challan PDF and we'll create the order automatically
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Spinner />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              {uploading
                ? "Uploading challan..."
                : "Processing and creating orders..."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
              <Upload size={20} className="text-primary" />
              <span className="text-sm font-medium">Upload File</span>
              <span className="text-xs text-muted-foreground">
                PDF / JPG / PNG
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </label>

            <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
              <Camera size={20} className="text-primary" />
              <span className="text-sm font-medium">Capture Photo</span>
              <span className="text-xs text-muted-foreground">Mobile camera</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </label>
          </div>
        )}

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
          <AlertTriangle size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> Make sure the challan contains all required
            fields. Missing data will be marked as draft for manual editing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  FileText,
  Package,
  Scan,
  AlertTriangle,
  Loader2,
  User,
  Scissors,
  Camera,
  QrCode,
  X,
} from "lucide-react";
import OcrChallanReader from "./OcrChallanReader";
import { cn } from "@/lib/utils";

type TakaRow = {
  takaNo: string;
  marka: string;
  meter: string;
  weight: string;
};

type OrderForm = {
  orderDate: string;
  firmId: string;
  firmName: string;
  partyId: string;
  partyName: string;
  codeMasterId: string;
  partyChNo: string;
  marka: string;
  weaverId: string;
  weaverName: string;
  weaverChNo: string;
  weaverMarka: string;
  weaverGstin: string;
  weaverAddress: string;
  qualityId: string;
  qualityName: string;
  width: string;
  weight: string;
  length: string;
  chadhti: string;
  totalTaka: string;
  totalMeter: string;
  jobRate: string;
  greyRate: string;
  shippingMode: "DirectMills" | "MarketTempo" | "ByLR";
  lrNo: string;
  lrDate: string;
  transporterName: string;
  gstin: string; // Left for backwards compatibility, use partyGstin
  address: string; // Left for backwards compatibility, use partyAddress
  partyGstin: string;
  partyAddress: string;
  brokerName: string;
  vehicleNo: string;
  driverMobile: string;
  takaDetails: TakaRow[];
};

const emptyOrder = (): OrderForm => ({
  orderDate: new Date().toISOString().split("T")[0],
  firmId: "",
  firmName: "",
  partyId: "",
  partyName: "",
  codeMasterId: "",
  partyChNo: "",
  marka: "",
  weaverId: "",
  weaverName: "",
  weaverChNo: "",
  weaverMarka: "",
  weaverGstin: "",
  weaverAddress: "",
  qualityId: "",
  qualityName: "",
  width: "",
  weight: "",
  length: "",
  chadhti: "",
  totalTaka: "",
  totalMeter: "",
  jobRate: "",
  greyRate: "",
  shippingMode: "DirectMills",
  lrNo: "",
  lrDate: new Date().toISOString().split("T")[0],
  transporterName: "",
  gstin: "",
  address: "",
  partyGstin: "",
  partyAddress: "",
  brokerName: "",
  vehicleNo: "",
  driverMobile: "",
  takaDetails: [{ takaNo: "", marka: "", meter: "", weight: "" }],
});

interface BatchOrderEntryProps {
  onSuccess?: () => void;
  initialOrder?: any;
}

export function BatchOrderEntry({
  onSuccess,
  initialOrder,
}: BatchOrderEntryProps = {}) {
  const accounts = useQuery(api.accounts.list, {});
  const weavers = useQuery(api.weavers.list, {});
  const qualities = useQuery(api.qualities.list, {});
  const codeMaster = useQuery(api.codeMaster.list, {});
  const createBatch = useMutation(api.orders.createBatch);
  const updateOrder = useMutation(api.orders.update);

  const [orders, setOrders] = useState<OrderForm[]>(() => {
    if (initialOrder) {
      return [
        {
          ...emptyOrder(),
          orderDate: initialOrder.orderDate
            ? new Date(initialOrder.orderDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          firmId: initialOrder.firmId || "",
          firmName: initialOrder.firmName || "",
          partyId: initialOrder.masterId || initialOrder.partyId || "",
          partyName: initialOrder.masterName || initialOrder.partyName || "",
          partyChNo: initialOrder.partyChNo || "",
          marka: initialOrder.marka || "",
          weaverId: initialOrder.weaverId || "",
          weaverName: initialOrder.weaverName || "",
          weaverChNo: initialOrder.weaverChNo || "",
          weaverMarka: initialOrder.weaverMarka || "",
          qualityId: initialOrder.qualityId || "",
          qualityName: initialOrder.qualityName || "",
          width: initialOrder.width?.toString() || "",
          weight: initialOrder.weight?.toString() || "",
          length: initialOrder.length?.toString() || "",
          chadhti: initialOrder.chadhti?.toString() || "",
          totalTaka: initialOrder.totalTaka?.toString() || "",
          totalMeter: initialOrder.totalMeter?.toString() || "",
          jobRate: initialOrder.jobRate?.toString() || "",
          greyRate: initialOrder.greyRate?.toString() || "",
          shippingMode: initialOrder.shippingMode || "DirectMills",
          lrNo: initialOrder.lrNo || "",
          lrDate: initialOrder.lrDate || "",
          transporterName: initialOrder.transporterName || "",
          gstin: initialOrder.gstin || "",
          address: initialOrder.address || "",
          vehicleNo: initialOrder.vehicleNo || "",
          driverMobile: initialOrder.driverMobile || "",
          takaDetails: initialOrder.takaDetails?.map((t: any) => ({
            takaNo: t.takaNo || "",
            marka: t.marka || "",
            meter: t.meter?.toString() || "",
            weight: t.weight?.toString() || "",
          })) || [{ takaNo: "", marka: "", meter: "", weight: "" }],
        },
      ];
    }
    return [emptyOrder()];
  });
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncCommonFields, setSyncCommonFields] = useState(true);
  const [showOcr, setShowOcr] = useState(false);
  const [ocrAutoCamera, setOcrAutoCamera] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const mills = (accounts ?? []).filter(
    (a) => a.roleType === "Mill" && a.isActive,
  );
  const masterAccounts = (accounts ?? []).filter(
    (a) =>
      ["Master", "Customer", "Supplier"].includes(a.roleType) && a.isActive,
  );

  const updateField = (field: keyof OrderForm, value: any) => {
    setOrders((prev) =>
      prev.map((o, i) => (i === current ? { ...o, [field]: value } : o)),
    );
  };

  const updateOrderObject = (updates: Partial<OrderForm>) => {
    setOrders((prev) => {
      const next = [...prev];
      const updated = { ...next[current], ...updates };
      next[current] = updated;

      if (syncCommonFields && orders.length > 1) {
        const headerFields: (keyof OrderForm)[] = [
          "firmId",
          "firmName",
          "partyId",
          "partyName",
          "codeMasterId",
          "marka",
          "orderDate",
          "weaverId",
          "weaverName",
          "weaverMarka",
          "shippingMode",
          "transporterName",
          "vehicleNo",
          "driverMobile",
          "lrNo",
          "lrDate",
          "gstin",
          "address",
        ];

        const changedHeaderFields = headerFields.filter(
          (f) => updates[f] !== undefined,
        );

        if (changedHeaderFields.length > 0) {
          next.forEach((order, idx) => {
            if (idx === current) return;
            changedHeaderFields.forEach((f) => {
              if (!order[f] || order[f] === prev[current][f]) {
                (order as any)[f] = updates[f];
              }
            });
          });
        }
      }
      return next;
    });
  };

  const currentForm = orders[current] || emptyOrder();

  // FIX 1: Use index 0 (most recently added) instead of last index
  const getLastCodeMasterId = () => {
    if (!Array.isArray(codeMaster) || codeMaster.length === 0) return "";
    return codeMaster[0]._id || "";
  };

  const getCodeMasterMarka = (id: string) => {
    const cm = Array.isArray(codeMaster)
      ? (codeMaster as any[]).find((x) => x._id === id)
      : undefined;
    return cm?.marka || cm?.clientCode || cm?.code || "";
  };

  const getCodeMasterDisplay = (id: string) => {
    if (!id) return "Select code master...";
    const cm = Array.isArray(codeMaster)
      ? (codeMaster as any[]).find((x) => x._id === id)
      : undefined;
    if (!cm) return "Select code master...";
    return cm?.masterName || cm?.accountName || "Unknown";
  };

  // Helper: resolve code master from OCR marka string
  // Returns { cmId, defaultMarka } — always falls back to latest (index 0)
  const resolveCodeMaster = (ocrMarkaRaw: string, ocrMasterName?: string) => {
    const ocrMarka = (ocrMarkaRaw || "").trim().toLowerCase();

    // Only attempt match if marka is meaningful (length > 3 avoids "TES" from "TEXTILES")
    const matchingCm =
      ocrMarka.length > 3
        ? (codeMaster as any[])?.find(
            (cm: any) =>
              cm.marka?.trim().toLowerCase() === ocrMarka ||
              cm.masterName?.trim().toLowerCase() ===
                (ocrMasterName || "").trim().toLowerCase(),
          )
        : undefined;

    // If no match, fall back to latest added code master (index 0)
    const fallbackCm =
      !matchingCm && Array.isArray(codeMaster) && codeMaster.length > 0
        ? (codeMaster as any[])[0]
        : undefined;

    const cmId = matchingCm?._id || fallbackCm?._id || "";
    const defaultMarka =
      matchingCm?.marka ||
      matchingCm?.clientCode ||
      matchingCm?.code ||
      fallbackCm?.marka ||
      fallbackCm?.clientCode ||
      fallbackCm?.code ||
      "";

    return { cmId, defaultMarka };
  };

  const [lastPartyId, setLastPartyId] = useState<string | null>(null);
  const [lastWeaverId, setLastWeaverId] = useState<string | null>(null);
  const [lastCodeMasterId, setLastCodeMasterId] = useState<string | null>(null);
  const [defaultCodeMasterSet, setDefaultCodeMasterSet] = useState(false);

  // FIX 2: Use index 0 for the default code master on load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (
      !initialOrder &&
      Array.isArray(codeMaster) &&
      codeMaster.length > 0 &&
      !defaultCodeMasterSet
    ) {
      const latestCm = (codeMaster as any[])[0]; // index 0 = most recently added
      const latestCmId = latestCm._id || "";
      const latestCmMarka =
        latestCm?.marka || latestCm?.clientCode || latestCm?.code || "";
      if (latestCmId && orders[0]?.codeMasterId === "") {
        setOrders((prev) => {
          const updated = [...prev];
          if (updated[0]) {
            updated[0] = {
              ...updated[0],
              codeMasterId: latestCmId,
              marka: latestCmMarka,
            };
          }
          return updated;
        });
        setDefaultCodeMasterSet(true);
      }
    }
  }, [codeMaster, initialOrder]);

  useEffect(() => {
    if (
      currentForm.partyId &&
      currentForm.partyId !== lastPartyId &&
      masterAccounts
    ) {
      setLastPartyId(currentForm.partyId);
    }
  }, [currentForm.partyId, masterAccounts, lastPartyId]);

  useEffect(() => {
    if (
      currentForm.weaverId &&
      currentForm.weaverId !== lastWeaverId &&
      weavers
    ) {
      const w = weavers.find((x) => x._id === currentForm.weaverId);
      const targetMarka = w?.weaverCode || w?.marka || w?.weaverMarka || "";
      if (targetMarka) {
        updateOrderObject({ weaverMarka: targetMarka });
      }
      setLastWeaverId(currentForm.weaverId);
    }
  }, [currentForm.weaverId, weavers, lastWeaverId]);

  useEffect(() => {
    if (
      currentForm.codeMasterId &&
      currentForm.codeMasterId !== lastCodeMasterId &&
      codeMaster
    ) {
      const cm = (codeMaster as any[]).find(
        (x: any) => x._id === currentForm.codeMasterId,
      );
      const targetMarka = cm?.marka || cm?.clientCode || cm?.code || "";
      updateOrderObject({ marka: targetMarka });
      setLastCodeMasterId(currentForm.codeMasterId);
    }
  }, [currentForm.codeMasterId, codeMaster, lastCodeMasterId]);

  const updateTaka = (takaIdx: number, field: keyof TakaRow, value: string) => {
    setOrders((prev) =>
      prev.map((o, i) => {
        if (i !== current) return o;
        const newTakas = o.takaDetails.map((t, ti) =>
          ti === takaIdx ? { ...t, [field]: value } : t,
        );
        return { ...o, takaDetails: newTakas };
      }),
    );
  };

  const addTakaRow = () => {
    setOrders((prev) =>
      prev.map((o, i) => {
        if (i !== current) return o;
        return {
          ...o,
          takaDetails: [
            ...o.takaDetails,
            {
              takaNo: "",
              marka: "",
              meter: "",
              weight: "",
            },
          ],
        };
      }),
    );
  };

  const removeTakaRow = (idx: number) => {
    setOrders((prev) =>
      prev.map((o, i) => {
        if (i !== current) return o;
        return {
          ...o,
          takaDetails: o.takaDetails.filter((_, ti) => ti !== idx),
        };
      }),
    );
  };

  const handleTakaCountChange = (val: string) => {
    const n = parseInt(val);
    const updates: Partial<OrderForm> = { totalTaka: val };
    if (!isNaN(n) && n > 0 && n <= 500) {
      updates.takaDetails = Array.from({ length: n }, (_, i) => ({
        takaNo: String(""),
        marka: "",
        meter: "",
        weight: "",
      }));
    }
    updateOrderObject(updates);
  };

  const goTo = (n: number) => {
    setCurrent(Math.max(0, Math.min(orders.length - 1, n)));
  };

  const addNew = () => {
    setOrders((prev) => [...prev, emptyOrder()]);
    setCurrent(orders.length);
  };

  const handleReset = () => {
    if (confirm("Reset all entry data?")) {
      setOrders([emptyOrder()]);
      setCurrent(0);
      setShowOcr(false);
      setResetKey((prev) => prev + 1);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // FIXED FIRM — never override from scanned PDF
  // ────────────────────────────────────────────────────────────────────────────
  const FIXED_FIRM_NAME = "JAI MATA DI FASHIONS PVT. LTD.";
  const FIXED_FIRM_GSTIN = "24AABCA9842L1ZG";

  const getFixedFirmId = useCallback(() => {
    const firm = mills.find(
      (m) =>
        m.gstin?.trim().toUpperCase() === FIXED_FIRM_GSTIN ||
        m.accountName?.toUpperCase().includes("JAI MATA DI"),
    );
    return firm?._id || "";
  }, [mills]);

  // Helper: clean GST for matching
  const cleanGST = (gst: string) =>
    (gst || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Helper: match party by GSTIN against loaded master accounts
  const matchPartyByGstin = useCallback(
    (gstin: string) => {
      const clean = cleanGST(gstin);
      if (!clean || clean.length < 15) return null;
      return masterAccounts.find(
        (a) => cleanGST(a.gstin || "") === clean,
      ) || null;
    },
    [masterAccounts],
  );

  // Helper: match weaver by GSTIN against loaded weavers
  const matchWeaverByGstin = useCallback(
    (gstin: string) => {
      const clean = cleanGST(gstin);
      if (!clean || clean.length < 15) return null;
      return (weavers ?? []).find(
        (w: any) => cleanGST(w.gstin || "") === clean,
      ) || null;
    },
    [weavers],
  );

  const handleOcrFill = useCallback(
    (data: any) => {
      const challans = Array.isArray(data) ? data : data.challans || [data];

      // Resolve the fixed firm ID
      const fixedFirmId = getFixedFirmId();

      // Helper to process one challan into an OrderForm
      const processOneChallan = (c: any): Partial<OrderForm> => {
        // ── 1. FIRM: Always fixed ────────────────────────────────────
        const firmId = fixedFirmId;
        const firmName = FIXED_FIRM_NAME;

        // ── 2. PARTY: Match by GSTIN (priority) → backend partyId → name ─
        const partyGstin = c.party_obj?.gstin_no || c.gstin_no || "";
        let partyId = "";
        let partyName = "";
        let partyAddress = "";
        let partyGstinValue = "";

        // Priority 1: GSTIN match against frontend master data
        const partyByGst = matchPartyByGstin(partyGstin);
        if (partyByGst) {
          partyId = partyByGst._id;
          partyName = partyByGst.accountName || "";
          partyAddress = partyByGst.address || "";
          partyGstinValue = partyByGst.gstin || "";
        }
        // Priority 2: Backend already resolved partyId
        else if (c.partyId) {
          partyId = c.partyId;
          partyName = c.partyName || c.party || "";
        }
        // Priority 3: Name-based match
        else {
          const nameToMatch = (c.partyName || c.party || "").trim().toLowerCase();
          if (nameToMatch) {
            const match = masterAccounts.find(
              (a) => a.accountName?.trim().toLowerCase() === nameToMatch,
            );
            if (match) {
              partyId = match._id;
              partyName = match.accountName || "";
              partyAddress = match.address || "";
              partyGstinValue = match.gstin || "";
            }
          }
        }

        // Show error if party not found
        if (!partyId && partyGstin) {
          toast.error(`Customer not found in master database for GST: ${cleanGST(partyGstin)}`, {
            duration: 6000,
          });
        } else if (!partyId && (c.party || c.partyName)) {
          toast.error(`Customer "${c.party || c.partyName}" not found in master database`, {
            duration: 5000,
          });
        }

        // ── 3. WEAVER: Match by GSTIN (priority) → backend weaverId → name ─
        const weaverGstin = c.weaver_obj?.gstin_no || "";
        let weaverId = "";
        let weaverName = "";
        let weaverGstinValue = "";
        let weaverAddressValue = c.weaver_obj?.address || "";

        // Priority 1: GSTIN match
        const weaverByGst = matchWeaverByGstin(weaverGstin);
        if (weaverByGst) {
          weaverId = weaverByGst._id;
          weaverName = weaverByGst.weaverName || weaverByGst.accountName || "";
          weaverGstinValue = weaverByGst.gstin || weaverGstin;
          weaverAddressValue = weaverByGst.address || weaverAddressValue;
        }
        // Priority 2: Backend already resolved weaverId
        else if (c.weaverId) {
          weaverId = c.weaverId;
          weaverName = c.weaverName || c.weaver || "";
        }
        // Priority 3: Name-based match
        else {
          const nameToMatch = (c.weaverName || c.weaver || c.weaver_obj?.name || "").trim().toLowerCase();
          if (nameToMatch) {
            const match = (weavers ?? []).find(
              (w: any) => w.weaverName?.trim().toLowerCase() === nameToMatch,
            );
            if (match) {
              weaverId = match._id;
              weaverName = match.weaverName || "";
              weaverGstinValue = match.gstin || weaverGstin;
              weaverAddressValue = match.address || weaverAddressValue;
            }
          }
        }

        // Show error if weaver not found
        if (!weaverId && weaverGstin) {
          toast.error(`Weaver not found in master database for GST: ${cleanGST(weaverGstin)}`, {
            duration: 6000,
          });
        } else if (!weaverId && (c.weaver || c.weaverName || c.weaver_obj?.name)) {
          toast.error(`Weaver "${c.weaver || c.weaverName || c.weaver_obj?.name}" not found in master database`, {
            duration: 5000,
          });
        }

        // ── 4. QUALITY: backend qualityId → local name match ──────────
        let qualityId = c.qualityId || "";
        let qualityName2 = c.qualityName || c.quality || "";
        if (!qualityId) {
          const qMatch = qualities?.find(
            (q) =>
              q.qualityName?.toLowerCase() === qualityName2.toLowerCase(),
          );
          if (qMatch) {
            qualityId = qMatch._id;
            qualityName2 = qMatch.qualityName;
          }
        }

        // ── 5. CODE MASTER ────────────────────────────────────────────
        const { cmId, defaultMarka } = resolveCodeMaster(
          c.marka || c.mka || "",
          c.masterName || "",
        );

        const todayDate = new Date().toISOString().split("T")[0];

        return {
          orderDate: todayDate,
          firmId: firmId,
          firmName: firmName,
          partyId: partyId,
          partyName: partyName || c.partyName || c.party || "",
          codeMasterId: cmId,
          partyChNo: c.partyChNo || c.challanNo || c.challan_no || "",
          marka: defaultMarka || c.mka || "",
          weaverId: weaverId,
          weaverName: weaverName || c.weaverName || c.weaver || "",
          weaverChNo: c.weaverChNo || c.weaver_challan_no || "",
          weaverMarka: c.weaverMarka || c.weaver_marka || "",
          weaverGstin: weaverGstinValue || c.weaverGstin || weaverGstin,
          weaverAddress: weaverAddressValue || c.weaverAddress || "",
          qualityId: qualityId,
          qualityName: qualityName2,
          width: (c.width || "").toString(),
          weight: (c.weight || "").toString(),
          length: (c.length || "").toString(),
          chadhti: (c.chadhti || c.chadti || "").toString(),
          totalTaka: (c.totalTaka || c.takaCount || c.taka || "").toString(),
          totalMeter: (c.totalMeter || c.meter || "").toString(),
          lrNo: c.lrNo || c.lr_no || "",
          lrDate: c.lrDate || c.lr_date || todayDate,
          transporterName: c.transporterName || c.transpoter || c.transporter || "",
          gstin: partyGstinValue || c.gstin || c.gstin_no || "",
          address: partyAddress || c.address || c.party_address || "",
          partyGstin: partyGstinValue || c.gstin || c.gstin_no || "",
          partyAddress: partyAddress || c.address || c.party_address || "",
          brokerName: c.broker || c.agent || "",
          takaDetails: (c.takaRows || c.table || []).map((r: any) => ({
            takaNo: (r.takaNo || r.tn || "").toString(),
            marka: (r.marka || r.mka || "").toString(),
            meter: (r.meter || "").toString(),
            weight: (r.weight || "").toString(),
          })),
        };
      };

      if (challans.length > 1) {
        // ─── MULTI-CHALLAN BLOCK ───────────────────────────────────────────
        const mapped = challans.map((c: any) => ({
          ...emptyOrder(),
          ...processOneChallan(c),
        }));

        setOrders(mapped);
        setCurrent(0);

        // Summary toast
        const matchedParties = mapped.filter((o: any) => o.partyId).length;
        const matchedWeavers = mapped.filter((o: any) => o.weaverId).length;
        toast.success(
          `✅ ${challans.length} challan(s) loaded. Party: ${matchedParties}/${challans.length}, Weaver: ${matchedWeavers}/${challans.length} matched.`,
          { duration: 5000 },
        );
      } else {
        // ─── SINGLE-CHALLAN BLOCK ──────────────────────────────────────────
        const result = challans[0];
        const processed = processOneChallan(result);

        updateOrderObject({
          ...processed,
          takaDetails:
            processed.takaDetails && processed.takaDetails.length > 0
              ? processed.takaDetails
              : orders[current].takaDetails,
        });

        const matchInfo: string[] = [];
        if (processed.partyId) matchInfo.push("✓ Party matched");
        else matchInfo.push("✗ Party not found");
        if (processed.weaverId) matchInfo.push("✓ Weaver matched");
        else matchInfo.push("✗ Weaver not found");

        toast.success(`✅ OCR data loaded! ${matchInfo.join(" | ")}`, {
          duration: 5000,
        });
      }
    },
    [orders, current, qualities, weavers, mills, masterAccounts, syncCommonFields, codeMaster, getFixedFirmId, matchPartyByGstin, matchWeaverByGstin],
  );

  const handleSubmit = async () => {
    let invalidIndex = -1;
    const invalid = orders.find((o, idx) => {
      const isInvalid = !o.firmId || !o.qualityName || !o.totalMeter || !o.marka;
      if (isInvalid) invalidIndex = idx;
      return isInvalid;
    });

    if (invalid) {
      const missing: string[] = [];
      if (!invalid.firmId) missing.push("Firm");
      if (!invalid.qualityName) missing.push("Quality");
      if (!invalid.totalMeter) missing.push("Meter");
      if (!invalid.marka) missing.push("Marka");

      toast.error(`Challan ${invalidIndex + 1}: Missing ${missing.join(", ")}`, {
        description: "Please fill all required fields before submitting.",
      });
      setCurrent(invalidIndex);
      return;
    }
    setLoading(true);
    try {
      const payload = orders.map((o) => ({
        ...o,
        totalTaka: Number(o.totalTaka),
        totalMeter: Number(o.totalMeter),
        width: Number(o.width) || 0,
        weight: Number(o.weight) || 0,
        length: Number(o.length) || 0,
        chadhti: Number(o.chadhti) || 0,
        jobRate: Number(o.jobRate) || 0,
        greyRate: Number(o.greyRate) || 0,
        takaDetails: o.takaDetails.map((t) => ({
          ...t,
          takaNo: t.takaNo || "",
          meter: Number(t.meter),
          weight: Number(t.weight) || 0,
        })),
      }));
      if (initialOrder) {
        await updateOrder({ id: initialOrder._id, ...payload[0] });
        toast.success("Order updated!");
      } else {
        const results = await createBatch({ challans: payload });
        const errors = results.filter((r: any) => r.error);
        if (errors.length > 0) {
          console.error("Batch save errors:", errors);
          toast.error(`Failed to save ${errors.length} order(s)`, {
            description: errors[0].error || "Validation failed on server.",
            duration: 6000,
          });
          return;
        }
        toast.success(`Successfully submitted ${orders.length} orders!`);
      }
      if (onSuccess) onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  const form = orders[current] || emptyOrder();
  const sumMeters = form.takaDetails.reduce(
    (s, r) => s + (parseFloat(r.meter) || 0),
    0,
  );
  const meterMismatch =
    form.totalMeter !== "" &&
    Math.abs(sumMeters - parseFloat(form.totalMeter)) > 0.1;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border p-4 rounded-xl shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {initialOrder ? "Edit Order Detail" : "Inward Batch Entry"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Review and submit multiple challans at once
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!initialOrder && (
            <>
              <Button
                variant={showOcr ? "destructive" : "outline"}
                size="sm"
                onClick={() => setShowOcr(!showOcr)}
                className="cursor-pointer"
              >
                {showOcr ? (
                  <>
                    <X size={14} className="mr-2" /> Close Preview
                  </>
                ) : (
                  <>
                    <Scan size={14} className="mr-2" /> OCR Scan PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="cursor-pointer"
              >
                <RotateCcw size={14} className="mr-2" /> Reset
              </Button>
            </>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="cursor-pointer shadow-md bg-green-600 hover:bg-green-700 text-white font-bold"
          >
            {loading ? (
              <Loader2 className="mr-2 animate-spin" size={14} />
            ) : (
              <CheckCircle size={14} className="mr-2" />
            )}
            {initialOrder ? "Update Order" : `Submit All (${orders.length})`}
          </Button>
        </div>
      </div>

      <div className={cn(
        "grid grid-cols-1 gap-6 items-start",
        showOcr ? "lg:grid-cols-2" : "lg:grid-cols-12"
      )}>
        {/* Left Side: OCR Scan / PDF Preview */}
        {!initialOrder && showOcr && (
          <div className="lg:sticky lg:top-[80px]">
            <OcrChallanReader
              key={resetKey}
              variant="split"
              onFill={(res) => {
                handleOcrFill(res);
              }}
              onClose={() => setShowOcr(false)}
            />
          </div>
        )}

        {/* Right Side: Form Content */}
        <div className={cn(
          "space-y-6",
          showOcr ? "lg:col-span-1" : "lg:col-span-12"
        )}>
          <div className={cn(
            "grid grid-cols-1 gap-6 items-start",
            showOcr ? "grid-cols-1" : "lg:grid-cols-12"
          )}>
            <div className={cn(
              "space-y-6",
              showOcr ? "col-span-1" : "lg:col-span-8"
            )}>
          {!initialOrder && (
            <Card className="shadow-sm">
              <div className="flex items-center justify-between gap-4 p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Challan Selection
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => goTo(current - 1)}
                        disabled={current === 0}
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <span className="text-sm font-bold text-primary">
                        {current + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        of {orders.length}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => goTo(current + 1)}
                        disabled={current === orders.length - 1}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 rounded-xl border border-primary/10">
                  <input
                    type="checkbox"
                    id="sync-common-fields"
                    checked={syncCommonFields}
                    onChange={(e) => setSyncCommonFields(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <label
                    htmlFor="sync-common-fields"
                    className="text-xs font-bold uppercase cursor-pointer select-none"
                  >
                    Sync common fields across pages
                  </label>
                </div>
              </div>

              <div className="p-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t bg-muted/5">
                {orders.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-xs font-bold border transition-all shrink-0",
                      i === current
                        ? "bg-primary text-white scale-110 shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={addNew}
                  className="w-9 h-9 rounded-lg border border-dashed border-primary/40 text-primary hover:bg-primary/5 flex items-center justify-center transition-colors shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>
            </Card>
          )}

          {/* Basic Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText size={16} className="text-primary" /> Basic Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Date *
                </Label>
                <Input
                  type="date"
                  value={form.orderDate}
                  onChange={(e) => updateField("orderDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Firm Name (Mill) *
                </Label>
                <Select
                  value={form.firmId}
                  onValueChange={(v) => {
                    const m = mills.find((x) => x._id === v);
                    updateOrderObject({
                      firmId: v,
                      firmName: m?.accountName || "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mills.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Party Name
                </Label>
                <Select
                  value={form.partyId}
                  onValueChange={(v) => {
                    const p = masterAccounts.find((x) => x._id === v);
                    updateOrderObject({
                      partyId: v,
                      partyName: p?.accountName || "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select party..." />
                  </SelectTrigger>
                  <SelectContent>
                    {masterAccounts.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Code Master
                </Label>
                <Select
                  value={form.codeMasterId}
                  onValueChange={(v) => {
                    const cm = (codeMaster as any[])?.find((x: any) => x._id === v);
                    updateOrderObject({
                      codeMasterId: v,
                      marka: cm?.marka || cm?.clientCode || "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        codeMaster ? "Select code master..." : "Loading..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {codeMaster &&
                    Array.isArray(codeMaster) &&
                    codeMaster.length > 0 ? (
                      codeMaster.map((cm: any) => (
                        <SelectItem key={cm._id} value={cm._id}>
                          <div className="flex flex-col py-1">
                            <span>{cm.masterName || cm.accountName}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty">No Code Masters</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Marka
                </Label>
                <Input
                  value={form.marka}
                  onChange={(e) => updateField("marka", e.target.value)}
                  placeholder="Enter marka"
                />
              </div>

            </CardContent>
          </Card>

          {/* Weaver Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User size={16} className="text-primary" /> Weaver Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Date
                </Label>
                <Input
                  type="date"
                  value={Date.now() > new Date(form.lrDate).getTime() ? form.lrDate : ""}
                  onChange={(e) => updateField("lrDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Weaver Name
                </Label>
                <Select
                  value={form.weaverId}
                  onValueChange={(v) => {
                    const w = weavers?.find((x) => x._id === v);
                    updateOrderObject({
                      weaverId: v,
                      weaverName: w?.weaverName || "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select weaver..." />
                  </SelectTrigger>
                  <SelectContent>
                    {weavers?.map((w) => (
                      <SelectItem key={w._id} value={w._id}>
                        {w.weaverName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Weaver Marka
                </Label>
                <Input
                  value={form.weaverMarka}
                  onChange={(e) => updateField("weaverMarka", e.target.value)}
                  placeholder="Enter weaver marka"
                />
              </div>
                            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Weaver Challan No
                </Label>
                <Input
                  value={form.weaverChNo}
                  onChange={(e) => updateField("weaverChNo", e.target.value)}
                  placeholder="Enter weaver challan no"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fabric Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package size={16} className="text-primary" /> Fabric Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Quality Name *
                </Label>
                <Select
                  value={form.qualityId}
                  onValueChange={(v) => {
                    const q = qualities?.find((x) => x._id === v);
                    updateOrderObject({
                      qualityId: v,
                      qualityName: q?.qualityName || "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality..." />
                  </SelectTrigger>
                  <SelectContent>
                    {qualities?.map((q) => (
                      <SelectItem key={q._id} value={q._id}>
                        {q.qualityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Width (inches)
                </Label>
                <Input
                  value={form.width}
                  onChange={(e) => updateField("width", e.target.value)}
                  placeholder="44"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Weight (kg)
                </Label>
                <Input
                  value={form.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Length
                </Label>
                <Input
                  value={form.length}
                  onChange={(e) => updateField("length", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Chadti
                </Label>
                <Input
                  value={form.chadhti}
                  onChange={(e) => updateField("chadhti", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Total Taka *
                </Label>
                <Input
                  type="number"
                  value={form.totalTaka}
                  onChange={(e) => handleTakaCountChange(e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Total Meter *
                </Label>
                <div className="relative">
                  <Input
                    className={cn(meterMismatch && "border-destructive")}
                    value={form.totalMeter}
                    onChange={(e) => updateField("totalMeter", e.target.value)}
                    placeholder="2000"
                  />
                  {meterMismatch && (
                    <AlertTriangle
                      className="absolute right-3 top-2.5 text-destructive"
                      size={18}
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Job Rate
                </Label>
                <Input
                  value={form.jobRate}
                  onChange={(e) => updateField("jobRate", e.target.value)}
                  placeholder="5.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Grey Rate
                </Label>
                <Input
                  value={form.greyRate}
                  onChange={(e) => updateField("greyRate", e.target.value)}
                  placeholder="45.00"
                />
              </div>
            </CardContent>
          </Card>
            </div>

            <div className={cn(
              "sticky top-[80px]",
              showOcr ? "col-span-1 relative lg:static" : "lg:col-span-4"
            )}>
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Scissors size={16} className="text-primary" /> Taka Details
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={addTakaRow}
                className="h-7 text-[10px] uppercase font-bold"
              >
                <Plus size={12} className="mr-1" /> Add Row
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0 z-10 border-b">
                    <tr>
                      <th className="px-3 py-2 text-center w-12 font-bold uppercase text-[9px] text-muted-foreground">
                        #
                      </th>
                      <th className="px-3 py-2 text-left font-bold uppercase text-[9px] text-muted-foreground">
                        Taka No
                      </th>
                      <th className="px-3 py-2 text-left font-bold uppercase text-[9px] text-muted-foreground">
                        Meter
                      </th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {form.takaDetails.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/10 group">
                        <td className="px-3 py-2 text-center text-muted-foreground font-mono">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            className="h-7 text-xs font-mono bg-transparent border-none focus:ring-1"
                            value={row.takaNo || ""}
                            onChange={(e) =>
                              updateTaka(idx, "takaNo", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            className="h-7 text-xs font-mono bg-transparent border-none focus:ring-1"
                            value={row.meter || ""}
                            onChange={(e) =>
                              updateTaka(idx, "meter", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeTakaRow(idx)}
                            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t bg-muted/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">
                    Total Taka
                  </span>
                  <span className="text-lg font-bold leading-none text-primary">
                    {form.totalTaka || String(form.takaDetails.length)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">
                    Total Meter
                  </span>
                  <span className="text-lg font-bold text-muted-foreground leading-none">
                    {form.totalMeter || "0"}m
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
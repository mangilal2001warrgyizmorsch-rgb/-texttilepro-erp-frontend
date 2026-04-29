# PDF Auto-Save & Auto-Master Creation Implementation Guide

## 🎯 Overview

Your system now has **complete PDF OCR auto-save functionality** with automatic master data creation. When you upload a PDF/document:

1. ✅ **AI extracts data** (OCR via external API)
2. ✅ **Masters auto-created** (Party, Weaver, Quality, Transporter auto-generated if missing)
3. ✅ **Orders auto-saved** (Optional toggle to save directly without manual editing)
4. ✅ **Data auto-populated** (All fields mapped to order model)

---

## 🚀 Two Usage Modes

### **Mode 1: Smart Fill + Manual Edit** (Default)
**Best for:** Verifying data before saving

**Flow:**
1. Click **"OCR Scan PDF"** in order entry
2. Upload PDF/image
3. AI extracts data → Auto-fills form
4. Review/edit fields
5. Click **"Submit All"** to save

**Implementation:** `OcrChallanReader.tsx` with `autoSave={false}`

---

### **Mode 2: One-Click Auto-Save** (New)
**Best for:** Quick bulk orders with trusted sources

**Flow:**
1. Upload PDF
2. Check **"Auto-save orders"** toggle
3. AI extracts + **Immediately creates** orders
4. Success notification with order IDs
5. Done in seconds

**Implementation:** 
- `OcrChallanReader.tsx` with `autoSave={true}` toggle
- `QuickOrderUpload.tsx` (New dedicated component)

---

## 📁 Files Modified & Created

### **Frontend Changes**

#### 1. **[OcrChallanReader.tsx](src/app/%28dashboard%29/orders/_components/OcrChallanReader.tsx)** (Enhanced)
**What's new:**
- Added `autoSave` and `onAutoSaveSuccess` props
- Toggle checkbox for **"Auto-save orders after extraction"**
- `handleAutoSave()` function to create batch orders
- Success card with created order IDs
- `autoSaving` state management

**Key additions:**
```tsx
const [enableAutoSave, setEnableAutoSave] = useState(autoSave ?? false);
const [savedOrderIds, setSavedOrderIds] = useState<string[]>([]);

const handleAutoSave = async (ocrData: any) => {
  // Transform OCR data to Order format
  // Call createBatch mutation
  // Display success with order IDs
}
```

#### 2. **[QuickOrderUpload.tsx](src/app/%28dashboard%29/orders/_components/QuickOrderUpload.tsx)** (New)
**Purpose:** Standalone quick-upload component for new order entry flow

**Features:**
- File upload + Camera capture
- Auto-processes and creates orders
- Shows success notification
- Auto-closes after 3 seconds
- Perfect for "New Order" quick button

**Usage:**
```tsx
import { QuickOrderUpload } from "./_components/QuickOrderUpload";

<QuickOrderUpload 
  onSuccess={(orderIds) => console.log("Created:", orderIds)}
  onClose={() => router.push("/orders")}
/>
```

---

### **Backend Changes**

#### 3. **[routes/orders.js](routes/orders.js)** (Enhanced)
**What's new:**
- `enrichOrderData()` helper function
- Master lookup and resolution for:
  - Firm (Account with roleType="Mill")
  - Party (Account with roleType="Master|Customer|Supplier")
  - Quality
  - Weaver
  - Transporter
- Enhanced batch creation with validation
- Warning messages for missing fields
- OCR data preservation in `ocrExtractedData` field

**Key function:**
```javascript
async function enrichOrderData(data) {
  // Resolves firmId from firmName
  // Resolves partyId from partyName
  // Resolves qualityId from qualityName
  // Resolves weaverId from weaverName
  // Resolves transporterId from transportName
  // Returns enriched data with IDs
}
```

#### 4. **[routes/ocr.js](routes/ocr.js)** (Already Complete)
Already auto-creates missing masters during OCR extraction:
- Auto-creates Party with GSTIN parsing
- Auto-creates Weaver with auto-generated code
- Auto-creates Quality with HSN code
- Auto-creates Transporter if needed

---

## 🔄 Complete Data Flow

```
PDF Upload
   ↓
OCR Extraction (challan-extractor.onrender.com)
   ├→ Parse document
   ├→ Extract fields
   └→ Auto-create missing masters (ensureMasters)
   ↓
Transform OCR → Order Format
   ├→ Map all fields
   ├→ Resolve IDs
   ├→ Convert numbers
   └→ Store OCR raw data
   ↓
Create Batch Orders
   ├→ Enrich with master lookups
   ├→ Validate required fields
   └→ Save to MongoDB (draft status)
   ↓
User Notification
   ├→ Success toast
   ├→ Order IDs displayed
   └→ Auto-redirect (optional)
```

---

## 📊 Data Mapping (OCR → Order)

### **Basic Fields**
| OCR Field | Order Field | Notes |
|-----------|------------|-------|
| `date` | `orderDate` | ISO date format |
| `party` | `partyName` + `partyId` | Looked up from masters |
| `firm` / `delivery_at` | `firmName` + `firmId` | Auto-resolved |
| `weaver` | `weaverName` + `weaverId` | Auto-resolved |
| `quality` | `qualityName` + `qualityId` | Auto-resolved |
| `challan_no` | `partyChNo` | Source document |

### **Fabric Specifications**
| OCR Field | Order Field |
|-----------|------------|
| `width` | `width` (Number) |
| `weight` | `weight` (Number) |
| `meter` | `totalMeter` (Number) |
| `taka` / `takaCount` | `totalTaka` (Number) |
| `chadhti` / `chadti` | `chadti` (Number) |

### **Shipping Details**
| OCR Field | Order Field |
|-----------|------------|
| `lr_no` | `lrNo` |
| `transporter` | `transportName` + `transporterId` |
| `vehicle_no` | `vehicleNo` |
| `driver_mobile` | `driverMobile` |

### **Taka Details Array**
```javascript
OCR: takaRows = [
  { takaNo: "1", marka: "A1", meter: 100, weight: 50 },
  { takaNo: "2", marka: "A2", meter: 150, weight: 75 }
]
    ↓ (transforms to)
Order.takaDetails = [
  { takaNo: "1", marka: "A1", meter: 100, weight: 50, isStamped: false },
  { takaNo: "2", marka: "A2", meter: 150, weight: 75, isStamped: false }
]
```

---

## 🎮 How to Use

### **Scenario 1: Standard Order Entry with OCR**

```
1. Navigate to → Orders → New Order Entry
2. Click "OCR Scan PDF" button
3. Upload challan PDF
4. View extracted data in form
5. Edit/verify as needed
6. Click "Submit All"
```

**Result:** Order saved with status "draft" ready for challan creation

---

### **Scenario 2: Quick Auto-Save (Bulk Import)**

```
1. Navigate to → Orders → New Order Entry
2. Click "OCR Scan PDF" button
3. Enable toggle: "Auto-save orders after extraction"
4. Upload PDF
5. ✅ Order automatically created and saved
6. Notification shows order ID
```

**Result:** Order saved immediately, no editing needed

---

### **Scenario 3: Quick Upload Button (Future)**

You can add a "Quick Order Upload" button on the main Orders page:

```tsx
// In src/app/(dashboard)/orders/page.tsx
<Link href="/orders/quick-upload">
  <Button size="sm" className="gap-2">
    <Zap size={16} /> Quick Upload
  </Button>
</Link>

// In src/app/(dashboard)/orders/quick-upload/page.tsx
import { QuickOrderUpload } from "../_components/QuickOrderUpload";

export default function QuickUploadPage() {
  return (
    <div className="p-6">
      <QuickOrderUpload onClose={() => router.push("/orders")} />
    </div>
  );
}
```

---

## 🤖 Auto-Master Creation Details

### **Party Creation (Customer)**
```javascript
// If Party not found during OCR:
{
  accountName: "ACME Industries",           // From PDF
  roleType: "Customer",
  gstin: "18AABCT1234H1Z0",                // Extracted/parsed
  panNo: "ABCT1234H",                       // Derived from GSTIN
  gstType: "Regular",
  address: "Mumbai, Maharashtra",           // Parsed from PDF
  city: "Mumbai",
  state: "Maharashtra",
  isActive: true
}
```

### **Weaver Creation**
```javascript
// If Weaver not found during OCR:
{
  weaverName: "Rajesh Weaver",
  weaverCode: "RAJ" + Math.random()         // Auto-generated
}
```

### **Quality Creation**
```javascript
// If Quality not found during OCR:
{
  qualityName: "60/60 Cotton",              // From PDF
  processType: "Dyeing",                    // Default
  hsnCode: "5208"                           // Extracted if available
}
```

---

## ✅ Validation & Error Handling

### **Required Fields Check**
If order creation happens and required fields are missing:

```javascript
const requiredFields = ["firmId", "qualityName", "totalMeter"];
// Returns warning: "Missing: firmId, totalMeter"
// Order still created as DRAFT for manual completion
```

### **Error Recovery**
- If individual challan fails: Batch continues, error returned for that item
- If masters can't be created: Order created without resolution (manual fix needed)
- If OCR API times out: 504 error returned, user can retry

---

## 🧪 Testing Checklist

- [ ] Upload single challan PDF → Auto-save toggle OFF → Form auto-fills
- [ ] Upload single challan PDF → Auto-save toggle ON → Order created immediately
- [ ] Upload multi-challan PDF → Creates multiple orders
- [ ] Verify Party auto-created with GSTIN parsing
- [ ] Verify Weaver auto-created with code
- [ ] Verify Quality auto-created
- [ ] Check order status is "draft" after creation
- [ ] Verify ocrExtractedData saved for audit trail
- [ ] Test master lookups in enrichOrderData()
- [ ] Verify validation warnings for missing fields

---

## 🔐 Security Considerations

1. **Auth Required:** All endpoints require `requireAuth` middleware
2. **Rate Limiting:** Consider adding rate limits to `/api/ocr/extract` (heavy processing)
3. **File Size:** 15MB limit enforced on uploads
4. **Data Validation:** OCR data validated before master creation
5. **Audit Trail:** Raw OCR data stored in `ocrExtractedData` for audit

---

## 🚀 Future Enhancements

1. **Smart Field Mapping:** ML model to detect if field is already in masters before auto-creating
2. **Duplicate Detection:** Check if order already exists before creating
3. **Batch API:** Accept multiple files at once
4. **Status Webhooks:** Notify when orders reach certain status
5. **Template Support:** Store document templates for different challan formats
6. **Confidence Threshold:** Auto-save only if OCR confidence > threshold
7. **Scheduled Processing:** Queue PDFs for off-peak processing
8. **Mobile Camera:** Improved camera capture with document edge detection

---

## 📞 Support & Debugging

### **If auto-save isn't working:**
1. Check browser console for errors
2. Verify API URL in `NEXT_PUBLIC_API_URL` env
3. Check backend at `/api/orders/batch` endpoint
4. Verify auth token in `localStorage`

### **If masters aren't auto-creating:**
1. Check `/api/ocr/extract` response for master IDs
2. Verify Account/Quality/Weaver models have records
3. Check case-sensitivity in name matching (regex handles this)
4. Review backend logs for enrichOrderData errors

### **If OCR extraction fails:**
1. Verify PDF is readable
2. Check external API status: `challan-extractor.onrender.com`
3. Verify file size < 15MB
4. Try JPG/PNG image format first (faster processing)

---

## 📋 Summary

Your ERP now supports:
- ✅ PDF document extraction via AI OCR
- ✅ Automatic master data creation (Party, Weaver, Quality, etc.)
- ✅ Optional one-click order creation (auto-save)
- ✅ Form auto-fill with manual editing capability
- ✅ Batch order creation with validation
- ✅ Full audit trail via OCR data storage

**Get started:** Upload a challan PDF and select your mode (edit or auto-save) — that's it!

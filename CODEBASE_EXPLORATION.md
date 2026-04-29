# TextilePro ERP Frontend & Backend Codebase Exploration

## 🎯 Executive Summary

This document provides a comprehensive understanding of the TextilePro ERP system's order entry implementation, data structures, and file handling mechanisms across the frontend (Next.js) and backend (Node.js/Express/MongoDB).

---

## 1. ORDER ENTRY IMPLEMENTATION

### 📍 Frontend Location
```
-texttilepro-erp-frontend/src/app/(dashboard)/orders/
├── page.tsx                          ← Order list page
├── new/page.tsx                      ← New order entry page
└── _components/
    ├── BatchOrderEntry.tsx           ← Main order form (multi-order batch)
    ├── OcrChallanReader.tsx          ← OCR file upload & extraction
    ├── OrderHistory.tsx              ← Order list/history view
    └── OrderDetailModal.tsx          ← Order detail view
```

### 🎨 UI Component: BatchOrderEntry.tsx
**Purpose**: Multi-order batch entry form with manual or OCR input

**Key Features**:
- ✅ Batch order entry (add multiple orders at once)
- ✅ Manual form with all order fields
- ✅ Auto-marka population (Party & Weaver)
- ✅ Dynamic taka details table
- ✅ OCR integration for PDF/image uploads
- ✅ Navigation between orders (prev/next)

**Form Structure**:
```typescript
type OrderForm = {
  // Basic Details
  orderDate: string;
  firmId: string;              // Mill (ObjectId)
  firmName: string;
  partyId: string;             // Party/Customer (ObjectId)
  partyName: string;
  partyChNo: string;           // Party challan number
  marka: string;               // Order marka (auto-filled)

  // Weaver Information
  weaverId: string;            // ObjectId
  weaverName: string;
  weaverChNo: string;
  weaverMarka: string;         // Auto-filled from Weaver master
  weaverChDate: string;

  // Fabric Specifications
  qualityId: string;           // ObjectId
  qualityName: string;
  width: string;
  weight: string;
  length: string;
  chadhti: string;
  totalTaka: string;           // Number of pieces
  totalMeter: string;
  jobRate: string;
  greyRate: string;

  // Shipping Details
  shippingMode: "DirectMills" | "MarketTempo" | "ByLR";
  vehicleNo: string;
  driverMobile: string;
  transporterName: string;
  lrNo: string;
  lrDate: string;

  // Party Details
  gstin: string;
  address: string;

  // Taka Details (Dynamic Array)
  takaDetails: TakaRow[];
}

type TakaRow = {
  takaNo: string;
  marka: string;
  meter: string;
  weight: string;
}
```

**Auto-Population Logic** (useEffect hooks):
```
Party Selected → Fetch clientCode from Account → Auto-fill marka
Weaver Selected → Fetch weaverCode from Weaver → Auto-fill weaverMarka
Taka Count Changed → Generate N empty taka rows
```

---

## 2. ORDER SCHEMA & DATA STRUCTURE (Backend)

### 📁 Model Location
`texttilepro-erp-backend/models/Order.js`

### 📊 Order Schema (MongoDB)
```javascript
{
  // Dates & IDs
  orderDate: String (required),
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // Firm/Mill References
  firmId: ObjectId → Account (required),
  firmName: String (required),

  // Party/Master References
  masterId: ObjectId → Account,
  masterName: String,
  partyChallanNo: String,

  // Marka Identification
  marka: String (required),

  // ===== WEAVER DETAILS =====
  weaverId: ObjectId → Weaver,
  weaverName: String,
  weaverChNo: String,
  weaverMarka: String,
  weaverChDate: String,

  // ===== FABRIC SPECIFICATIONS =====
  qualityId: ObjectId → Quality,
  qualityName: String (required),
  weight: Number,              // kg
  length: Number,              // meters
  width: Number,               // cm
  chadti: Number,              // width adjustment
  totalTaka: Number (required), // piece count
  totalMeter: Number (required),
  jobRate: Number,             // per meter
  greyRate: Number,            // per meter

  // ===== SHIPPING/LOGISTICS =====
  shippingMode: String(required) [
    "DirectMills",
    "MarketTempo",
    "ByLR"
  ],
  vehicleNo: String,
  driverMobile: String,
  transportName: String,
  lrNo: String,                // Lorry Receipt number
  lrDate: String,
  noBales: Number,
  baleNo: String,
  receiverName: String,
  receiverMobile: String,
  chequeAmount: Number,
  lrFileId: String,            // Reference to LR file

  // ===== TAKA DETAILS ARRAY =====
  takaDetails: [{
    takaNo: String (required),
    marka: String,
    meter: Number (required),
    weight: Number,
    isStamped: Boolean,
    stampedAt: String,
    _id: false
  }],

  // ===== STATUS WORKFLOW =====
  status: String (required) [
    "draft",                   // Initial state
    "PendingChallan",         // Awaiting challan creation
    "ChallanIssued",          // Challan issued
    "LotCreated",             // Lot created from challan
    "InProcess",              // In production
    "Completed",              // Production finished
    "Dispatched"              // Shipped to customer
  ],

  // ===== OCR & DOCUMENT REFERENCES =====
  ocrFileId: String,           // Reference to OCR source document
  ocrExtractedData: String,    // Raw OCR extraction result
}
```

### 🔄 Order Status Workflow
```
┌─────────┐
│ draft   │  ← Order created, awaiting challan
└────┬────┘
     │
     ↓
┌──────────────┐
│ PendingChall │  ← Ready for challan creation
└────┬─────────┘
     │
     ↓
┌───────────────┐
│ ChallanIssued │  ← Challan created
└────┬──────────┘
     │
     ↓
┌──────────────┐
│ LotCreated   │  ← Lot created for processing
└────┬─────────┘
     │
     ↓
┌──────────────┐
│ InProcess    │  ← Under dyeing/printing
└────┬─────────┘
     │
     ↓
┌──────────────┐
│ Completed    │  ← Processing done
└────┬─────────┘
     │
     ↓
┌──────────────┐
│ Dispatched   │  ← Shipped to customer
└──────────────┘
```

### 🔑 Key Indexes
```javascript
orderSchema.index({ status: 1 });      // Filter by status
orderSchema.index({ firmId: 1 });      // Filter by mill
```

---

## 3. MASTER ENTITIES OVERVIEW

### 📋 All Master Models (13 Total)

| # | Model | Purpose | Key Fields |
|---|-------|---------|-----------|
| 1 | **Account** | Multi-role master (Mills, Customers, Weavers, Transporters) | `roleType`, `accountName`, `gstin`, `panNo`, `clientCode` |
| 2 | **Quality** | Fabric quality specifications | `qualityName`, `hsnCode`, `processType`, `gsm`, `width` |
| 3 | **Weaver** | Weaver supplier master | `weaverName`, `weaverCode`, `gstin`, `mobileNo` |
| 4 | **CodeMaster** | Party code & quality mappings | `accountId`, `clientCode`, `quality`, `masterName` |
| 5 | **Location** | Warehouse storage locations | `locationId`, `section` (Grey/Processing/Finished), `capacityMeter` |
| 6 | **Lot** | Production lots (from Orders/Challans) | `lotNo`, `orderId`, `partyId`, `qualityName`, `totalMeter` |
| 7 | **Challan** | Inbound documents from weavers | `challan_no`, `firm`, `party`, `quality`, `table` (taka details) |
| 8 | **JobCard** | Production work cards | `jobCardNo`, `lotId`, `processType`, `colorRecipe`, `chemicals` |
| 9 | **ProcessIssue** | Process tracking | `issueNo`, `lotId`, `processType`, `machineNo` |
| 10 | **Dispatch** | Outbound shipments | `dispatchNo`, `lotId`, `finishedMeter`, `shippingMode` |
| 11 | **Bill** | Customer invoices | `billNo`, `partyId`, `lineItems`, `gstAmount`, `totalAmount` |
| 12 | **Order** | Main order records | (see Section 2) |
| 13 | **User** | System users | `email`, `role`, `password` |

### 🎯 Master Data Entry Points

**Where Each Master is Created**:
```
Account (Accounts)
├── Mills              → Admin creates in Masters section
├── Customers/Masters  → Auto-created by OCR if not found
├── Weavers            → Manual + Auto-created by OCR
├── Transporters       → Manual + Auto-created by OCR

Quality
├── Manual creation    → Admin creates with specs
└── Auto-created       → By OCR if not found

Weaver
├── Manual creation    → Admin creates
└── Auto-created       → By OCR if not found

CodeMaster
└── Manual creation    → Link party to quality codes
```

### 💾 Account Model roleTypes
```javascript
Account.roleType = [
  "Mill",        // Our internal mills
  "Weaver",      // Grey cloth suppliers
  "Master",      // Customer (buyer)
  "Customer",    // Customer (buyer) - auto-created from OCR
  "Supplier",    // Supplier master
  "Transporter"  // Logistics partners
]
```

---

## 4. OCR/PDF HANDLING IMPLEMENTATION

### 🔍 OCR Route

**File**: `texttilepro-erp-backend/routes/ocr.js`

**Endpoint**: `POST /api/ocr/extract`

**Middleware & Configuration**:
```javascript
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";

const upload = multer({ 
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max
});

router.post("/extract", requireAuth, upload.single("file"), async (req, res) => {
  // Handle file upload and OCR
});
```

### 🔄 OCR Processing Flow

```
┌─────────────────────────────────────────────┐
│ User uploads PDF/Image                      │
│ (OcrChallanReader.tsx)                      │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Frontend: POST /api/ocr/extract             │
│ - FormData with file                        │
│ - Bearer token                              │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Backend: Express multer middleware          │
│ - Parse file buffer                         │
│ - Validate size (≤15MB)                     │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Forward to External OCR API                 │
│ https://challan-extractor.onrender.com      │
│ - POST with FormData                        │
│ - 60s timeout                               │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Receive: { challans: [...] }                │
│ Array of extracted challan data             │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ ensureMasters() Function                    │
│ For each challan in batch:                  │
│ - Find/create Firm → Account                │
│ - Find/create Party → Account               │
│ - Find/create Weaver → Weaver               │
│ - Find/create Quality → Quality             │
│ - Find/create Transporter → Account         │
│ Uses: Case-insensitive regex fuzzy matching │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Return: challans array with master IDs      │
│ Added fields: firmId, partyId, weaverId,    │
│              qualityId, transporterId       │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Frontend: Auto-fill OrderForm                │
│ Map extracted fields to form structure      │
│ User reviews and adjusts                    │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ User Submits Batch                          │
│ POST /api/orders/batch with all orders      │
└─────────────────────────────────────────────┘
```

### 🎯 OCR Frontend Component: OcrChallanReader.tsx

**Location**: `_components/OcrChallanReader.tsx`

**Features**:
```typescript
// Input Methods
- File Upload (PDF, JPG, PNG)
- Camera Scan (mobile camera)

// Output Data Structure
type OcrResult = {
  partyName?: string;
  date?: string;
  challanNo?: string;
  weaverName?: string;
  qualityName?: string;
  takaCount?: number;
  totalMeter?: number;
  takaRows?: Array<{takaNo, meter, weight}>;
  confidence: "high" | "medium" | "low";
  unmatchedFields?: string[];
}

// Preview & Retry
- Shows preview of uploaded file
- Confidence indicator (high/medium/low)
- Retry button for re-extraction
- Manual field editing after extraction
```

### 🔧 ensureMasters() Function

**Purpose**: Auto-create/find masters from OCR data

**Logic**:
```javascript
async function ensureMasters(data, cache = {}) {
  const { 
    firmName,          // From PDF "Delivery At"
    partyName,         // From PDF "M/s Party"
    weaverName,        // From PDF "Header/Firm"
    qualityName,
    transporterName,
    hsnCode
  } = data;

  // 1. FIRM (Internal Mill)
  Find: Account where accountName matches (case-insensitive) & roleType="Mill"
  If NOT found: Create Account { accountName, roleType: "Mill", isActive: true }

  // 2. PARTY (Customer)
  Find: Account where accountName matches & roleType IN ["Master", "Customer", "Supplier"]
  If NOT found: Auto-create Account {
    accountName: partyName,
    roleType: "Customer",
    gstin: extracted_from_pdf,
    panNo: extracted_from_gstin[2:12],
    gstType: "Regular",
    address: extracted_from_pdf,
    city: parsed_from_address,
    state: parsed_from_address,
    isActive: true
  }

  // 3. WEAVER
  Find: Weaver where weaverName matches
  If NOT found: Create Weaver {
    weaverName,
    weaverCode: auto_generated (first3_chars + random_number)
  }

  // 4. QUALITY
  Find: Quality where qualityName matches
  If NOT found: Create Quality {
    qualityName,
    processType: "Dyeing",
    hsnCode: extracted_from_pdf
  }

  // 5. TRANSPORTER
  Find: Account where accountName matches & roleType="Transporter"
  If NOT found: Create Account {
    accountName: transporterName,
    roleType: "Transporter",
    isActive: true
  }

  Return: { firmId, partyId, weaverId, qualityId, transporterId }
}
```

**Matching Strategy**: 
- Uses `.toLowerCase()` and regex case-insensitive matching
- Escapes special regex characters
- Exact name match required (after case normalization)

---

## 5. FILE UPLOAD MECHANISMS

### 📤 Frontend Upload (OcrChallanReader.tsx)

**Method 1: File Input**
```typescript
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/ocr/extract`,
      {
        method: "POST",
        body: formData,
        headers: { 
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    onFill(data);
  }
};
```

**Method 2: Camera Capture**
```typescript
// Camera input element with accept="image/*" capture="environment"
<input 
  ref={cameraRef} 
  type="file" 
  accept="image/*"
  capture="environment"
  onChange={handleFileChange}
/>
```

**UI Features**:
- Drag & drop zone (implicit via file input)
- Upload icon button
- Camera icon button  
- File preview (image or PDF thumbnail)
- Confidence badge (high/medium/low)
- Manual field editing UI
- Retry button

### 🖥️ Backend Upload Handler (ocr.js)

```javascript
import multer from "express";

const upload = multer({ 
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

router.post("/extract", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    
    // file properties available:
    // - file.buffer      (Buffer object)
    // - file.originalname (String)
    // - file.mimetype    (String: "application/pdf", "image/jpeg", etc.)
    // - file.size        (Number in bytes)

    // Create blob from buffer
    const blob = new Blob([file.buffer], { type: file.mimetype });

    // Prepare FormData for external OCR API
    const externalFormData = new FormData();
    externalFormData.append("file", blob, file.originalname);

    // Call external OCR service with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const externalResponse = await fetch(
      "https://challan-extractor.onrender.com/extract",
      {
        method: "POST",
        body: externalFormData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TextilePro-ERP-Backend'
        }
      }
    );

    // Parse response and process
    const data = await externalResponse.json();
    
    // Ensure masters exist
    const processedChallans = [];
    for (const c of data.challans) {
      const masters = await ensureMasters({
        firmName: c.delivery_at,
        partyName: c.party,
        weaverName: c.firm || c.weaver,
        qualityName: c.quality,
        transporterName: c.transpoter,
        hsnCode: c.hsn_code
      });
      
      processedChallans.push({
        ...c,
        ...masters
      });
    }

    res.json({ ...data, challans: processedChallans });

  } catch (err) {
    next(err);
  }
});
```

### 📁 File Reference Storage

**Current Approach**: References only (no physical file storage)

```javascript
// In Order Model
ocrFileId: String,      // Reference identifier
ocrExtractedData: String, // Raw OCR JSON as string

// In Order Model
lrFileId: String,       // LR document reference

// Example Usage:
const order = await Order.create({
  ...orderData,
  ocrFileId: "ocr_12345_timestamp",
  ocrExtractedData: JSON.stringify(extractedData)
});
```

**Storage Strategy Note**:
- Files are NOT stored in DB
- Only references/identifiers stored
- Actual file storage would need separate implementation (S3, Azure, local filesystem)

---

## 6. DATA FLOW - ORDER CREATION TO DATABASE

### 🔄 Complete Order Creation Flow

```
STEP 1: USER NAVIGATES TO ORDER ENTRY
┌─────────────────────────────────────────┐
│ /orders/new → new/page.tsx              │
│ Renders: <BatchOrderEntry />            │
│ Loads masters from backend:             │
│ - accounts (filter by Mill, Master, etc)│
│ - weavers                               │
│ - qualities                             │
│ - codeMasters                           │
└─────────────────────────────────────────┘

STEP 2A: MANUAL ORDER ENTRY
┌─────────────────────────────────────────┐
│ User fills form fields:                 │
│ - Select Mill (firmId)                  │
│ - Select Party (partyId)                │
│ - Select Weaver (weaverId)              │
│ - Select Quality (qualityId)            │
│ - Enter all detail fields               │
│ - Add taka detail rows                  │
│                                         │
│ Auto-filling occurs:                    │
│ useEffect → partyId changed             │
│   → Fetch Party account                 │
│   → Set marka from party.clientCode     │
│                                         │
│ useEffect → weaverId changed            │
│   → Fetch Weaver record                 │
│   → Set weaverMarka from weaver.code    │
└─────────────────────────────────────────┘

STEP 2B: OCR-ASSISTED ENTRY
┌─────────────────────────────────────────┐
│ User clicks "Upload File" or "Camera"   │
│ → OcrChallanReader component opens      │
│ → Select file or capture image          │
│ → Frontend: POST /api/ocr/extract       │
│   (FormData with file + token)          │
│                                         │
│ Backend processes:                      │
│ 1. Receive file via multer              │
│ 2. Forward to challan-extractor API     │
│ 3. Get back: { challans: [...] }        │
│ 4. Call ensureMasters() for each        │
│ 5. Auto-create missing accounts,        │
│    qualities, weavers, transporters     │
│ 6. Return enriched challans array       │
│    with master IDs added                │
│                                         │
│ Frontend auto-fills OrderForm:          │
│ - Map OCR fields to form structure      │
│ - Populate all text fields              │
│ - Select master IDs from dropdowns      │
│ - Generate taka detail rows             │
│                                         │
│ User reviews & adjusts:                 │
│ - Correct any OCR misreads              │
│ - Verify all details                    │
└─────────────────────────────────────────┘

STEP 3: BATCH SUBMISSION
┌─────────────────────────────────────────┐
│ User clicks "Submit" or "Add & Submit"  │
│                                         │
│ Frontend prepares batch:                │
│ - Collect all orders from state         │
│ - Validate required fields              │
│ - Transform to OrderForm objects        │
│                                         │
│ POST /api/orders/batch                  │
│ Body: {                                 │
│   challans: [                           │
│     {                                   │
│       orderDate: "2025-04-28",          │
│       firmId: "612f7c9a...",           │
│       partyId: "612f7c9b...",          │
│       marka: "ABC123",                  │
│       qualityId: "...",                 │
│       totalTaka: 10,                    │
│       totalMeter: 500,                  │
│       takaDetails: [                    │
│         { takaNo: "1", meter: 50, ...}, │
│         { takaNo: "2", meter: 45, ...}  │
│       ],                                │
│       ...other fields...                │
│     },                                  │
│     { ...more orders... }               │
│   ]                                     │
│ }                                       │
└─────────────────────────────────────────┘

STEP 4: BACKEND PROCESSING
┌─────────────────────────────────────────┐
│ Route: POST /api/orders/batch           │
│ Handler: routes/orders.js               │
│                                         │
│ For each order in challans array:       │
│ 1. Validate request.body.challans       │
│ 2. Create Order document:               │
│    await Order.create({                 │
│      ...orderData,                      │
│      status: "draft"  // Default        │
│    })                                   │
│ 3. Collect result with message         │
│                                         │
│ Return: 201 Created                     │
│ [{                                      │
│   order: { _id, ...fields },           │
│   message: "Order created successfully" │
│ }, {...more...}]                        │
└─────────────────────────────────────────┘

STEP 5: DATABASE PERSISTENCE
┌─────────────────────────────────────────┐
│ MongoDB Collection: orders              │
│                                         │
│ Inserted Document:                      │
│ {                                       │
│   _id: ObjectId(...),                   │
│   orderDate: "2025-04-28",              │
│   firmId: ObjectId(...),                │
│   firmName: "Our Mill",                 │
│   partyId: ObjectId(...),               │
│   masterName: "Customer ABC",           │
│   marka: "ABC123",                      │
│   weaverId: ObjectId(...),              │
│   qualityId: ObjectId(...),             │
│   totalTaka: 10,                        │
│   totalMeter: 500,                      │
│   shippingMode: "DirectMills",          │
│   takaDetails: [                        │
│     {                                   │
│       takaNo: "1",                      │
│       marka: "ABC123",                  │
│       meter: 50,                        │
│       weight: 25,                       │
│       isStamped: false                  │
│     },                                  │
│     {...more takas...}                  │
│   ],                                    │
│   status: "draft",                      │
│   createdAt: ISODate(...),              │
│   updatedAt: ISODate(...)               │
│ }                                       │
└─────────────────────────────────────────┘

STEP 6: NEXT STEPS (WORKFLOW)
┌─────────────────────────────────────────┐
│ Order status: DRAFT                     │
│                                         │
│ Next user action: Create Challan        │
│ POST /api/challans                      │
│ - Generates challan_no (CH-YYYYMMDD-X) │
│ - Sets status: "pending"                │
│ - Updates Order status → "PendingChallan│
│                                         │
│ After Challan created:                  │
│ User creates Lot from challan           │
│ POST /api/lots                          │
│ - Generates lotNo                       │
│ - Links to Order, Challan, Party        │
│ - Sets status: "InStorage"              │
│ - Assigns Location (warehouse)          │
│ - Updates Order status → "LotCreated"   │
└─────────────────────────────────────────┘
```

### 🔐 Authentication & Authorization
```javascript
// All endpoints require authentication
middleware: requireAuth

// Token extraction from request
Authorization: Bearer <JWT_token>

// Token stored on frontend
localStorage.getItem("token")

// Passed in fetch headers
headers: { Authorization: `Bearer ${token}` }
```

---

## 7. HOW MASTERS ARE SAVED

### 📝 Manual Master Entry Routes

#### Accounts (Customers, Mills, Transporters)
```http
POST /api/accounts
Content-Type: application/json
Authorization: Bearer {token}

{
  "accountName": "XYZ Customer",
  "roleType": "Master",
  "gstin": "27AABCT1234A1Z5",
  "panNo": "AABCT1234A",
  "gstType": "Regular",
  "mobileNo": "+91-9876543210",
  "email": "contact@customer.com",
  "address": "123 Business Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "creditDays": 30,
  "openingBalance": 50000,
  "isActive": true
}
```

#### Quality Masters
```http
POST /api/qualities
Content-Type: application/json

{
  "qualityName": "100% Cotton Poplin",
  "gsm": 130,
  "width": 60,
  "unit": "inch",
  "hsnCode": "5212",
  "processType": "Dyeing",
  "expectedLossPercent": 3,
  "shortPercent": 2,
  "defaultJobRate": 12.50,
  "greyRate": 180,
  "dispatchRate": 220
}
```

#### Weaver Masters
```http
POST /api/weavers
Content-Type: application/json

{
  "weaverName": "ABC Weaving",
  "weaverCode": "ABC001",
  "gstin": "27AABCT5678B1Z0",
  "mobileNo": "+91-9123456789",
  "address": "Weaving Mill, Industrial Area"
}
```

#### Code Masters (Party-Quality Mapping)
```http
POST /api/code-master
Content-Type: application/json

{
  "accountId": "ObjectId...",
  "accountName": "XYZ Customer",
  "masterName": "XYZ",
  "quality": "100% Cotton",
  "clientCode": "XYZ-001"
}
```

#### Locations (Warehouse)
```http
POST /api/locations
Content-Type: application/json

{
  "locationId": "GR-001-01",
  "warehouseName": "Grey Area Warehouse",
  "section": "GreyArea",
  "rack": "A",
  "zone": "Z1",
  "floor": "1",
  "capacityMeter": 5000,
  "occupiedMeter": 0,
  "status": "Empty"
}
```

### 🤖 Auto-Master Creation (During OCR)

**Triggered when**: User uploads challan PDF via OCR

**Process**:
```
1. OCR extracts challan data
   {
     party: "ABC Customer Ltd",
     firm: "Our Mill",
     quality: "Cotton Poplin",
     transpoter: "XYZ Transport"
   }

2. Backend calls ensureMasters(extractedData)

3. For each master:
   - Check if exists (case-insensitive regex search)
   - If NOT found → AUTO-CREATE with sensible defaults

4. Auto-created Masters:
   ├── Account (Party)
   │   ├── accountName: from PDF
   │   ├── roleType: "Customer"
   │   ├── gstin: extracted
   │   ├── address: parsed from PDF
   │   └── isActive: true
   │
   ├── Weaver
   │   ├── weaverName: from PDF
   │   ├── weaverCode: auto-generated
   │   └── (other fields: null/empty)
   │
   ├── Quality
   │   ├── qualityName: from PDF
   │   ├── processType: "Dyeing"
   │   ├── hsnCode: extracted if available
   │   └── (other fields: null/empty)
   │
   └── Account (Transporter)
       ├── accountName: from PDF
       ├── roleType: "Transporter"
       └── isActive: true

5. Return: enriched data with master IDs
   {
     ...extractedData,
     firmId: ObjectId(...),
     partyId: ObjectId(...),
     weaverId: ObjectId(...),
     qualityId: ObjectId(...)
   }

6. Frontend receives enriched data and auto-fills form
```

---

## 8. API ENDPOINTS REFERENCE

### 📡 Backend REST API

#### Orders
```
GET    /api/orders                  List all orders
GET    /api/orders/:id              Get order by ID
POST   /api/orders                  Create single order
POST   /api/orders/batch            Create batch orders ⭐
PATCH  /api/orders/:id              Update order
DELETE /api/orders/:id              Delete order
```

#### Challans
```
GET    /api/challans                List challans
GET    /api/challans/:id            Get challan
GET    /api/challans/by-order/:id   Get challans for order
POST   /api/challans                Create challan
DELETE /api/challans/:id            Delete challan
```

#### Lots
```
GET    /api/lots                    List lots
GET    /api/lots/:id                Get lot
GET    /api/lots/by-challan/:id     Get lots for challan
POST   /api/lots                    Create lot
PATCH  /api/lots/:id/status         Update lot status
DELETE /api/lots/:id                Delete lot
```

#### Masters
```
GET    /api/accounts                List accounts
POST   /api/accounts                Create account
PATCH  /api/accounts/:id            Update account

GET    /api/qualities               List qualities
POST   /api/qualities               Create quality

GET    /api/weavers                 List weavers
POST   /api/weavers                 Create weaver

GET    /api/code-master             List code masters
POST   /api/code-master             Create code master

GET    /api/locations               List locations
POST   /api/locations               Create location
```

#### OCR
```
POST   /api/ocr/extract ⭐          Upload file → Extract challan data
```

#### Other
```
GET    /api/process-issues          List process issues
POST   /api/job-cards               Create job card
GET    /api/dispatches              List dispatches
POST   /api/bills                   Create bill
```

### 🔗 Frontend API Mock Layer

**File**: `src/lib/convex-mock.ts`

**Purpose**: Converts React Query operations to REST API calls

**Usage Pattern**:
```typescript
const { data: orders } = useQuery(api.orders.list, {});
const createOrder = useMutation(api.orders.create);

await createOrder({ firmId, partyName, ...orderData });
```

---

## 9. AUTO-POPULATION BEHAVIORS

### 🎯 Key Auto-Fill Features

#### 1. Party Marka Auto-Population
```typescript
// In BatchOrderEntry.tsx useEffect hook:
useEffect(() => {
  if (currentForm.partyId && currentForm.partyId !== lastPartyId) {
    const party = masterAccounts.find(x => x._id === currentForm.partyId);
    const targetMarka = party?.clientCode || party?.marka || "";
    
    if (targetMarka) {
      updateOrderObject({ marka: targetMarka });
    }
    setLastPartyId(currentForm.partyId);
  }
}, [currentForm.partyId, masterAccounts, lastPartyId]);
```

**Behavior**:
- User selects Party from dropdown
- System fetches Party account record
- Extracts `clientCode` or `marka` field
- Auto-fills the Order marka field
- Prevents duplicate API calls with `lastPartyId` tracking

#### 2. Weaver Marka Auto-Population
```typescript
useEffect(() => {
  if (currentForm.weaverId && currentForm.weaverId !== lastWeaverId) {
    const weaver = weavers.find(x => x._id === currentForm.weaverId);
    const targetMarka = weaver?.weaverCode || weaver?.marka || weaver?.weaverMarka || "";
    
    if (targetMarka) {
      updateOrderObject({ weaverMarka: targetMarka });
    }
    setLastWeaverId(currentForm.weaverId);
  }
}, [currentForm.weaverId, weavers, lastWeaverId]);
```

**Behavior**:
- User selects Weaver from dropdown
- System fetches Weaver record
- Extracts `weaverCode` or `marka`
- Auto-fills weaverMarka field

#### 3. Taka Details Row Generation
```typescript
const handleTakaCountChange = (val: string) => {
  const n = parseInt(val);
  const updates = { totalTaka: val };
  
  if (!isNaN(n) && n > 0 && n <= 500) {
    updates.takaDetails = Array.from({ length: n }, (_, i) => ({
      takaNo: String(i + 1),
      marka: "",
      meter: "",
      weight: ""
    }));
  }
  updateOrderObject(updates);
};
```

**Behavior**:
- User enters total number of takas (e.g., "10")
- System auto-generates 10 empty taka detail rows
- Each row pre-filled with sequential takaNo (1, 2, 3...)
- User can then fill meter and weight for each taka
- Max limit: 500 takas

#### 4. OCR Data Auto-Fill
```typescript
const handleOcrFill = useCallback((data: any) => {
  const challans = Array.isArray(data) ? data : (data.challans || [data]);
  
  if (challans.length > 1) {
    // Multi-challan: Add all to batch
    const mapped = challans.map((c: any) => ({
      ...emptyOrder(),
      orderDate: c.date || c.orderDate || new Date().toISOString().split("T")[0],
      firmId: c.firmId || "",
      partyId: c.partyId || "",
      partyName: c.partyName || "",
      // ... map all extracted fields
    }));
    setOrders(mapped);
  } else {
    // Single challan: Fill current order
    updateOrderObject({
      orderDate: challans[0].date || ...,
      // ...
    });
  }
}, []);
```

**Behavior**:
- Backend returns OCR-extracted data with master IDs
- Frontend maps extracted fields to OrderForm structure
- Handles both single and batch challans
- Auto-selects IDs from dropdowns
- Generates taka detail rows if count provided

---

## 10. CURRENT LIMITATIONS & GAPS

### ⚠️ Known Limitations

1. **File Storage**
   - ❌ Files not stored anywhere
   - ✅ Only references/IDs stored in DB
   - 📝 Need: S3/Azure/Local filesystem implementation

2. **PDF Generation**
   - ❌ No PDF generation for orders
   - ❌ No challan printing functionality
   - 📝 Need: pdfkit or similar library

3. **Workflow Automation**
   - ❌ Manual step-by-step process
   - ❌ No auto-transition between statuses
   - 📝 Need: Business logic/rules engine

4. **Lot Creation**
   - ❌ No UI for creating lots from orders
   - ❌ No auto-lot creation
   - 📝 Need: Lot creation form & workflow

5. **Dispatch & Billing**
   - ❌ Limited dispatch UI
   - ❌ No bill generation from dispatch
   - 📝 Need: Complete dispatch/billing workflows

6. **Search & Filters**
   - ✅ Basic search in challans
   - ❌ Advanced filters missing
   - 📝 Need: Multi-field search, date ranges

7. **Validation**
   - ⚠️ Basic form validation
   - ❌ No business logic validation
   - 📝 Need: Cross-field validation, rules

---

## 📚 Key Files Summary

| Location | Purpose |
|----------|---------|
| `src/app/(dashboard)/orders/page.tsx` | Order list page |
| `src/app/(dashboard)/orders/new/page.tsx` | New order entry page |
| `src/app/(dashboard)/orders/_components/BatchOrderEntry.tsx` | Main order form component |
| `src/app/(dashboard)/orders/_components/OcrChallanReader.tsx` | OCR file upload component |
| `models/Order.js` | Order schema definition |
| `models/Account.js` | Multi-role master schema |
| `models/Quality.js` | Quality specifications |
| `models/Weaver.js` | Weaver master |
| `models/Lot.js` | Production lot schema |
| `routes/orders.js` | Order CRUD operations |
| `routes/ocr.js` | OCR extraction endpoint |
| `routes/challans.js` | Challan management |
| `src/lib/convex-mock.ts` | API endpoint definitions |
| `src/lib/api.ts` | Fetch wrapper & auth |

---

## 🎓 Understanding the Workflow

### Complete Order-to-Dispatch Journey

```
1. ORDER ENTRY (DRAFT)
   ↓
2. CHALLAN CREATION (PENDING CHALLAN)
   Assigns challan number, stores detailed item info
   ↓
3. LOT CREATION (LOT CREATED)
   Allocates to warehouse location, assigns quantity
   ↓
4. PROCESS ISSUE (IN PROCESS)
   Creates process jobs (dyeing/printing), tracks progress
   ↓
5. JOB CARD EXECUTION (IN PROGRESS)
   Records actual production output, chemicals used
   ↓
6. PRODUCTION COMPLETE (COMPLETED)
   Final meter, shortage recorded, quality marked
   ↓
7. DISPATCH (DISPATCHED)
   Ships to customer, records LR details
   ↓
8. BILLING (BILLED)
   Generates invoice based on dispatch
```

---

## 🔄 How to Add New Order Entry Features

### Example: Add New Field to Order Form

1. **Add to Order Schema** (`models/Order.js`):
   ```javascript
   myNewField: { type: String, required: false }
   ```

2. **Add to Frontend Form** (`_components/BatchOrderEntry.tsx`):
   ```typescript
   type OrderForm = {
     ...existing,
     myNewField: string;
   }
   
   // In emptyOrder():
   myNewField: ""
   
   // In form JSX:
   <Input 
     value={currentForm.myNewField}
     onChange={(e) => updateField("myNewField", e.target.value)}
   />
   ```

3. **Include in OCR Mapping** (if applicable):
   ```javascript
   // In OcrChallanReader.tsx handleOcrFill():
   myNewField: extractedData.myNewField || ""
   ```

4. **Test End-to-End**:
   - Create order manually → Save → Verify field saved
   - Upload OCR → Field auto-filled if data exists


# 📊 Challan System - Field Mapping & Data Flow Guide

## Complete Field Analysis from PDF Extractor API

### **API Response Structure**
```json
{
  "challans": [
    {
      "date": "14/04/2026",
      "challan_date": "14/04/2026",
      "challan_no": "52/M",
      // ... more fields
      "table": [
        { "tn": 1, "meter": 93.5 },
        { "tn": 2, "meter": 75.0 }
      ]
    }
  ],
  "count": 6
}
```

---

## **Field Mapping Table**

### **Section 1: Basic Details**
| PDF Field | Form Field | Type | Conversion | Example |
|-----------|-----------|------|-----------|---------|
| date | date | string | DD/MM/YYYY → YYYY-MM-DD | "14/04/2026" → "2026-04-14" |
| challan_date | challan_date | string | DD/MM/YYYY → YYYY-MM-DD | "14/04/2026" → "2026-04-14" |
| challan_no | challan_no | string | Trimmed | "52/M" |
| firm | firm | string | Trimmed | "JAI MATA DI FASHIONS PVT. LTD." |
| party | party | string | Trimmed | "KRISHNA TEXTILES" |
| party_address | party_address | string | Trimmed | "6027-6TH FLOOR VIKAS LOGISTIC..." |
| gstin_no | gstin_no | string | Trimmed | "24AASFK8697B1ZT" |

### **Section 2: Item & Quality**
| PDF Field | Form Field | Type | Example |
|-----------|-----------|------|---------|
| quality | quality | string | "DULL SATIN-22KG" |
| hsn_code | hsn_code | string | "5407" |
| item | item | string | (empty) |
| taka | taka | number → string | "18" |
| meter | meter | number → string | "1513.0" |
| dyed_print | dyed_print | select | Empty/Dyed/Print/Grey |
| weaver | weaver | string | (empty) |

### **Section 3: Rates & Amounts**
| PDF Field | Form Field | Type | Example |
|-----------|-----------|------|---------|
| fas_rate | fas_rate | number → string | "35.5" |
| amount | amount | number → string | "53711.5" |
| weight | weight | number → string | "0.0" |
| total | total | number → string | "0.0" |
| chadhti | chadhti | number → string | "0.0" |
| width | width | number → string | "0.0" |
| pu_bill_no | pu_bill_no | string | "42" |

### **Section 4: Dispatch Details**
| PDF Field | Form Field | Type | Example |
|-----------|-----------|------|---------|
| lr_no | lr_no | string | (empty) |
| lr_date | lr_date | string | DD/MM/YYYY → YYYY-MM-DD |
| transpoter | transpoter | string | (empty) |
| remark | remark | string | "Party: GOODLUCK RAYON, Bill No: 19..." |

### **Taka Details Table**
| PDF Field | Type | Structure |
|-----------|------|-----------|
| table | array | `[{tn: number, meter: string}, ...]` |

---

## **Extra Fields (Not Used in Form)**
These fields are in the API response but not displayed in the form:
- `lot_book_type`
- `master_ac`
- `agent`
- `gstin_numbers` (array with multiple GSTINs)
- `pan_no`
- `group`
- `marka_help`
- `lot_no`

*Note: These can be stored in backend but are hidden from UI*

---

## **Data Flow Diagram**

```
PDF File (on user device)
    ↓
handleFileUpload() triggered
    ↓
POST to https://challan-extractor.onrender.com/extract
    ↓
API returns response with 6 challans
    ↓
data.challans.map() - Convert & Transform
    ↓
    • Convert DD/MM/YYYY dates to YYYY-MM-DD
    • Convert numbers to strings
    • Trim whitespace
    • Validate table structure
    ↓
setChallans(mapped) - Update state
    ↓
Form displays with extracted data
    ↓
User can edit any field
    ↓
Click "Submit All"
    ↓
POST /api/challans/batch
    ↓
Backend creates challans in DB
    ↓
Success notification
```

---

## **Type Conversions**

### **Input Fields (HTML5 `type="number"`)**
- Accept both string and number values
- Example: `<Input type="number" value="35.5" />` ✓ Works

### **Input Fields (HTML5 `type="date"`)**
- Must be in YYYY-MM-DD format
- Conversion: `"14/04/2026"` → `"2026-04-14"`
- Example: `<Input type="date" value="2026-04-14" />` ✓ Works

### **Text Input Fields**
- Accept any string
- `.trim()` removes leading/trailing spaces
- Example: `"  JAI MATA  "` → `"JAI MATA"`

---

## **Form Validation Rules**

### **Required Fields (marked with * in UI)**
- [x] Date
- [x] Challan Date
- [x] Challan No.
- [x] Firm
- [x] Party
- [x] Quality
- [x] Taka
- [x] Meter

### **Optional Fields**
- Party Address
- GSTIN No.
- HSN Code
- Item
- Dyed/Print
- Weaver
- FAS Rate
- Amount
- Weight
- Total
- Chadhti
- Width
- PU Bill No.
- LR No.
- LR Date
- Transporter
- Remark

---

## **Backend Submission Format**

When "Submit All" is clicked, the frontend sends:

```json
POST /api/challans/batch
Content-Type: application/json
Authorization: Bearer {token}

{
  "challans": [
    {
      "challan_no": "52/M",
      "challan_date": "2026-04-14",
      "date": "2026-04-14",
      "firm": "JAI MATA DI FASHIONS PVT. LTD.",
      "party": "KRISHNA TEXTILES",
      "party_address": "6027-6TH FLOOR VIKAS LOGISTIC PARK...",
      "gstin_no": "24AASFK8697B1ZT",
      "quality": "DULL SATIN-22KG",
      "hsn_code": "5407",
      "item": "",
      "taka": "18",
      "meter": "1513.0",
      "fas_rate": "35.5",
      "amount": "53711.5",
      "dyed_print": "",
      "weaver": "",
      "pu_bill_no": "42",
      "lr_no": "",
      "lr_date": "",
      "transpoter": "",
      "remark": "Party: GOODLUCK RAYON...",
      "weight": "0.0",
      "chadhti": "0.0",
      "width": "0.0",
      "total": "0.0",
      "table": [
        { "tn": 1, "meter": "93.5" },
        { "tn": 2, "meter": "75.0" },
        // ... 16 more entries
      ]
    },
    // ... 5 more challans
  ]
}
```

---

## **Database Schema (MongoDB)**

The backend stores each challan with:
```json
{
  "_id": ObjectId,
  "challan_no": String,
  "challan_date": String,
  "date": String,
  "firm": String,
  "party": String,
  "party_address": String,
  "gstin_no": String,
  "quality": String,
  "hsn_code": String,
  "item": String,
  "taka": String,
  "meter": String,
  "fas_rate": String,
  "amount": String,
  "dyed_print": String,
  "weaver": String,
  "pu_bill_no": String,
  "lr_no": String,
  "lr_date": String,
  "transpoter": String,
  "remark": String,
  "weight": String,
  "chadhti": String,
  "width": String,
  "total": String,
  "table": [
    { "tn": Number, "meter": String }
  ],
  "status": "draft" | "approved",
  "createdAt": Date,
  "updatedAt": Date
}
```

---

## **How to Test**

### **Step 1: Upload PDF**
1. Click "Upload PDF" button
2. Select a PDF with challan data
3. Wait for extraction (5-10 seconds)

### **Step 2: Verify Data**
- Check if 6 challans are loaded
- Navigate with prev/next buttons
- Verify all fields are correctly populated
- Check taka details table on right

### **Step 3: Edit (Optional)**
- Change any field
- Add/remove rows in table
- Note: Changes are local to current session

### **Step 4: Submit**
- Click "Submit All (6)"
- Should see success message
- Check History tab to verify saved data

---

## **Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| Dates show empty | Date format mismatch | Check formatDate() converts DD/MM/YYYY correctly |
| Numbers display as "0" | Type conversion issue | Ensure String() conversion before assignment |
| Table rows missing | API returns null/undefined | Check if `c.table` is Array before mapping |
| Submission fails | API endpoint issue | Verify `/api/challans/batch` exists in backend |
| Extra fields showing | Fields not filtered | Update mapping to exclude extra fields |

---

## **Debugging Console Logs**

Add these to check data in browser console:

```javascript
// In handleFileUpload, before mapping:
console.log("Raw API response:", data);
console.log("First challan structure:", data.challans[0]);

// After mapping:
console.log("Mapped challans:", mapped);
console.log("First mapped challan dates:", mapped[0].date, mapped[0].challan_date);
```

---

## **Summary**

✅ **26 form fields** are properly mapped from PDF API  
✅ **18 table entries** per challan for taka details  
✅ **All data types** properly converted (dates, numbers, strings)  
✅ **Batch submission** sends 6 challans in one request  
✅ **Backend stores** all fields in MongoDB  
✅ **History tab** retrieves and displays saved data  

---

Generated: 25 April 2026
Version: 1.0

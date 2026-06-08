import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Dictionary mapping for UI statuses
const STATUS_LABELS: Record<string, string> = {
  "Order Created": "Order Created",
  "Challan Created": "Challan Created",
  "Lot Created": "Lot Created",
  "Stamping Done": "Stamping Done",
  "In Process": "In Process",
  "Finish Meter Updated": "Finish Meter Updated",
  "Ready for Dispatch": "Ready for Dispatch",
  "Dispatched / Billed": "Dispatched / Billed",
  draft: "Order Created",
  ChallanIssued: "Challan Created",
  LotCreated: "Lot Created",
  Dispatched: "Dispatched / Billed",
};

/**
 * 1. getName Helper
 * Returns string if valid, extracts name from object if available, otherwise empty string.
 */
function getName(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const nameVal = obj.name || obj.partyName || obj.companyName || obj.accountName || obj.masterName || obj.title;
    if (typeof nameVal === "string") return nameVal.trim();
  }
  return "";
}

/**
 * 2. formatDate Helper
 * Returns DD/MM/YYYY or empty string if missing.
 */
function formatDate(dateValue: unknown): string {
  if (!dateValue) return "";
  const parsed = new Date(dateValue as string);
  if (isNaN(parsed.getTime())) return "";
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * 3. formatStatus Helper
 * Formats status codes.
 */
function formatStatus(status: unknown): string {
  if (!status || typeof status !== "string") return "";
  const label = STATUS_LABELS[status] || status;
  return label
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .toUpperCase();
}

/**
 * 4. getTakaDetails Helper
 * Extracts nested taka details list.
 */
function getTakaDetails(order: any): any[] {
  if (!order) return [];
  return (
    order.takaDetails ||
    order.takaList ||
    order.rollDetails ||
    order.rolls ||
    order.items ||
    order.meterList ||
    []
  );
}

/**
 * 5. calculateAverage Helper
 * Returns totalMeter / totalTaka.
 */
function calculateAverage(order: any): number | string {
  if (!order) return "";
  const totalTaka = Number(order.totalTaka);
  const totalMeter = Number(order.totalMeter);
  if (!totalTaka || isNaN(totalTaka) || isNaN(totalMeter)) return "";
  return parseFloat((totalMeter / totalTaka).toFixed(1));
}

/**
 * Parses numeric values safely.
 */
function safeNumber(val: unknown, decimals?: number): number | string {
  if (val === null || val === undefined || val === "") return "";
  const n = Number(val);
  if (isNaN(n)) return "";
  return decimals !== undefined ? parseFloat(n.toFixed(decimals)) : n;
}

/**
 * Exports data to a purchase-order reference styled Excel file using ExcelJS.
 */
export async function exportOrderEntryReport(orders: any[], fileName: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Order Entry Export");

  // Define column widths
  worksheet.columns = [
    { key: "sNo", width: 8 },
    { key: "weaverDate", width: 14 },
    { key: "orderId", width: 24 },
    { key: "partyName", width: 26 },
    { key: "masterName", width: 22 },
    { key: "weaverName", width: 26 },
    { key: "weaverChNo", width: 18 },
    { key: "millName", width: 32 },
    { key: "marka", width: 14 },
    { key: "qualityName", width: 22 },
    { key: "totalTaka", width: 12 },
    { key: "totalMeter", width: 14 },
    { key: "avgMeter", width: 14 },
    { key: "orderStatus", width: 18 },
    { key: "takaNo", width: 18 },
    { key: "takaMeter", width: 14 },
    { key: "takaWeight", width: 14 },
    { key: "takaStatus", width: 16 },
    { key: "takaRemark", width: 20 },
  ];

  // Thin borders definition
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFCBD5E1" } },
    left: { style: "thin", color: { argb: "FFCBD5E1" } },
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    right: { style: "thin", color: { argb: "FFCBD5E1" } },
  };

  // ═══════════════════════════════════════════════════════════
  // Header Row
  // ═══════════════════════════════════════════════════════════
  const headerRow = worksheet.addRow([
    "S.No",
    "Weaver Date",
    "Order No / Order ID",
    "Party Name",
    "Master Name",
    "Weaver Name",
    "Weaver Challan No",
    "Mill Name",
    "Marka",
    "Quality Name",
    "Total Taka",
    "Total Meter",
    "Average Meter",
    "Order Status",
    "Taka Marka / Taka No",
    "Taka Meter",
    "Weight",
    "Taka Status",
    "Remark",
  ]);

  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF374151" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }; // Light grey background
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = thinBorder;
  });

  let currentRowNum = 2; // Rows are 1-indexed, headers are at row 1

  orders.forEach((order, orderIndex) => {
    const takaDetails = getTakaDetails(order);
    const startRow = currentRowNum;
    const numRows = takaDetails.length > 0 ? takaDetails.length : 1;

    // Parent details values
    const sNoVal = orderIndex + 1;
    const weaverDateVal = formatDate(order.weaverChDate || order.orderDate);
    const orderIdVal = order.orderNo || order._id || "";
    const partyNameVal = getName(order.partyName || order.partyDetails);
    const masterNameVal = getName(order.codeMasterId || order.brokerName);
    const weaverNameVal = getName(order.weaverName || order.weaverDetails);
    const weaverChNoVal = order.weaverChNo || order.challanNo || "";
    const millNameVal = getName(order.firmName || order.firmDetails);
    const markaVal = order.marka || "";
    const qualityNameVal = getName(order.qualityName || order.qualityDetails);
    const totalTakaVal = safeNumber(order.totalTaka);
    const totalMeterVal = safeNumber(order.totalMeter, 1);
    const averageMeterVal = safeNumber(order.averageMeter || calculateAverage(order), 1);
    const orderStatusVal = formatStatus(order.status);

    if (takaDetails.length > 0) {
      takaDetails.forEach((taka: any, takaIndex: number) => {
        const isFirstRow = takaIndex === 0;

        const row = worksheet.addRow([
          isFirstRow ? sNoVal : "",
          isFirstRow ? weaverDateVal : "",
          isFirstRow ? orderIdVal : "",
          isFirstRow ? partyNameVal : "",
          isFirstRow ? masterNameVal : "",
          isFirstRow ? weaverNameVal : "",
          isFirstRow ? weaverChNoVal : "",
          isFirstRow ? millNameVal : "",
          isFirstRow ? markaVal : "",
          isFirstRow ? qualityNameVal : "",
          isFirstRow ? totalTakaVal : "",
          isFirstRow ? totalMeterVal : "",
          isFirstRow ? averageMeterVal : "",
          isFirstRow ? orderStatusVal : "",

          // Taka details (always populated on all rows)
          taka.takaNo || taka.marka || "",
          safeNumber(taka.meter, 1),
          taka.weight ? safeNumber(taka.weight, 1) : "-",
          taka.isStamped ? "Stamped" : "Grey",
          taka.remarks || "-",
        ]);

        row.height = 20;
        row.eachCell((cell, colIndex) => {
          cell.font = { name: "Arial", size: 9, color: { argb: "FF374151" } };
          cell.border = thinBorder;
          cell.alignment = {
            vertical: "middle",
            horizontal:
              colIndex === 1 ||
              colIndex === 2 ||
              colIndex === 3 ||
              colIndex === 7 ||
              colIndex === 9 ||
              colIndex === 11 ||
              colIndex === 12 ||
              colIndex === 13 ||
              colIndex === 14 ||
              colIndex === 15 ||
              colIndex === 18
                ? "center"
                : colIndex === 16 || colIndex === 17
                ? "right"
                : "left",
            wrapText: true,
          };
          if (colIndex === 11) cell.numFmt = "0";
          if (colIndex === 12 || colIndex === 13 || colIndex === 16 || colIndex === 17) {
            cell.numFmt = "0.0";
          }
        });

        currentRowNum++;
      });

      // ═══════════════════════════════════════════════════════════
      // Merge Parent Details Vertically (A to N)
      // ═══════════════════════════════════════════════════════════
      if (numRows > 1) {
        for (let colIndex = 1; colIndex <= 14; colIndex++) {
          worksheet.mergeCells(startRow, colIndex, startRow + numRows - 1, colIndex);
          // Set alignment on the merged cell
          const cell = worksheet.getCell(startRow, colIndex);
          cell.alignment = {
            vertical: "middle",
            horizontal:
              colIndex === 1 ||
              colIndex === 2 ||
              colIndex === 3 ||
              colIndex === 7 ||
              colIndex === 9 ||
              colIndex === 11 ||
              colIndex === 12 ||
              colIndex === 13 ||
              colIndex === 14
                ? "center"
                : "left",
            wrapText: true,
          };
        }
      }
    } else {
      // Row when there are no taka details
      const row = worksheet.addRow([
        sNoVal,
        weaverDateVal,
        orderIdVal,
        partyNameVal,
        masterNameVal,
        weaverNameVal,
        weaverChNoVal,
        millNameVal,
        markaVal,
        qualityNameVal,
        totalTakaVal,
        totalMeterVal,
        averageMeterVal,
        orderStatusVal,
        "No Taka Details Found",
        "-",
        "-",
        "-",
        "-",
      ]);

      row.height = 20;
      row.eachCell((cell, colIndex) => {
        cell.font = { name: "Arial", size: 9, color: { argb: "FF374151" } };
        cell.border = thinBorder;
        cell.alignment = {
          vertical: "middle",
          horizontal: colIndex >= 15 ? "center" : "left",
        };
      });

      currentRowNum++;
    }

    // ═══════════════════════════════════════════════════════════
    // Total Row (A to N Merged, Yellow Highlight)
    // ═══════════════════════════════════════════════════════════
    worksheet.mergeCells(currentRowNum, 1, currentRowNum, 14);
    const totalLabelCell = worksheet.getCell(`A${currentRowNum}`);
    totalLabelCell.value = ""; // blank for merged cells, we put TOTAL in column O

    const totalWordCell = worksheet.getCell(`O${currentRowNum}`);
    totalWordCell.value = "TOTAL";

    const totalTakaCountCell = worksheet.getCell(`P${currentRowNum}`);
    totalTakaCountCell.value = takaDetails.length;

    const totalMeterSumCell = worksheet.getCell(`Q${currentRowNum}`);
    totalMeterSumCell.value = typeof totalMeterVal === "number" ? totalMeterVal : 0;

    const totalWeightCell = worksheet.getCell(`R${currentRowNum}`);
    totalWeightCell.value = "";

    const totalRemarkCell = worksheet.getCell(`S${currentRowNum}`);
    totalRemarkCell.value = "";

    // Style the total row cells (A to S)
    for (let c = 1; c <= 19; c++) {
      const cell = worksheet.getCell(currentRowNum, c);
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF1F2937" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF08A" } }; // Light Yellow
      cell.border = thinBorder;
      cell.alignment = {
        vertical: "middle",
        horizontal:
          c === 15 || c === 18 || c === 19
            ? "center"
            : c === 16 || c === 17
            ? "right"
            : "left",
      };
      if (c === 16) cell.numFmt = "0";
      if (c === 17) cell.numFmt = "0.0";
    }

    currentRowNum++;

    // ═══════════════════════════════════════════════════════════
    // Blank Row Separator
    // ═══════════════════════════════════════════════════════════
    const blankRow = worksheet.addRow([]);
    blankRow.height = 15;
    currentRowNum++;
  });

  // Write workbook to buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName}.xlsx`);
}

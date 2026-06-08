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
 * Resolves a name from a string or object.
 */
function getName(value: unknown): string {
  if (!value) return "-";
  if (typeof value === "string") return value.trim() || "-";
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const nameVal = obj.name || obj.partyName || obj.companyName || obj.accountName || obj.masterName;
    if (typeof nameVal === "string") return nameVal.trim() || "-";
  }
  return "-";
}

/**
 * 2. formatDate Helper
 * Formats standard date to DD/MM/YYYY.
 */
function formatDate(dateValue: unknown): string {
  if (!dateValue) return "-";
  const parsed = new Date(dateValue as string);
  if (isNaN(parsed.getTime())) return "-";
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * 3. formatStatus Helper
 * Converts raw status codes into formatted uppercase labels.
 */
function formatStatus(status: unknown): string {
  if (!status || typeof status !== "string") return "-";
  const label = STATUS_LABELS[status] || status;
  return label
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .toUpperCase();
}

/**
 * 4. getTakaDetails Helper
 * Safely extracts nested taka/roll arrays from various possible database fields.
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
 * Safely computes average meter per taka.
 */
function calculateAverage(totalMeter: unknown, totalTaka: unknown): number | string {
  const m = Number(totalMeter);
  const t = Number(totalTaka);
  if (!t || isNaN(m) || isNaN(t)) return "-";
  return parseFloat((m / t).toFixed(1));
}

/**
 * Safely parses numbers for export.
 */
function safeNumber(val: unknown, decimals?: number): number | string {
  if (val === null || val === undefined || val === "") return "-";
  const n = Number(val);
  if (isNaN(n)) return "-";
  return decimals !== undefined ? parseFloat(n.toFixed(decimals)) : n;
}

/**
 * Exports data to a grouped order-wise Excel file using ExcelJS.
 */
export async function exportGroupedOrderReport(orders: any[], fileName: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Order Wise Taka Report");

  // Set column widths
  worksheet.columns = [
    { key: "colA", width: 18 },
    { key: "colB", width: 28 },
    { key: "colC", width: 28 },
    { key: "colD", width: 20 },
    { key: "colE", width: 18 },
    { key: "colF", width: 22 },
  ];

  // Thin borders definition
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFCBD5E1" } },
    left: { style: "thin", color: { argb: "FFCBD5E1" } },
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    right: { style: "thin", color: { argb: "FFCBD5E1" } },
  };

  let currentRowNum = 1;

  orders.forEach((order, orderIndex) => {
    const takaDetails = getTakaDetails(order);

    const partyName = getName(order.partyName || order.partyDetails);
    const masterName = getName(order.codeMasterId || order.brokerName);
    const weaverName = getName(order.weaverName || order.weaverDetails);
    const challanNo = order.weaverChNo || "-";
    const formattedDate = formatDate(order.weaverChDate || order.orderDate);
    const millName = getName(order.firmName || order.firmDetails);
    const marka = order.marka || "-";
    const qualityName = order.qualityName || "-";
    const totalTaka = safeNumber(order.totalTaka);
    const totalMeter = safeNumber(order.totalMeter, 1);
    const averageMeter = calculateAverage(order.totalMeter, order.totalTaka);
    const statusText = formatStatus(order.status);

    // ═══════════════════════════════════════════════════════════
    // Row 1: ORDER HEADING (Merged A to E, Status in F)
    // ═══════════════════════════════════════════════════════════
    worksheet.mergeCells(currentRowNum, 1, currentRowNum, 5);
    const headingCell = worksheet.getCell(`A${currentRowNum}`);
    headingCell.value = `ORDER DETAIL ${orderIndex + 1}: ${partyName.toUpperCase()} | CHALLAN NO: ${String(challanNo).toUpperCase()} | DATE: ${formattedDate}`;
    
    const statusCell = worksheet.getCell(`F${currentRowNum}`);
    statusCell.value = statusText;

    // Heading Styling (Merged A-E)
    headingCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    headingCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } }; // Slate 700
    headingCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    headingCell.border = thinBorder;

    // Status Styling (F)
    statusCell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }; // Slate 800
    statusCell.alignment = { vertical: "middle", horizontal: "center" };
    statusCell.border = thinBorder;

    // Apply borders to merged cell range
    for (let c = 1; c <= 5; c++) {
      worksheet.getCell(currentRowNum, c).border = thinBorder;
    }
    currentRowNum++;

    // ═══════════════════════════════════════════════════════════
    // Row 2: ORDER LABEL ROW
    // ═══════════════════════════════════════════════════════════
    const orderLabelRow = worksheet.addRow([
      "Party Name",
      "Master Name",
      "Weaver Name",
      "Weaver Challan No",
      "Weaver Date",
      "Status",
    ]);
    orderLabelRow.height = 20;
    orderLabelRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF475569" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }; // Slate 100
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = thinBorder;
    });
    currentRowNum++;

    // ═══════════════════════════════════════════════════════════
    // Row 3: ORDER VALUE ROW
    // ═══════════════════════════════════════════════════════════
    const orderValueRow = worksheet.addRow([
      partyName,
      masterName,
      weaverName,
      challanNo,
      formattedDate,
      statusText,
    ]);
    orderValueRow.height = 20;
    orderValueRow.eachCell((cell, colIndex) => {
      cell.font = { name: "Arial", size: 9, color: { argb: "FF1E293B" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: colIndex === 4 || colIndex === 5 || colIndex === 6 ? "center" : "left",
        wrapText: true,
      };
      cell.border = thinBorder;
    });
    currentRowNum++;

    // ═══════════════════════════════════════════════════════════
    // Row 4: EXTRA LABEL ROW
    // ═══════════════════════════════════════════════════════════
    const extraLabelRow = worksheet.addRow([
      "Mill Name",
      "Marka",
      "Quality Name",
      "Total Taka",
      "Total Meter",
      "Average Meter",
    ]);
    extraLabelRow.height = 20;
    extraLabelRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF475569" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }; // Slate 100
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = thinBorder;
    });
    currentRowNum++;

    // ═══════════════════════════════════════════════════════════
    // Row 5: EXTRA VALUE ROW
    // ═══════════════════════════════════════════════════════════
    const extraValueRow = worksheet.addRow([
      millName,
      marka,
      qualityName,
      totalTaka,
      totalMeter,
      averageMeter,
    ]);
    extraValueRow.height = 20;
    extraValueRow.eachCell((cell, colIndex) => {
      cell.font = { name: "Arial", size: 9, color: { argb: "FF1E293B" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: colIndex >= 4 ? "right" : "left",
        wrapText: true,
      };
      if (colIndex === 4) cell.numFmt = "0";
      if (colIndex === 5 || colIndex === 6) cell.numFmt = "0.0";
      cell.border = thinBorder;
    });
    currentRowNum++;

    // ═══════════════════════════════════════════════════════════
    // Row 6: TAKA TABLE TITLE (Merged A to F)
    // ═══════════════════════════════════════════════════════════
    worksheet.mergeCells(currentRowNum, 1, currentRowNum, 6);
    const tableTitleCell = worksheet.getCell(`A${currentRowNum}`);
    tableTitleCell.value = "ROLL-WISE / TAKA-WISE METER DETAILS";
    tableTitleCell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    tableTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D9488" } }; // Teal 600
    tableTitleCell.alignment = { vertical: "middle", horizontal: "center" };
    tableTitleCell.border = thinBorder;

    for (let c = 1; c <= 6; c++) {
      worksheet.getCell(currentRowNum, c).border = thinBorder;
    }
    currentRowNum++;

    // ═══════════════════════════════════════════════════════════
    // Row 7: TAKA TABLE HEADER
    // ═══════════════════════════════════════════════════════════
    const takaHeaderRow = worksheet.addRow([
      "Sr. No.",
      "Taka Marka / Taka No",
      "Meter",
      "Weight",
      "Roll Status",
      "Remarks",
    ]);
    takaHeaderRow.height = 20;
    takaHeaderRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF374151" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }; // Slate 200
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = thinBorder;
    });
    currentRowNum++;

    // ═══════════════════════════════════════════════════════════
    // Row 8 onwards: TAKA DETAIL ROWS
    // ═══════════════════════════════════════════════════════════
    if (takaDetails.length > 0) {
      takaDetails.forEach((taka: any, index: number) => {
        const takaNo = taka.takaNo || taka.marka || "-";
        const meterVal = safeNumber(taka.meter);
        const weightVal = taka.weight ? safeNumber(taka.weight) : "-";
        const rollStatus = taka.isStamped ? "Stamped" : "Grey";
        const remarks = taka.remarks || "-";

        const takaRow = worksheet.addRow([
          index + 1,
          takaNo,
          meterVal,
          weightVal,
          rollStatus,
          remarks,
        ]);
        takaRow.height = 18;
        takaRow.eachCell((cell, colIndex) => {
          cell.font = { name: "Arial", size: 9, color: { argb: "FF374151" } };
          cell.border = thinBorder;
          cell.alignment = {
            vertical: "middle",
            horizontal:
              colIndex === 1 || colIndex === 2 || colIndex === 5
                ? "center"
                : colIndex === 3 || colIndex === 4
                ? "right"
                : "left",
          };
          if (colIndex === 3 && typeof meterVal === "number") cell.numFmt = "0.0";
          if (colIndex === 4 && typeof weightVal === "number") cell.numFmt = "0.0";
        });
        currentRowNum++;
      });
    } else {
      // Empty taka details row
      const emptyRow = worksheet.addRow([
        "-",
        "No Taka Details Found",
        "-",
        "-",
        "-",
        "-",
      ]);
      emptyRow.height = 18;
      emptyRow.eachCell((cell) => {
        cell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF9CA3AF" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = thinBorder;
      });
      currentRowNum++;
    }

    // ═══════════════════════════════════════════════════════════
    // Row 9: TOTAL ROW
    // ═══════════════════════════════════════════════════════════
    const totalRow = worksheet.addRow([
      "TOTAL",
      takaDetails.length,
      totalMeter,
      "-",
      "-",
      "-",
    ]);
    totalRow.height = 20;
    totalRow.eachCell((cell, colIndex) => {
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF1F2937" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }; // Slate 50
      cell.border = thinBorder;
      cell.alignment = {
        vertical: "middle",
        horizontal:
          colIndex === 1 || colIndex === 2 || colIndex === 5 || colIndex === 6
            ? "center"
            : "right",
      };
      if (colIndex === 3 && typeof totalMeter === "number") cell.numFmt = "0.0";
    });
    currentRowNum++;

    // ═══════════════════════════════════════════════════════════
    // Row 10: BLANK GAP ROW
    // ═══════════════════════════════════════════════════════════
    const blankRow = worksheet.addRow([]);
    blankRow.height = 15;
    currentRowNum++;
  });

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName}.xlsx`);
}

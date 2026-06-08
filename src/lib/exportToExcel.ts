import * as XLSX from "xlsx";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportToExcelOptions {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  fileName: string;
  sheetName?: string;
}

interface SheetConfig {
  name: string;
  data: Record<string, unknown>[];
  columns: ExportColumn[];
}

interface ExportMultiSheetOptions {
  sheets: SheetConfig[];
  fileName: string;
}

/**
 * Builds a worksheet from data and column definitions.
 */
function buildWorksheet(
  data: Record<string, unknown>[],
  columns: ExportColumn[]
): XLSX.WorkSheet {
  const exportData = data.map((row) => {
    const mappedRow: Record<string, unknown> = {};
    for (const col of columns) {
      mappedRow[col.header] = row[col.key] ?? "-";
    }
    return mappedRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  worksheet["!cols"] = columns.map((col) => ({
    wch: col.width ?? 15,
  }));

  return worksheet;
}

/**
 * Exports data to a single-sheet Excel file.
 */
export function exportToExcel({
  data,
  columns,
  fileName,
  sheetName = "Sheet1",
}: ExportToExcelOptions): void {
  const worksheet = buildWorksheet(data, columns);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Exports data to a multi-sheet Excel workbook.
 */
export function exportMultiSheetExcel({
  sheets,
  fileName,
}: ExportMultiSheetOptions): void {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = buildWorksheet(sheet.data, sheet.columns);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

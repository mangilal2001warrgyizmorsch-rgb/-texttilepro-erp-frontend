import { useMemo } from "react";

export function useTableTotals(tableData: { meter?: string | number; [key: string]: any }[]) {
  const totalTaka = useMemo(() => tableData.length, [tableData]);

  const totalMeter = useMemo(() => {
    return tableData.reduce((sum, row) => {
      const val = parseFloat(row.meter?.toString() || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [tableData]);

  return { totalTaka, totalMeter };
}

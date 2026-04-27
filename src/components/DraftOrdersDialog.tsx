"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DraftOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrder: (orderId: string, orderData: any) => void;
}

export default function DraftOrdersDialog({
  open,
  onOpenChange,
  onSelectOrder,
}: DraftOrdersDialogProps) {
  const [search, setSearch] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", "draft", search],
    queryFn: () => api.get<any[]>("/orders?status=draft"),
    enabled: open,
  });

  const filteredOrders = orders?.filter((order: any) =>
    order.firmName?.toLowerCase().includes(search.toLowerCase()) ||
    order.marka?.toLowerCase().includes(search.toLowerCase()) ||
    order.qualityName?.toLowerCase().includes(search.toLowerCase()) ||
    order.masterName?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSelect = (order: any) => {
    onSelectOrder(order._id, order);
    onOpenChange(false);
    toast.success(`Selected order: ${order.firmName} - ${order.marka}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Draft Order</DialogTitle>
          <DialogDescription>
            Choose a draft order to create a challan. The order details will be auto-filled in the challan form.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 items-center px-1">
          <Input
            placeholder="Search by firm name, marka, quality, or master..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-9"
          />
        </div>

        <div className="flex-1 overflow-auto border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              {orders?.length === 0 ? "No draft orders found" : "No matching orders"}
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  <TableHead className="text-xs">Firm</TableHead>
                  <TableHead className="text-xs">Master</TableHead>
                  <TableHead className="text-xs">Marka</TableHead>
                  <TableHead className="text-xs">Quality</TableHead>
                  <TableHead className="text-xs text-right">Meter</TableHead>
                  <TableHead className="text-xs text-right">Taka</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: any) => (
                  <TableRow key={order._id} className="hover:bg-muted/50">
                    <TableCell className="text-sm font-medium">{order.firmName}</TableCell>
                    <TableCell className="text-sm">{order.masterName || "-"}</TableCell>
                    <TableCell className="text-sm">{order.marka}</TableCell>
                    <TableCell className="text-sm">{order.qualityName}</TableCell>
                    <TableCell className="text-sm text-right">{order.totalMeter || "-"}</TableCell>
                    <TableCell className="text-sm text-right">{order.totalTaka || "-"}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleSelect(order)}
                        className="h-7 text-xs cursor-pointer"
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

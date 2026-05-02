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
    queryKey: ["orders", "PendingChallan", search],
    queryFn: () => api.get<any[]>("/orders?status=draft,PendingChallan"),
    enabled: open,
  });

  const filteredOrders = orders?.filter((order: any) =>
    order.partyName?.toLowerCase().includes(search.toLowerCase()) ||
    order.codeMasterId?.masterName?.toLowerCase().includes(search.toLowerCase()) ||
    order.brokerName?.toLowerCase().includes(search.toLowerCase()) ||
    order.weaverName?.toLowerCase().includes(search.toLowerCase()) ||
    order.weaverChNo?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSelect = (order: any) => {
    onSelectOrder(order._id, order);
    onOpenChange(false);
    toast.success(`Selected order: ${order.partyName} - ${order.weaverChNo || "N/A"}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Order for Challan</DialogTitle>
          <DialogDescription>
            Choose an order that is pending for party challan. The order details will be auto-filled in the form.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 items-center px-1">
          <Input
            placeholder="Search by party, master, weaver, or challan..."
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
              {orders?.length === 0 ? "No pending orders found" : "No matching orders"}
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  <TableHead className="text-xs">Party Name</TableHead>
                  <TableHead className="text-xs">Master Name</TableHead>
                  <TableHead className="text-xs">Weaver Name</TableHead>
                  <TableHead className="text-xs">W. Challan No</TableHead>
                  <TableHead className="text-xs">Weaver Date</TableHead>
                  <TableHead className="text-xs text-right">Taka</TableHead>
                  <TableHead className="text-xs text-right">Meter</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                  <TableHead className="text-xs text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: any) => (
                  <TableRow key={order._id} className="hover:bg-muted/50">
                    <TableCell className="text-sm font-medium">{order.partyName || "-"}</TableCell>
                    <TableCell className="text-sm">{order.codeMasterId?.masterName || order.brokerName || "-"}</TableCell>
                    <TableCell className="text-sm">{order.weaverName || "-"}</TableCell>
                    <TableCell className="text-sm">{order.weaverChNo || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{order.weaverChDate || order.orderDate || "-"}</TableCell>
                    <TableCell className="text-sm text-right">{order.totalTaka || "-"}</TableCell>
                    <TableCell className="text-sm text-right">{order.totalMeter || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] uppercase bg-gray-100 text-gray-700">
                        {order.status || "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
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

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, QrCode, Save, Loader2, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

export default function FinishMeterEntryPage() {
  const [lotNoInput, setLotNoInput] = useState("");
  const [activeLotNo, setActiveLotNo] = useState<string | null>(null);
  const [finishMeters, setFinishMeters] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lotData = useQuery(
    activeLotNo ? api.production.getLotByNo : "skip",
    { lotNo: activeLotNo }
  );

  const saveFinishMeter = useMutation(api.production.saveFinishMeter);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!lotNoInput.trim()) return;
    setActiveLotNo(lotNoInput.trim());
    setFinishMeters({});
  };

  const calculateShortage = (grey: number, finish: number) => {
    const short = grey - finish;
    const percent = (short / grey) * 100;
    return { short, percent };
  };

  const getFinishMeterColor = (grey: number, finish: number) => {
    if (finish > grey) return "text-red-500 font-bold";
    const { percent } = calculateShortage(grey, finish);
    if (percent > 25) return "text-emerald-500 font-bold";
    return "";
  };

  const handleSave = async () => {
    if (!lotData?.lot?._id) return;

    const items = Object.entries(finishMeters)
      .filter(([_, value]) => value.trim() !== "" && !isNaN(Number(value)))
      .map(([takaNo, value]) => ({
        takaNo,
        finishMeter: Number(value),
      }));

    if (items.length === 0) {
      toast.error("Please enter finish meter for at least one Taka");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveFinishMeter({
        orderId: lotData.lot.orderId,
        items,
      });
      toast.success("Finish meters saved successfully");
      // Refresh state
      setLotNoInput("");
      setActiveLotNo(null);
      setFinishMeters({});
    } catch (error) {
      toast.error("Failed to save finish meters");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Info className="text-primary" /> Finish Meter Entry
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            Track fabric measurements and shortages before dispatch.
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-primary/20">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <Label htmlFor="lotNo" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search Lot (Manual or QR)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lotNo"
                  placeholder="Enter Lot Number (e.g. 101)..."
                  className="pl-9 h-12 text-lg font-medium"
                  value={lotNoInput}
                  onChange={(e) => setLotNoInput(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                  title="Scan QR Code"
                >
                  <QrCode size={22} />
                </button>
              </div>
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 font-bold gap-2">
              <Search size={18} />
              Find Lot
            </Button>
          </form>
        </CardContent>
      </Card>

      {!activeLotNo && (
        <div className="py-20 border-2 border-dashed rounded-3xl bg-muted/5 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/40">
            <Search size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold">No Data Shown</h3>
            <p className="text-muted-foreground">Search a Lot to view pending finish meter entries.</p>
          </div>
        </div>
      )}

      {lotData === undefined && activeLotNo && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-muted-foreground font-medium animate-pulse">Fetching Lot details...</p>
        </div>
      )}

      {lotData && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-6 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Party Marka</p>
                <p className="font-bold text-xl">{lotData.lot.marka}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lot Number</p>
                <p className="font-bold text-xl text-primary">{lotData.lot.lotNo}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Party Name</p>
                <p className="font-semibold text-lg">{lotData.lot.partyName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quality</p>
                <p className="font-semibold text-lg">{lotData.lot.qualityName}</p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-card border rounded-2xl overflow-hidden shadow-md">
            <div className="px-6 py-4 border-b bg-muted/30 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={20} />
                Pending Entries ({lotData.takas.length})
              </h3>
              <Badge variant="secondary" className="font-bold px-3">
                Action Required
              </Badge>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Party Marka</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Lot No</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Taka No</TableHead>
                    <TableHead className="text-right font-bold uppercase text-[10px] tracking-wider">Grey Meter</TableHead>
                    <TableHead className="w-40 font-bold uppercase text-[10px] tracking-wider">Finish Meter</TableHead>
                    <TableHead className="text-right font-bold uppercase text-[10px] tracking-wider">Short Meter</TableHead>
                    <TableHead className="text-right font-bold uppercase text-[10px] tracking-wider">Shortage %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotData.takas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <Save size={24} />
                          </div>
                          <p className="text-lg font-bold text-foreground">Perfect!</p>
                          <p className="text-muted-foreground">No pending finish meter entries for this lot.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lotData.takas.map((taka: any) => {
                      const finishValue = Number(finishMeters[taka.takaNo] || 0);
                      const { short, percent } = finishValue > 0 
                        ? calculateShortage(taka.greyMeter, finishValue)
                        : { short: 0, percent: 0 };

                      return (
                        <TableRow key={taka.takaNo} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-medium text-muted-foreground">{lotData.lot.marka}</TableCell>
                          <TableCell className="font-medium text-muted-foreground">{lotData.lot.lotNo}</TableCell>
                          <TableCell className="font-bold">{taka.takaNo}</TableCell>
                          <TableCell className="text-right font-mono font-bold">{taka.greyMeter} m</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className={`h-10 font-mono text-lg border-2 focus-visible:ring-primary ${getFinishMeterColor(taka.greyMeter, finishValue)}`}
                              placeholder="Enter meter..."
                              value={finishMeters[taka.takaNo] || ""}
                              onChange={(e) => setFinishMeters({
                                ...finishMeters,
                                [taka.takaNo]: e.target.value
                              })}
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-muted-foreground">
                            {finishValue > 0 ? `${short.toFixed(2)}m` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-muted-foreground">
                            {finishValue > 0 ? `${percent.toFixed(1)}%` : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="p-6 border-t bg-muted/10 flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setLotNoInput("");
                  setActiveLotNo(null);
                  setFinishMeters({});
                }}
              >
                Clear Search
              </Button>
              <Button 
                size="lg"
                onClick={handleSave} 
                disabled={isSubmitting || lotData.takas.length === 0}
                className="gap-2 font-bold px-8 shadow-lg shadow-primary/10"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save size={20} />}
                Confirm & Save Entries
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import {  useQuery  } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/use-user-role";
import {
  TrendingUp, Package, Truck, FileText, ClipboardList, IndianRupee,
  CheckCircle, Clock, AlertCircle, BarChart3, Users,
} from "lucide-react";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const INR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OwnerDashboardInner() {
  const router = useRouter();
  const { isOwner, isLoading } = useUserRole();
  const stats = useQuery(api.users.getStats, isOwner ? {} : "skip");

  if (isLoading || stats === undefined) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading owner dashboard...</p>
        </div>
      </div>
    );
  }
  if (!isOwner) return (
    <div className="p-6 text-center text-muted-foreground">
      <p>Access denied. Owner role required.</p>
    </div>
  );

  const orderStatusData = Object.entries(stats.ordersByStatus).map(([k, v]) => ({ name: k, value: v }));
  const lotStatusData = Object.entries(stats.lotsByStatus).map(([k, v]) => ({ name: k, value: v }));

  const COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#06b6d4"];

  const billStatusColors: Record<string, string> = {
    Draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Issued: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Paid: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  const dispatchStatusColors: Record<string, string> = {
    Dispatched: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Billed: "bg-green-500/20 text-green-400 border-green-500/30",
    Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete business overview — financials, production, and operations</p>
        </div>
        <button
          onClick={() => router.push("/owner/users")}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <Users className="w-4 h-4" /> Manage Users
        </button>
      </div>

      {/* Financial Summary */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Billed" value={INR(stats.financials.totalBilled)} icon={<IndianRupee size={18} />} color="bg-blue-500/10 text-blue-400" />
          <StatCard label="Collected (Paid)" value={INR(stats.financials.totalPaid)} icon={<CheckCircle size={18} />} color="bg-green-500/10 text-green-400" sub={`${stats.billsByStatus.Paid} bills`} />
          <StatCard label="Outstanding" value={INR(stats.financials.totalPending)} icon={<Clock size={18} />} color="bg-orange-500/10 text-orange-400" sub={`${stats.billsByStatus.Draft + stats.billsByStatus.Issued} bills`} />
        </div>
      </section>

      {/* Volume Summary */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Production Volume</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Ordered (m)" value={stats.meters.totalOrderedMeter.toLocaleString()} icon={<Package size={18} />} color="bg-purple-500/10 text-purple-400" sub={`${stats.totals.orders} orders`} />
          <StatCard label="Finished (m)" value={stats.meters.totalFinishedMeter.toLocaleString()} icon={<TrendingUp size={18} />} color="bg-emerald-500/10 text-emerald-400" sub={`${stats.totals.lots} lots`} />
          <StatCard label="Dispatched (m)" value={stats.meters.totalDispatchedMeter.toLocaleString()} icon={<Truck size={18} />} color="bg-cyan-500/10 text-cyan-400" sub={`${stats.totals.dispatches} dispatches`} />
        </div>
      </section>

      {/* Charts */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Orders by Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={orderStatusData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {orderStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Lots by Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={lotStatusData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {lotStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bill Status Counters */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Bill Status</h2>
        <div className="grid grid-cols-3 gap-3">
          {(["Draft", "Issued", "Paid"] as const).map((s) => (
            <Card key={s}>
              <CardContent className="flex flex-col items-center gap-1 py-4">
                <p className="text-2xl font-bold">{stats.billsByStatus[s]}</p>
                <Badge variant="outline" className={billStatusColors[s]}>{s}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Dispatches */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Dispatches</h2>
        <Card>
          <CardContent className="p-0">
            {stats.recentDispatches.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No dispatches yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Dispatch No</th>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Date</th>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Party</th>
                    <th className="text-right px-4 py-2 text-muted-foreground font-medium text-xs">Meter</th>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentDispatches.map((d, i) => (
                    <tr key={d._id} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-2 font-mono text-xs text-primary">{d.dispatchNo}</td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">{format(new Date(d.dispatchDate), "dd/MM/yy")}</td>
                      <td className="px-4 py-2 font-medium text-xs">{d.partyName}</td>
                      <td className="px-4 py-2 text-right text-xs">{d.finishedMeter.toLocaleString()}</td>
                      <td className="px-4 py-2"><Badge variant="outline" className={dispatchStatusColors[d.status] ?? ""}>{d.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent Bills */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Bills</h2>
        <Card>
          <CardContent className="p-0">
            {stats.recentBills.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No bills yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Bill No</th>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Date</th>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Party</th>
                    <th className="text-right px-4 py-2 text-muted-foreground font-medium text-xs">Total</th>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentBills.map((b, i) => (
                    <tr key={b._id} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-2 font-mono text-xs text-primary">{b.billNo}</td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">{format(new Date(b.billDate), "dd/MM/yy")}</td>
                      <td className="px-4 py-2 font-medium text-xs">{b.partyName}</td>
                      <td className="px-4 py-2 text-right font-semibold text-xs text-green-400">{INR(b.totalAmount)}</td>
                      <td className="px-4 py-2"><Badge variant="outline" className={billStatusColors[b.status] ?? ""}>{b.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}



"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@/lib/convex-mock";
import { api } from "@/lib/convex-mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { toast } from "sonner";
import { Stamp, Search, CheckCircle2, Loader2, AlertCircle, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StampingPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "search">("search");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchType, setSearchType] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");

  const searchFilters = {
    takaMarka: searchType === "takaMarka" ? searchValue.trim() : "",
    weaverChNo: searchType === "weaverChNo" ? searchValue.trim() : "",
    weaverMarka: "",
    baleNo: searchType === "baleNo" ? searchValue.trim() : "",
    lotNo: searchType === "lotNo" ? searchValue.trim() : "",
  };

  const isSearchReady = searchType && searchValue.trim();

  const [selectedTaka, setSelectedTaka] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stampman State
  const [selectedStampmanId, setSelectedStampmanId] = useState<string>("");
  const [stampmanModalOpen, setStampmanModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    empCode: "",
    employeeName: "",
    department: "",
    designation: "",
    machine: "",
  });

  const formatEmpCode = (value: string) => {
    const raw = value.replace(/\D/g, '').substring(0, 12);
    return raw.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Queries
  const pendingLots = useQuery(api.stamping.listStampable, {});
  const searchResults = useQuery(
    activeTab === "search" ? api.stamping.searchTaka : "skip",
    searchFilters
  );
  const employees = useQuery(api.employees.list, {});

  // Mutations
  const stampMultiple = useMutation(api.stamping.stampMultiple);
  const createEmployee = useMutation(api.employees.create);

  const toggleSelection = (taka: any) => {
    const isSelected = selectedTaka.some(
      (s) => s.orderId === taka.orderId && s.takaIndex === taka.takaIndex
    );
    if (isSelected) {
      setSelectedTaka(
        selectedTaka.filter(
          (s) => !(s.orderId === taka.orderId && s.takaIndex === taka.takaIndex)
        )
      );
    } else {
      setSelectedTaka([...selectedTaka, taka]);
    }
  };

  const handleConfirmStamping = async () => {
    setIsSubmitting(true);
    try {
      const stampman = employees?.find((e: any) => e._id === selectedStampmanId);
      await stampMultiple({
        items: selectedTaka.map((s) => ({ orderId: s.orderId, takaIndex: s.takaIndex })),
        stampmanId: stampman?._id,
        stampmanName: stampman?.employeeName,
        stampmanCode: stampman?.empCode,
      });
      toast.success(`${selectedTaka.length} Takas marked as Stamped`);
      setSelectedTaka([]);
      setConfirmOpen(false);
    } catch (error) {
      toast.error("Failed to confirm stamping");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.empCode || !newEmployee.employeeName || !newEmployee.department || !newEmployee.designation || !newEmployee.machine) {
      toast.error("All fields are mandatory");
      return;
    }
    const rawEmpCode = newEmployee.empCode.replace(/\s/g, '');
    if (rawEmpCode.length !== 12) {
      toast.error("Emp Code must be exactly 12 digits");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createEmployee(newEmployee);
      toast.success("Employee added successfully");
      setStampmanModalOpen(false);
      setNewEmployee({ empCode: "", employeeName: "", department: "", designation: "", machine: "" });
      if (created?._id) {
        setSelectedStampmanId(created._id);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || "Failed to add employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stampmanSelectionDialog = (
    <Dialog open={stampmanModalOpen} onOpenChange={setStampmanModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>Create a new Stampman in the Employee Master.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Emp Code (12 digits)</Label>
            <Input 
              placeholder="1234 5678 9012" 
              value={newEmployee.empCode}
              onChange={(e) => setNewEmployee({...newEmployee, empCode: formatEmpCode(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label>Employee Name</Label>
            <Input 
              placeholder="Name" 
              value={newEmployee.employeeName}
              onChange={(e) => setNewEmployee({...newEmployee, employeeName: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input 
              placeholder="e.g. Stamping" 
              value={newEmployee.department}
              onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Designation</Label>
            <Input 
              placeholder="e.g. Stampman" 
              value={newEmployee.designation}
              onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Machine</Label>
            <Input 
              placeholder="Machine Name/No" 
              value={newEmployee.machine}
              onChange={(e) => setNewEmployee({...newEmployee, machine: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setStampmanModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddEmployee} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!selectedStampmanId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[80vh]">
        <div className="bg-card border rounded-xl p-8 shadow-lg max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <Stamp size={24} />
            </div>
            <h1 className="text-2xl font-bold">Select Stampman</h1>
            <p className="text-muted-foreground text-sm">You must select a stampman before continuing.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stampman</Label>
              <Select value={selectedStampmanId} onValueChange={(val) => {
                if (val === "ADD_NEW") {
                  setStampmanModalOpen(true);
                } else {
                  setSelectedStampmanId(val);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp: any) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.employeeName} ({emp.empCode})
                    </SelectItem>
                  ))}
                  <SelectItem value="ADD_NEW" className="text-primary font-medium border-t rounded-none mt-1 pt-2 cursor-pointer">
                    + Add New Employee
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {stampmanSelectionDialog}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Stamp className="text-primary" size={32} />
            Stamping Module
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            Manage pending lots and confirm Taka stamping for processing.
          </p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "pending"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Lots
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "search"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Search Unstamped Taka
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === "pending" ? (
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="font-semibold text-lg">Pending Lots for Stamping</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Lot No</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Master Name</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead className="text-right">Total Taka</TableHead>
                    <TableHead className="text-right">Total Meter</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLots === undefined ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : pendingLots?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon"><Stamp className="opacity-20" size={48}/></EmptyMedia>
                            <EmptyTitle>No pending lots</EmptyTitle>
                            <EmptyDescription>All lots are currently stamped.</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingLots.map((lot: any) => (
                      <TableRow key={lot._id} className="hover:bg-muted/50 cursor-pointer" onClick={() => {
                        setSearchType("lotNo");
                        setSearchValue(lot.lotNo);
                        setActiveTab("search");
                      }}>
                        <TableCell className="whitespace-nowrap">
                          {lot.date ? format(new Date(lot.date), "dd/MM/yyyy") : "N/A"}
                        </TableCell>
                        <TableCell className="font-bold text-primary">{lot.lotNo}</TableCell>
                        <TableCell>{lot.partyName}</TableCell>
                        <TableCell>{lot.masterName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">{lot.qualityName}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{lot.totalTaka}</TableCell>
                        <TableCell className="text-right font-medium">{lot.totalMeter}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <div 
                  className="flex items-center justify-between mb-4 cursor-pointer sm:cursor-default"
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <Search size={20} className="text-primary" />
                    <h2 className="font-semibold text-lg">Search Unstamped Taka</h2>
                  </div>
                  <div className="sm:hidden text-muted-foreground">
                    {isSearchExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                <div className={`flex-col sm:flex-row gap-4 ${isSearchExpanded ? 'flex' : 'hidden sm:flex'}`}>
                  <div className="w-full sm:w-[250px]">
                    <Select value={searchType} onValueChange={(val) => { setSearchType(val); setSearchValue(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select search type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lotNo">Lot No</SelectItem>
                        <SelectItem value="takaMarka">Taka Marka</SelectItem>
                        <SelectItem value="weaverChNo">Weaver Challan No</SelectItem>
                        <SelectItem value="baleNo">Bale No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder={
                        searchType === "lotNo" ? "Enter Lot No" :
                        searchType === "takaMarka" ? "Enter Taka Marka" :
                        searchType === "weaverChNo" ? "Enter Weaver Challan No" :
                        searchType === "baleNo" ? "Enter Bale No" :
                        "Select a search type first"
                      }
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      disabled={!searchType}
                      className="flex-1"
                    />
                    {(searchType || searchValue) ? (
                      <Button variant="outline" size="icon" onClick={() => { setSearchType(""); setSearchValue(""); }}>
                        <X size={16} />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b bg-muted/30 flex justify-between items-center">
                  <h3 className="font-semibold">Matching Taka</h3>
                  {searchResults && (
                    <span className="text-xs text-muted-foreground">
                      {searchResults.length} results found
                    </span>
                  )}
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Lot No</TableHead>
                        <TableHead>Taka Marka</TableHead>
                        <TableHead>Party Marka</TableHead>
                        <TableHead>Weaver Ch</TableHead>
                        <TableHead>Sr No</TableHead>
                        <TableHead className="text-right">Meter</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults === undefined ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                          </TableRow>
                        ))
                      ) : searchResults?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                            No matching records found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        searchResults.map((taka: any) => {
                          const isSelected = selectedTaka.some(
                            (s) => s.orderId === taka.orderId && s.takaIndex === taka.takaIndex
                          );
                          return (
                            <TableRow 
                              key={`${taka.orderId}-${taka.takaIndex}`}
                              className={`hover:bg-muted/50 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                              onClick={() => toggleSelection(taka)}
                            >
                              <TableCell>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                                  {isSelected && <CheckCircle2 size={14} />}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{taka.lotNo}</TableCell>
                              <TableCell className="font-bold">{taka.takaNo}</TableCell>
                              <TableCell>{taka.partyMarka || "-"}</TableCell>
                              <TableCell>{taka.weaverChNo || "-"}</TableCell>
                              <TableCell className="text-center">{taka.takaSerialNo}</TableCell>
                              <TableCell className="text-right font-mono font-bold">{taka.takaMeter}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-card border rounded-xl shadow-md overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b bg-primary text-primary-foreground flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle2 size={20} />
                Selection
              </h3>
              <Badge variant="secondary" className="font-bold">
                {selectedTaka.length} Selected
              </Badge>
            </div>
            
            <div className="p-0 max-h-[calc(100vh-350px)] overflow-y-auto">
              {selectedTaka.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">
                    No Taka selected for stamping.
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Search and click on Taka to add them here.
                  </p>
                </div>
              ) : (
                <div className="divide-y border-b">
                  {selectedTaka.map((taka: any, _idx: number) => (
                    <div key={`${taka.orderId}-${taka.takaIndex}`} className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            Lot: {taka.lotNo}
                          </span>
                          <span className="text-sm font-bold">Sr No: {taka.takaSerialNo}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">Marka: <span className="text-foreground font-medium">{taka.partyMarka}</span></span>
                          <span className="flex items-center gap-1">Meter: <span className="text-foreground font-medium font-mono">{taka.takaMeter}</span></span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => toggleSelection(taka)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-muted/10 space-y-4">
              {selectedTaka.length > 0 && (
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg p-6 space-y-4">
                  <div className="text-center space-y-3">
                    {selectedTaka.map((taka: any, idx: number) => (
                      <div key={`${taka.orderId}-${taka.takaIndex}`} className={`${idx > 0 ? "mt-4 pt-4 border-t border-primary/20" : ""}`}>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Taka {idx + 1} of {selectedTaka.length}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs uppercase text-muted-foreground font-semibold mb-1">Party Marka</div>
                            <div className="text-3xl font-bold text-primary tracking-wide">{taka.partyMarka || "-"}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <div className="text-xs uppercase text-muted-foreground font-semibold mb-1">Lot No</div>
                              <div className="text-2xl font-bold text-foreground">{taka.lotNo}</div>
                            </div>
                            <div>
                              <div className="text-xs uppercase text-muted-foreground font-semibold mb-1">Sr No</div>
                              <div className="text-2xl font-bold text-foreground">{taka.takaSerialNo}</div>
                            </div>
                            <div>
                              <div className="text-xs uppercase text-muted-foreground font-semibold mb-1">Mtr</div>
                              <div className="text-2xl font-bold text-foreground font-mono">{taka.takaMeter}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 gap-2" 
                disabled={selectedTaka.length === 0}
                onClick={() => setConfirmOpen(true)}
              >
                <Stamp size={20} />
                Confirm Stamping
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Stamping</DialogTitle>
            <DialogDescription asChild>
              <div className="pt-2">
                <div className="bg-muted/50 p-4 rounded-lg border space-y-3 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-bold uppercase text-[10px]">Total Selected</span>
                    <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{selectedTaka.length} Taka</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-3">
                    <span className="text-muted-foreground font-bold uppercase text-[10px]">Total Meter</span>
                    <span className="font-bold text-foreground">
                      {selectedTaka.reduce((sum, t) => sum + (t.takaMeter || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-3">
                    <span className="text-muted-foreground font-bold uppercase text-[10px]">Stamping Date</span>
                    <span className="font-medium text-foreground">{format(new Date(), "dd MMM yyyy")}</span>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  This will mark {selectedTaka.length} Taka as "Stamped" and they will be ready for the next process.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-between gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              className="gap-2 min-w-[140px]" 
              onClick={handleConfirmStamping}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




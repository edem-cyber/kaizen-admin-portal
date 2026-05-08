"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Loader2, 
  MoreHorizontal, 
  Pencil, 
  Plus, 
  FileText, 
  Trash2, 
  AlertCircle,
  Banknote,
  Calendar,
  Building2,
  Receipt,
  CreditCard
} from "lucide-react";
import { ViewToggle } from "@/components/ui/view-toggle";
import { PaginationController } from "@/components/ui/pagination-controller";
import { useGetOrganizations } from "@/lib/generated/org/organizations/organizations";
import { 
  useGetInvoices, 
  useAddInvoice, 
  useUpdateInvoice, 
  useInitiatePayment,
  useCancelInvoice,
  getGetInvoicesQueryKey
} from "@/lib/generated/billing/invoices/invoices";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";
import type { 
  CreateInvoiceDto, 
  UpdateInvoiceDto, 
  InvoiceItemSummaryDto,
  InvoiceDto
} from "@/lib/generated/billing/models";

export default function AdminBillingPage() {
  const { symbol: globalSymbol } = useCurrency();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
  const [currentPage, setCurrentPage] = React.useState(1);
  const limit = 20;
  
  // Dialog States
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = React.useState(false);
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = React.useState(false);
  const [isCancelInvoiceOpen, setIsCancelInvoiceOpen] = React.useState(false);
  const [editingInvoice, setEditingInvoice] = React.useState<InvoiceDto | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = React.useState<InvoiceDto | null>(null);
  
  // Form State
  const [invoiceFormData, setInvoiceFormData] = React.useState<CreateInvoiceDto>({
    organizationId: 0,
    providerId: 0,
    clientReference: "",
    description: "",
    currencyId: 1, // Default GHS
    productType: "DIRECT_BOOKING",
    serviceDate: new Date().toISOString().split('T')[0],
    invoiceItems: [
      { amount: "0", unitPrice: "0", quantity: 1, description: "" }
    ],
  });

  const [editDescription, setEditDescription] = React.useState("");
  const [cancelNarration, setCancelNarration] = React.useState("");

  // Data Fetching
  const { data: orgsData } = useGetOrganizations({ limit: 100 });
  const { data: invoicesData, isLoading: isLoadingInvoices, error: invoicesError } = useGetInvoices({ 
    page: currentPage, 
    limit,
    includeRelations: true 
  });

  const orgs = Array.isArray(orgsData?.data) ? orgsData.data : [];
  const invoices = Array.isArray(invoicesData?.data) ? invoicesData.data : [];
  const pagination = invoicesData?.pagination;

  const getOrgName = (orgId: number) => {
    return orgs.find(o => o.id === orgId)?.name || `Org #${orgId}`;
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getOrgName(inv.organizationId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutations
  const createInvoiceMutation = useAddInvoice({
    mutation: {
      onSuccess: () => {
        toast.success("Invoice created successfully");
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        setIsCreateInvoiceOpen(false);
        resetInvoiceForm();
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to create invoice");
      }
    }
  });

  const updateInvoiceMutation = useUpdateInvoice({
    mutation: {
      onSuccess: () => {
        toast.success("Invoice updated successfully");
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        setIsEditInvoiceOpen(false);
        setEditingInvoice(null);
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to update invoice");
      }
    }
  });

  const initiatePaymentMutation = useInitiatePayment({
    mutation: {
      onSuccess: (response) => {
        const checkoutUrl = (response as any)?.data?.checkoutUrl;
        if (checkoutUrl) {
          window.open(checkoutUrl, "_blank");
          toast.success("Redirecting to payment gateway...");
        } else {
          toast.success("Payment initiated");
        }
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to initiate payment");
      }
    }
  });

  const cancelInvoiceMutation = useCancelInvoice({
    mutation: {
      onSuccess: () => {
        toast.success("Invoice cancelled successfully");
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        setIsCancelInvoiceOpen(false);
        setCancellingInvoice(null);
        setCancelNarration("");
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to cancel invoice");
      }
    }
  });

  const resetInvoiceForm = () => {
    setInvoiceFormData({
      organizationId: 0,
      providerId: 0,
      clientReference: "",
      description: "",
      currencyId: 1,
      productType: "DIRECT_BOOKING",
      serviceDate: new Date().toISOString().split('T')[0],
      invoiceItems: [
        { amount: "0", unitPrice: "0", quantity: 1, description: "" }
      ],
    });
  };

  const handleAddItem = () => {
    setInvoiceFormData({
      ...invoiceFormData,
      invoiceItems: [
        ...invoiceFormData.invoiceItems,
        { amount: "0", unitPrice: "0", quantity: 1, description: "" }
      ]
    });
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceFormData.invoiceItems.length <= 1) return;
    const newItems = [...invoiceFormData.invoiceItems];
    newItems.splice(index, 1);
    setInvoiceFormData({ ...invoiceFormData, invoiceItems: newItems });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemSummaryDto, value: any) => {
    const newItems = [...invoiceFormData.invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === "unitPrice" || field === "quantity") {
      const up = parseFloat(newItems[index].unitPrice) || 0;
      const q = parseInt(String(newItems[index].quantity)) || 0;
      newItems[index].amount = (up * q).toString();
    }
    setInvoiceFormData({ ...invoiceFormData, invoiceItems: newItems });
  };

  const handleCreateInvoice = () => {
    if (invoiceFormData.organizationId === 0) {
      toast.error("Please select a recipient organization");
      return;
    }
    if (!invoiceFormData.description) {
      toast.error("Please provide a description");
      return;
    }
    createInvoiceMutation.mutate({ data: invoiceFormData });
  };

  const handleUpdateInvoice = () => {
    if (!editingInvoice) return;
    updateInvoiceMutation.mutate({ 
      id: editingInvoice.id, 
      data: { description: editDescription } 
    });
  };

  const handleCancelInvoice = () => {
    if (!cancellingInvoice || !cancelNarration) {
      toast.error("Please provide a narration for cancellation");
      return;
    }
    cancelInvoiceMutation.mutate({ 
      data: { 
        reference: cancellingInvoice.referenceCode || "", 
        narration: cancelNarration 
      } 
    });
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case "PAID": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Paid</Badge>;
      case "PENDING": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Pending</Badge>;
      case "CANCELLED": return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200">Cancelled</Badge>;
      case "PARTIALLY_PAID": return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">Partial</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatInvoiceAmount = (inv: InvoiceDto) => {
    const symbol = inv.currency?.symbol || inv.currency?.code || globalSymbol;
    return `${symbol}${parseFloat(String(inv.amount || "0")).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-slate-500 text-lg">Manage and track platform billing activities</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <Button 
            className="bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"
            onClick={() => { resetInvoiceForm(); setIsCreateInvoiceOpen(true); }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search reference, org or memo..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 h-11 border-slate-200 focus-visible:ring-violet-500 rounded-xl"
          />
        </div>
      </div>

      {isLoadingInvoices ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
          <p className="text-slate-500 font-medium">Loading invoices...</p>
        </div>
      ) : invoicesError ? (
        <div className="text-center py-20 text-red-500 bg-red-50 rounded-2xl border border-red-100">
          <AlertCircle className="h-10 w-10 mx-auto mb-3" />
          <p className="font-semibold text-lg">Failed to load invoices</p>
          <p className="text-sm">Please try again later or contact support.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === "list" ? (
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="font-semibold">Recipient</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-slate-500">
                        <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors">
                            <FileText className="h-4 w-4" />
                          </div>
                          <code className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{inv.referenceCode}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{getOrgName(inv.organizationId)}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{inv.description}</div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">{formatInvoiceAmount(inv)}</TableCell>
                      <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {inv.status === "PENDING" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-200">
                              <DropdownMenuItem onClick={() => { setEditingInvoice(inv); setEditDescription(inv.description || ""); setIsEditInvoiceOpen(true); }}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Description
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-violet-600 focus:text-violet-700 font-bold"
                                onClick={() => initiatePaymentMutation.mutate({ data: { reference: inv.referenceCode || "" } })}
                              >
                                <Banknote className="mr-2 h-4 w-4" /> Pay Now
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-700"
                                onClick={() => { setCancellingInvoice(inv); setIsCancelInvoiceOpen(true); }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Cancel Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-slate-300" disabled>Finalized</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredInvoices.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
                   <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                   No invoices found
                </div>
              ) : filteredInvoices.map((inv) => (
                <Card key={inv.id} className="group relative border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">{inv.referenceCode}</code>
                          {getInvoiceStatusBadge(inv.status)}
                        </div>
                        <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1">{getOrgName(inv.organizationId)}</CardTitle>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Amount</p>
                      <p className="text-2xl font-black text-slate-900">{formatInvoiceAmount(inv)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-50 pt-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 line-clamp-1">
                        <Building2 className="h-3 w-3" />
                        ID: {inv.organizationId}
                      </div>
                    </div>
                    {inv.status === "PENDING" && (
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          className="flex-1 bg-violet-600 hover:bg-violet-700 h-9 rounded-xl text-xs font-bold"
                          onClick={() => initiatePaymentMutation.mutate({ data: { reference: inv.referenceCode || "" } })}
                        >
                          Pay Now
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-200">
                            <DropdownMenuItem onClick={() => { setEditingInvoice(inv); setEditDescription(inv.description || ""); setIsEditInvoiceOpen(true); }}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Description
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-700"
                              onClick={() => { setCancellingInvoice(inv); setIsCancelInvoiceOpen(true); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Cancel Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <PaginationController
            currentPage={currentPage}
            totalPages={pagination?.totalPages || 1}
            totalCount={pagination?.totalCount || 0}
            limit={limit}
            onPageChange={setCurrentPage}
            itemName="invoices"
          />
        </div>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl">
          <div className="bg-linear-to-r from-violet-600 to-indigo-600 p-8 text-white relative">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black flex items-center gap-3">
                <FileText className="h-8 w-8 text-violet-200" />
                New Invoice
              </DialogTitle>
              <DialogDescription className="text-violet-100 text-lg opacity-90">
                Generate a formal billing request for a client or partner
              </DialogDescription>
            </DialogHeader>
            <Receipt className="absolute right-8 top-8 h-24 w-24 text-white/10 rotate-12" />
          </div>
          
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-violet-600" />
                    Target Organization *
                  </Label>
                  <Select 
                    value={String(invoiceFormData.organizationId)} 
                    onValueChange={(v) => setInvoiceFormData({ ...invoiceFormData, organizationId: parseInt(v) })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-violet-500 shadow-sm"><SelectValue placeholder="Choose organization..." /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {orgs.map(org => (
                        <SelectItem key={org.id} value={String(org.id)} className="rounded-lg">{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-violet-600" />
                    Currency *
                  </Label>
                  <Select value={String(invoiceFormData.currencyId)} onValueChange={(v) => setInvoiceFormData({ ...invoiceFormData, currencyId: parseInt(v) })}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-violet-500 shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      <SelectItem value="1" className="rounded-lg">GHS (Ghana Cedi)</SelectItem>
                      <SelectItem value="2" className="rounded-lg">USD (US Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Memo / Description *</Label>
                <Input 
                  placeholder="What is this invoice for?" 
                  value={invoiceFormData.description} 
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 focus:ring-violet-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">Service Date</Label>
                  <Input 
                    type="date"
                    value={invoiceFormData.serviceDate} 
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, serviceDate: e.target.value })}
                    className="h-12 rounded-xl border-slate-200 focus:ring-violet-500 shadow-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">Reference (Optional)</Label>
                  <Input 
                    placeholder="e.g. PO-789" 
                    value={invoiceFormData.clientReference || ""} 
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, clientReference: e.target.value })}
                    className="h-12 rounded-xl border-slate-200 focus:ring-violet-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-black text-slate-900">Line Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-9 rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50 font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {invoiceFormData.invoiceItems.map((item, index) => (
                    <div key={index} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 shadow-inner group relative">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-white border border-slate-100 shadow-md text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <Input 
                          placeholder="Item description (e.g. Monthly Subscription)" 
                          value={item.description} 
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          className="bg-white rounded-xl h-11 border-slate-200"
                        />
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-black text-slate-400 px-1">Unit Price</Label>
                            <Input 
                              type="number"
                              value={item.unitPrice} 
                              onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                              className="bg-white rounded-xl h-11 border-slate-200 font-medium"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-black text-slate-400 px-1">Qty</Label>
                            <Input 
                              type="number"
                              value={item.quantity} 
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              className="bg-white rounded-xl h-11 border-slate-200 font-medium"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-black text-slate-400 px-1 text-right">Total</Label>
                            <div className="h-11 bg-slate-100/80 rounded-xl flex items-center justify-end px-4 font-black text-slate-900 border border-slate-200">
                              {globalSymbol}{(parseFloat(item.amount) || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900 text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Total Due</p>
                  <p className="text-4xl font-black tracking-tighter">
                    {invoiceFormData.currencyId === 1 ? "GHS" : "USD"} {invoiceFormData.invoiceItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0).toLocaleString()}
                  </p>
                </div>
                <CreditCard className="absolute right-0 bottom-0 h-32 w-32 text-white/5 -mb-8 -mr-8" />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 border-t bg-slate-50 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCreateInvoiceOpen(false)} className="h-12 rounded-xl px-6 font-bold text-slate-500 hover:text-slate-900">Discard</Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700 h-12 rounded-2xl px-8 font-black shadow-xl shadow-violet-500/20 min-w-[180px] transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleCreateInvoice}
              disabled={createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authorize & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditInvoiceOpen} onOpenChange={setIsEditInvoiceOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Pencil className="h-6 w-6 text-violet-600" />
              Edit Memo
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Update the description for invoice <span className="text-slate-900 font-bold">{editingInvoice?.referenceCode}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mb-8">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">New Description</Label>
              <Input 
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)} 
                placeholder="Brief description of charges..."
                className="h-12 rounded-xl border-slate-200 focus:ring-violet-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsEditInvoiceOpen(false)} className="h-12 rounded-xl font-bold flex-1">Cancel</Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700 h-12 rounded-xl font-black flex-1"
              onClick={handleUpdateInvoice}
              disabled={updateInvoiceMutation.isPending}
            >
              {updateInvoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelInvoiceOpen} onOpenChange={setIsCancelInvoiceOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-red-600 flex items-center gap-2">
              <AlertCircle className="h-7 w-7" />
              Cancel Invoice
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-lg leading-relaxed">
              Confirming this will void invoice <span className="text-slate-900 font-bold">{cancellingInvoice?.referenceCode}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mb-8">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Reason for Cancellation *</Label>
              <Input 
                value={cancelNarration} 
                onChange={(e) => setCancelNarration(e.target.value)} 
                placeholder="e.g. Duplicate entry, incorrect details..."
                className="h-12 rounded-xl border-red-100 bg-red-50/30 focus:ring-red-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsCancelInvoiceOpen(false)} className="h-12 rounded-xl font-bold flex-1">Keep Active</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-black flex-1"
              onClick={handleCancelInvoice}
              disabled={cancelInvoiceMutation.isPending}
            >
              {cancelInvoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Void Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
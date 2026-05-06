"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useGetDiscounts,
  useSearchDiscounts,
  useAddDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
  getGetDiscountsQueryKey,
  getSearchDiscountsQueryKey,
} from "@/lib/generated/billing/discounts/discounts";
import type { Discount, UpdateDiscountDto } from "@/lib/generated/billing/models";
import { queryClient } from "@/lib/react-query-provider";
import { Tag, Search, Loader2, Plus, Pencil, Trash2, Calendar, Sparkles } from "lucide-react";
import { ViewToggle } from "@/components/ui/view-toggle";
import { PaginationController } from "@/components/ui/pagination-controller";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const discountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  value: z.string().min(1, "Value is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean().default(true),
  organizationId: z.string().optional(),
});

type DiscountFormValues = z.infer<typeof discountSchema>;

export default function AdminDiscountsPage() {
  const { symbol } = useCurrency();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = React.useState(1);
  const limit = 20;

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingDiscount, setEditingDiscount] = React.useState<Discount | null>(null);
  const [deletingDiscount, setDeletingDiscount] = React.useState<Discount | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      discountType: "percentage",
      value: "",
      startDate: "",
      endDate: "",
      active: true,
      organizationId: "",
    },
  });

  const selectedType = watch("discountType");

  const isSearching = debouncedSearch.trim().length > 0;
  
  const stdQuery = useGetDiscounts(
    { page: currentPage, limit },
    { query: { enabled: !isSearching } }
  );
  
  const searchQuery = useSearchDiscounts(
    { q: debouncedSearch, page: currentPage, limit },
    { query: { enabled: isSearching } }
  );

  const activeQuery = isSearching ? searchQuery : stdQuery;
  const discounts = Array.isArray(activeQuery.data?.data) ? (activeQuery.data.data as Discount[]) : [];
  const pagination = activeQuery.data?.pagination;

  const createMutation = useAddDiscount({
    mutation: {
      onSuccess: () => {
        toast.success("Discount created successfully");
        queryClient.invalidateQueries({ queryKey: getGetDiscountsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getSearchDiscountsQueryKey() });
        setIsCreateOpen(false);
        reset();
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to create discount");
      },
    },
  });

  const updateMutation = useUpdateDiscount({
    mutation: {
      onSuccess: () => {
        toast.success("Discount updated successfully");
        queryClient.invalidateQueries({ queryKey: getGetDiscountsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getSearchDiscountsQueryKey() });
        setEditingDiscount(null);
        reset();
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to update discount");
      },
    },
  });

  const deleteMutation = useDeleteDiscount({
    mutation: {
      onSuccess: () => {
        toast.success("Discount deleted successfully");
        queryClient.invalidateQueries({ queryKey: getGetDiscountsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getSearchDiscountsQueryKey() });
        setDeletingDiscount(null);
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to delete discount");
      },
    },
  });

  const onSubmit = (data: DiscountFormValues) => {
    if (editingDiscount) {
      const updateData: UpdateDiscountDto = {
        name: data.name,
        description: data.description || "",
        active: data.active,
      };
      updateMutation.mutate({ id: editingDiscount.id, data: updateData });
    } else {
      const createData: Discount = {
        id: 0,
        name: data.name,
        code: data.code,
        description: data.description || "",
        percentage: data.discountType === "percentage" ? Number(data.value) as any : null,
        fixedValue: data.discountType === "fixed" ? Number(data.value) as any : null,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        active: data.active,
        organizationId: data.organizationId ? Number(data.organizationId) : null,
        createdAt: new Date().toISOString(),
        modifiedAt: null,
      };
      createMutation.mutate({ data: createData });
    }
  };

  const openEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    reset({
      name: discount.name,
      code: discount.code,
      description: discount.description || "",
      discountType: discount.percentage ? "percentage" : "fixed",
      value: String(discount.percentage ?? discount.fixedValue ?? ""),
      startDate: discount.startDate ? discount.startDate.split("T")[0] : "",
      endDate: discount.endDate ? discount.endDate.split("T")[0] : "",
      active: discount.active ?? true,
      organizationId: discount.organizationId ? String(discount.organizationId) : "",
    });
  };

  const confirmDelete = () => {
    if (deletingDiscount) {
      deleteMutation.mutate({ id: deletingDiscount.id });
    }
  };

  const isActive = (discount: Discount) => {
    if (!discount.active) return false;
    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) return false;
    if (discount.endDate && new Date(discount.endDate) < now) return false;
    return true;
  };

  const formatFixedValue = (value: string | number, discountName?: string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    const name = discountName || "";
    let priceSymbol = symbol;
    if (name.includes("GHS")) priceSymbol = "GHS";
    const isUSD = priceSymbol === "$" || priceSymbol === "USD";
    const spacing = (!isUSD && priceSymbol) ? " " : "";
    return `${priceSymbol}${spacing}${numValue.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const onSubmitWrapper = (data: any) => onSubmit(data as DiscountFormValues);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Discounts</h1>
          <p className="text-slate-500 text-lg">Manage promotional codes and price reductions</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (open) reset();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20 h-11 px-6 rounded-xl font-bold">
                <Plus className="mr-2 h-5 w-5" />
                Create Discount
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-3xl p-0 border-none shadow-2xl overflow-hidden">
              <form onSubmit={handleSubmit(onSubmitWrapper)}>
                <div className="bg-slate-900 p-8 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-3">
                      <Sparkles className="h-6 w-6 text-violet-400" />
                      Create New Discount
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Configure a new promotional rule or code.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Name</Label>
                      <Input {...register("name")} className="h-11 rounded-xl" placeholder="Summer Sale" />
                      {errors.name && <p className="text-sm text-red-500 font-medium">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Code</Label>
                      <Input {...register("code")} className="h-11 rounded-xl uppercase font-mono" placeholder="SUMMER20" />
                      {errors.code && <p className="text-sm text-red-500 font-medium">{errors.code.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Description</Label>
                    <Input {...register("description")} className="h-11 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Type</Label>
                      <Controller
                        name="discountType"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Value</Label>
                      <div className="relative">
                        {selectedType === "fixed" ? (
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{symbol === "$" ? "GHS" : symbol}</span>
                        ) : null}
                        <Input type="number" {...register("value")} className={`h-11 rounded-xl ${selectedType === "fixed" ? "pl-12" : ""}`} />
                        {selectedType === "percentage" ? (
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                        ) : null}
                      </div>
                      {errors.value && <p className="text-sm text-red-500 font-medium">{errors.value.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Start Date</Label>
                      <Input type="date" {...register("startDate")} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">End Date</Label>
                      <Input type="date" {...register("endDate")} className="h-11 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 pt-2">
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <Switch id="active-switch" checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label htmlFor="active-switch" className="font-bold text-slate-700 cursor-pointer">Activate Discount Immediately</Label>
                  </div>
                </div>
                <DialogFooter className="p-6 bg-slate-50 border-t flex items-center justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="h-11 rounded-xl font-bold">Cancel</Button>
                  <Button type="submit" className="bg-violet-600 hover:bg-violet-700 h-11 rounded-xl font-black px-8 shadow-md shadow-violet-500/20" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Create Discount
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search by discount name or code..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 h-12 rounded-xl border-slate-200 focus-visible:ring-violet-500" 
          />
        </div>
      </div>

      {activeQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
          <p className="text-slate-500 font-medium">Fetching discounts...</p>
        </div>
      ) : activeQuery.error ? (
        <div className="text-center py-20 text-red-500">Failed to load discounts</div>
      ) : (
        <div className="space-y-6">
          {viewMode === "list" ? (
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold">Discount</TableHead>
                    <TableHead className="font-bold">Code</TableHead>
                    <TableHead className="font-bold">Value</TableHead>
                    <TableHead className="font-bold">Valid Until</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-500"><Tag className="h-12 w-12 mx-auto mb-3 text-slate-200" />No discounts found</TableCell></TableRow>
                  ) : discounts.map((discount) => (
                    <TableRow key={discount.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300">
                            <Tag className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{discount.name}</div>
                            <div className="text-xs text-slate-400 line-clamp-1">{discount.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><code className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded tracking-wider uppercase">{discount.code}</code></TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {discount.percentage ? `${discount.percentage}% OFF` : formatFixedValue(discount.fixedValue || 0, discount.name)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 font-medium">
                        {discount.endDate ? (
                          <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" />{formatDate(discount.endDate)}</div>
                        ) : "Never"}
                      </TableCell>
                      <TableCell>
                        <Badge className={isActive(discount) ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}>
                          {isActive(discount) ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600" onClick={() => openEdit(discount)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setDeletingDiscount(discount)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {discounts.map((discount) => (
                <Card key={discount.id} className="relative border-slate-200 hover:border-violet-300 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300">
                        <Tag className="h-6 w-6" />
                      </div>
                      <Badge className={isActive(discount) ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}>
                        {isActive(discount) ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1">{discount.name}</h3>
                      <code className="text-[10px] font-mono text-slate-500 tracking-wider uppercase mt-1 block">{discount.code}</code>
                    </div>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-3xl font-black text-slate-900">
                        {discount.percentage ? `${discount.percentage}%` : formatFixedValue(discount.fixedValue || 0, discount.name)}
                      </span>
                      <span className="text-slate-400 font-bold ml-1 text-sm">{discount.percentage ? "OFF" : "Discount"}</span>
                    </div>
                    {discount.endDate && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Valid until {formatDate(discount.endDate)}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                      <Button variant="outline" size="sm" onClick={() => openEdit(discount)} className="flex-1 rounded-xl font-bold h-10 border-slate-200 hover:bg-slate-50">Edit details</Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:bg-red-50 rounded-xl" onClick={() => setDeletingDiscount(discount)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
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
            itemName="discounts"
          />
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDiscount} onOpenChange={(open) => { if (!open) setEditingDiscount(null); }}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 border-none shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit(onSubmitWrapper)}>
            <div className="bg-slate-900 p-8 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  <Pencil className="h-6 w-6 text-violet-400" />
                  Edit Discount
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Modifying configuration for <span className="text-white font-bold">{editingDiscount?.name}</span>
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Name</Label>
                  <Input {...register("name")} className="h-11 rounded-xl" />
                  {errors.name && <p className="text-sm text-red-500 font-medium">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Code</Label>
                  <Input value={editingDiscount?.code || ""} disabled className="h-11 rounded-xl bg-slate-50 opacity-50 font-mono uppercase" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Description</Label>
                <Input {...register("description")} className="h-11 rounded-xl" />
              </div>
              
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <Switch id="edit-active-switch" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="edit-active-switch" className="font-bold text-slate-700 cursor-pointer">Active Status</Label>
              </div>
            </div>
            <DialogFooter className="p-6 bg-slate-50 border-t flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setEditingDiscount(null)} className="h-11 rounded-xl font-bold">Discard</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700 h-11 rounded-xl font-black px-8 shadow-md shadow-violet-500/20" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingDiscount} onOpenChange={(open) => { if (!open) setDeletingDiscount(null); }}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-red-600 flex items-center gap-2">
              <Trash2 className="h-7 w-7" />
              Delete Discount
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-lg leading-relaxed">
              Are you sure you want to delete <span className="text-slate-900 font-bold">{deletingDiscount?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeletingDiscount(null)} className="h-12 rounded-xl font-bold flex-1">Keep Discount</Button>
            <Button 
              variant="destructive" 
              className="h-12 rounded-xl font-black flex-1 shadow-md shadow-red-500/20" 
              onClick={confirmDelete} 
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
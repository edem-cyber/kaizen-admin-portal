"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useGetServicePackages,
  useGetServicePackage,
  useSearchServicePackages,
  useAddServicePackage,
  useUpdateServicePackage,
  useDeleteServicePackage,
  getGetServicePackagesQueryKey,
  getSearchServicePackagesQueryKey,
} from "@/lib/generated/billing/packages/packages";
import { useGetOffers } from "@/lib/generated/billing/offers/offers";
import { useGetDiscounts } from "@/lib/generated/billing/discounts/discounts";
import { useGetOrganizationTypesRegistry } from "@/lib/generated/org/organization-types/organization-types";
import type { DetailedServicePackageDto, CreateServicePackageDto, UpdateServicePackageDto } from "@/lib/generated/billing/models";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  Package, 
  Search, 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  MoreHorizontal,
  Zap,
  Shield,
  Layers,
  Users,
  Building2,
  Tag
} from "lucide-react";
import { ViewToggle } from "@/components/ui/view-toggle";
import { PaginationController } from "@/components/ui/pagination-controller";
import { queryClient } from "@/lib/react-query-provider";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const packageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  description: z.string().optional(),
  validity: z.string().min(1, "Validity is required"),
  validityTimeUnit: z.enum(["DAY", "MONTH", "YEAR"]),
  currencyId: z.string(),
  recurring: z.boolean(),
  offerIds: z.array(z.number()),
  orgTypeIds: z.array(z.number()),
  version: z.string().default("1.0.0"),
  type: z.enum(["SUBSCRIPTION", "ONE_TIME", "STANDARD", "CUSTOM"]).default("SUBSCRIPTION"),
  maximumTeamSize: z.string().default("10"),
  maximumServiceProvidersAllowed: z.string().default("5"),
  freeDays: z.string().default("0"),
  discountId: z.string().optional(),
});

type PackageFormValues = z.infer<typeof packageSchema>;

export default function AdminPackagesPage() {
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
  const [editingPackage, setEditingPackage] = React.useState<DetailedServicePackageDto | null>(null);
  const [deletingPackage, setDeletingPackage] = React.useState<DetailedServicePackageDto | null>(null);

  // Track original IDs for edit mode (to calculate linked/unlinked)
  const [originalOfferIds, setOriginalOfferIds] = React.useState<number[]>([]);
  const [originalOrgTypeIds, setOriginalOrgTypeIds] = React.useState<number[]>([]);

  const { data: detailedPackageResp, isLoading: isLoadingDetails } = useGetServicePackage(
    String(editingPackage?.id || ""),
    { query: { enabled: !!editingPackage?.id } }
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      validity: "1",
      validityTimeUnit: "MONTH",
      currencyId: "1",
      recurring: true,
      offerIds: [],
      orgTypeIds: [],
      version: "1.0.0",
      type: "SUBSCRIPTION",
      maximumTeamSize: "10",
      maximumServiceProvidersAllowed: "5",
      freeDays: "0",
      discountId: "none",
    },
  });

  React.useEffect(() => {
    if (editingPackage?.id && detailedPackageResp?.data) {
      const pkg = detailedPackageResp.data;
      reset({
        name: pkg.name || "",
        code: pkg.code || "",
        description: pkg.description || "",
        validity: String(pkg.validity || "1"),
        validityTimeUnit: (pkg.validityTimeUnit || "MONTH") as any,
        currencyId: String(pkg.currencyId || "1"),
        recurring: pkg.recurring ?? true,
        offerIds: pkg.offers?.map((o: any) => o.id) || [],
        orgTypeIds: pkg.orgTypes?.map((ot: any) => ot.id) || [],
        version: pkg.version || "1.0.0",
        type: (pkg.type || "SUBSCRIPTION") as any,
        maximumTeamSize: String(pkg.maximumTeamSize || "10"),
        maximumServiceProvidersAllowed: String(pkg.maximumServiceProvidersAllowed || "5"),
        freeDays: String((pkg as any).freeDays || "0"),
        discountId: pkg.discountId ? String(pkg.discountId) : "none",
      });
      setOriginalOfferIds(pkg.offers?.map((o: any) => o.id) || []);
      setOriginalOrgTypeIds(pkg.orgTypes?.map((ot: any) => ot.id) || []);
    }
  }, [detailedPackageResp?.data, editingPackage?.id, reset]);

  // Fetch related data
  const { data: offersData } = useGetOffers({ limit: 100 });
  const availableOffers = offersData?.data || [];

  const { data: orgTypesData } = useGetOrganizationTypesRegistry();
  const availableOrgTypes = orgTypesData?.data || [];

  const { data: discountsData } = useGetDiscounts({ limit: 100 });
  const availableDiscounts = discountsData?.data || [];

  // Fetch packages (Standard or Search)
  const isSearching = debouncedSearch.trim().length > 0;
  
  const stdQuery = useGetServicePackages(
    { page: currentPage, limit },
    { query: { enabled: !isSearching } }
  );
  
  const searchQuery = useSearchServicePackages(
    { q: debouncedSearch, page: currentPage, limit },
    { query: { enabled: isSearching } }
  );

  const activeQuery = isSearching ? searchQuery : stdQuery;
  const packages = Array.isArray(activeQuery.data?.data) ? (activeQuery.data.data as DetailedServicePackageDto[]) : [];
  const pagination = activeQuery.data?.pagination;

  // Mutations
  const createMutation = useAddServicePackage({
    mutation: {
      onSuccess: () => {
        toast.success("Package created successfully");
        queryClient.invalidateQueries({ queryKey: getGetServicePackagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getSearchServicePackagesQueryKey() });
        setIsCreateOpen(false);
        reset();
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to create package");
      },
    },
  });

  const updateMutation = useUpdateServicePackage({
    mutation: {
      onSuccess: () => {
        toast.success("Package updated successfully");
        queryClient.invalidateQueries({ queryKey: getGetServicePackagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getSearchServicePackagesQueryKey() });
        setEditingPackage(null);
        reset();
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to update package");
      },
    },
  });

  const deleteMutation = useDeleteServicePackage({
    mutation: {
      onSuccess: () => {
        toast.success("Package deleted successfully");
        queryClient.invalidateQueries({ queryKey: getGetServicePackagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getSearchServicePackagesQueryKey() });
        setDeletingPackage(null);
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to delete package");
      },
    },
  });

  const onSubmit = (data: PackageFormValues) => {
    if (editingPackage) {
      const linkedOfferIds = data.offerIds.filter(id => !originalOfferIds.includes(id));
      const unlinkedOfferIds = originalOfferIds.filter(id => !data.offerIds.includes(id));
      const linkedOrgTypeIds = data.orgTypeIds.filter(id => !originalOrgTypeIds.includes(id));
      const unlinkedOrgTypeIds = originalOrgTypeIds.filter(id => !data.orgTypeIds.includes(id));

      const updateData: any = {
        name: data.name,
        description: data.description,
        version: data.version,
        maximumTeamSize: Number(data.maximumTeamSize),
        maximumServiceProvidersAllowed: Number(data.maximumServiceProvidersAllowed),
        validity: Number(data.validity),
        validityTimeUnit: data.validityTimeUnit as any,
        recurring: data.recurring,
        freeDays: Number(data.freeDays),
        linkedOfferIds: linkedOfferIds.length > 0 ? linkedOfferIds : undefined,
        unlinkedOfferIds: unlinkedOfferIds.length > 0 ? unlinkedOfferIds : undefined,
        linkedOrgTypeIds: linkedOrgTypeIds.length > 0 ? linkedOrgTypeIds : undefined,
        unlinkedOrgTypeIds: unlinkedOrgTypeIds.length > 0 ? unlinkedOrgTypeIds : undefined,
        discountId: (data.discountId && data.discountId !== "none") ? Number(data.discountId) : null,
      };
      updateMutation.mutate({ id: editingPackage.id, data: updateData as UpdateServicePackageDto });
    } else {
      const createData: any = {
        name: data.name,
        code: data.code,
        description: data.description || "",
        type: data.type as any,
        version: data.version,
        currencyId: Number(data.currencyId),
        validity: Number(data.validity),
        validityTimeUnit: data.validityTimeUnit as any,
        recurring: data.recurring,
        maximumServiceProvidersAllowed: Number(data.maximumServiceProvidersAllowed),
        maximumTeamSize: Number(data.maximumTeamSize),
        offerIds: data.offerIds,
        orgTypeIds: data.orgTypeIds,
        providerId: null,
        freeDays: Number(data.freeDays),
        discountId: (data.discountId && data.discountId !== "none") ? Number(data.discountId) : undefined,
      };
      createMutation.mutate({ data: createData as CreateServicePackageDto });
    }
  };

  const openEdit = (pkg: DetailedServicePackageDto) => {
    setEditingPackage(pkg);
    setOriginalOfferIds(pkg.offers?.map(o => o.id) || []);
    setOriginalOrgTypeIds(pkg.orgTypes?.map(ot => ot.id) || []);
    reset({
      name: pkg.name,
      code: pkg.code,
      description: pkg.description || "",
      validity: String(pkg.validity || "1"),
      validityTimeUnit: (pkg.validityTimeUnit || "MONTH") as any,
      currencyId: String(pkg.currencyId || "1"),
      recurring: pkg.recurring ?? true,
      offerIds: pkg.offers?.map(o => o.id) || [],
      orgTypeIds: pkg.orgTypes?.map(ot => ot.id) || [],
      version: pkg.version || "1.0.0",
      type: (pkg.type || "SUBSCRIPTION") as any,
      maximumTeamSize: String(pkg.maximumTeamSize || "10"),
      maximumServiceProvidersAllowed: String(pkg.maximumServiceProvidersAllowed || "5"),
      freeDays: String((pkg as any).freeDays || "0"),
      discountId: pkg.discountId ? String(pkg.discountId) : "none",
    });
  };

  const confirmDelete = () => {
    if (deletingPackage) {
      deleteMutation.mutate({ id: deletingPackage.id });
    }
  };

  const onSubmitWrapper = (data: any) => onSubmit(data as PackageFormValues);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Service Packages</h1>
          <p className="text-slate-500 text-lg">Manage subscription plans and one-time packages</p>
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
                Create Package
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-3xl p-0 border-none shadow-2xl overflow-hidden">
              <form onSubmit={handleSubmit(onSubmitWrapper)}>
                <div className="p-8 border-b">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900">
                      <Layers className="h-6 w-6 text-violet-600" />
                      Create New Package
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-lg font-medium">
                      Configure a new subscription tier with full linking support.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-bold text-slate-700">Package Name</Label>
                      <Input id="name" {...register("name")} className="h-11 rounded-xl" />
                      {errors.name && <p className="text-sm text-red-500 font-medium">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code" className="font-bold text-slate-700">Internal Code</Label>
                      <Input id="code" {...register("code")} className="h-11 rounded-xl uppercase font-mono" />
                      {errors.code && <p className="text-sm text-red-500 font-medium">{errors.code.message}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-bold text-slate-700">Description</Label>
                    <Input id="description" {...register("description")} className="h-11 rounded-xl" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Package Type</Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                              <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                              <SelectItem value="ONE_TIME">One-Time</SelectItem>
                              <SelectItem value="STANDARD">Standard</SelectItem>
                              <SelectItem value="CUSTOM">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Version Tag</Label>
                      <Input {...register("version")} className="h-11 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Validity Value</Label>
                      <Input type="number" {...register("validity")} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Duration Unit</Label>
                      <Controller
                        name="validityTimeUnit"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                              <SelectItem value="MONTH">Monthly</SelectItem>
                              <SelectItem value="YEAR">Yearly</SelectItem>
                              <SelectItem value="DAY">Daily</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Max Team Size</Label>
                      <Input type="number" {...register("maximumTeamSize")} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Max Service Providers</Label>
                      <Input type="number" {...register("maximumServiceProvidersAllowed")} className="h-11 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Free Trial Days</Label>
                      <Input type="number" {...register("freeDays")} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Apply Discount</Label>
                      <Controller
                        name="discountId"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="No Discount" /></SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                              <SelectItem value="none">No Discount</SelectItem>
                              {availableDiscounts.map((d: any) => (
                                <SelectItem key={d.id} value={String(d.id)}>
                                  {d.name} ({d.percentage ? `${d.percentage}%` : `-${d.fixedValue}`})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-2 px-1">
                    <Controller
                      name="recurring"
                      control={control}
                      render={({ field }) => (
                        <Switch id="recurring" checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label htmlFor="recurring" className="font-bold text-slate-700 cursor-pointer">Automatic Recurring Billing</Label>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="font-bold text-slate-700">Organization Types</Label>
                    <Card className="border-slate-200 shadow-none overflow-hidden rounded-xl">
                      <ScrollArea className="h-[120px] p-4">
                        <div className="space-y-3">
                          <Controller
                            name="orgTypeIds"
                            control={control}
                            render={({ field }) => (
                              <>
                                {availableOrgTypes.map((ot) => (
                                  <div key={ot.id} className="flex items-center space-x-3">
                                    <Checkbox
                                      id={`orgtype-${ot.id}`}
                                      checked={field.value.includes(ot.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, ot.id])
                                          : field.onChange(field.value.filter((val) => val !== ot.id));
                                      }}
                                    />
                                    <Label htmlFor={`orgtype-${ot.id}`} className="flex-1 cursor-pointer font-medium text-sm">
                                      {ot.name} <span className="text-slate-400 font-normal">({ot.code})</span>
                                    </Label>
                                  </div>
                                ))}
                              </>
                            )}
                          />
                        </div>
                      </ScrollArea>
                    </Card>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="font-bold text-slate-700">Linked Offers</Label>
                    <Card className="border-slate-200 shadow-none overflow-hidden rounded-xl">
                      <ScrollArea className="h-[140px] p-4">
                        <div className="space-y-3">
                          <Controller
                            name="offerIds"
                            control={control}
                            render={({ field }) => (
                              <>
                                {availableOffers.map((offer) => (
                                  <div key={offer.id} className="flex items-center space-x-3">
                                    <Checkbox
                                      id={`offer-${offer.id}`}
                                      checked={field.value.includes(offer.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, offer.id])
                                          : field.onChange(field.value.filter((val) => val !== offer.id));
                                      }}
                                    />
                                    <Label htmlFor={`offer-${offer.id}`} className="flex-1 cursor-pointer font-medium text-sm">
                                      {offer.name} <span className="text-slate-400 font-normal">({offer.code})</span>
                                    </Label>
                                  </div>
                                ))}
                                {availableOffers.length === 0 && (
                                  <p className="text-sm text-slate-500 text-center py-2">No offers available. Create offers first.</p>
                                )}
                              </>
                            )}
                          />
                        </div>
                      </ScrollArea>
                    </Card>
                  </div>
                </div>
                <DialogFooter className="p-6 bg-slate-50 border-t flex items-center justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="h-11 rounded-xl font-bold">Cancel</Button>
                  <Button type="submit" className="bg-violet-600 hover:bg-violet-700 h-11 rounded-xl font-black px-8 shadow-md shadow-violet-500/20" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Create Package
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
            placeholder="Search by package name or code..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 h-12 rounded-xl border-slate-200 focus-visible:ring-violet-500" 
          />
        </div>
      </div>

      {activeQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
          <p className="text-slate-500 font-medium">Fetching packages...</p>
        </div>
      ) : activeQuery.error ? (
        <div className="text-center py-20 text-red-500 font-bold bg-red-50 rounded-3xl border border-red-100">Failed to load packages</div>
      ) : (
        <div className="space-y-6">
          {viewMode === "list" ? (
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold">Package</TableHead>
                    <TableHead className="font-bold">Code</TableHead>
                    <TableHead className="font-bold">Price Value</TableHead>
                    <TableHead className="font-bold">Duration</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-500"><Layers className="h-12 w-12 mx-auto mb-3 text-slate-200" />No packages found</TableCell></TableRow>
                  ) : packages.map((pkg) => (
                    <TableRow key={pkg.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300">
                            <Layers className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{pkg.name}</div>
                            <div className="text-xs text-slate-400 line-clamp-1">{pkg.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><code className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded tracking-wider uppercase">{pkg.code}</code></TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {symbol === "$" && pkg.name.includes("(GHS)") ? "GHS" : symbol}
                        {parseFloat(String(pkg.amount || "0")).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 font-medium">{pkg.validity} {pkg.validityTimeUnit?.toLowerCase()}s</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 border-green-200 shadow-xs">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600" onClick={() => openEdit(pkg)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setDeletingPackage(pkg)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="relative border-slate-200 hover:border-violet-300 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300">
                        <Layers className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-slate-200 font-bold">
                          {pkg.type}
                        </Badge>
                         <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">ACTIVE</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1">{pkg.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] mt-1">{pkg.description || "No description provided"}</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Price</p>
                        <p className="text-lg font-black text-slate-900">
                          {symbol === "$" && pkg.name.includes("(GHS)") ? "GHS" : symbol}
                          {parseFloat(String(pkg.amount || "0")).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Validity</p>
                        <p className="text-sm font-bold text-slate-700">{pkg.validity} {pkg.validityTimeUnit?.toLowerCase()}s</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                      <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-violet-500" /> {pkg.maximumTeamSize === -1 ? "∞" : pkg.maximumTeamSize} Users</div>
                      <div className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-violet-500" /> {pkg.offers?.length || 0} Offers</div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-50 transition-colors" onClick={() => openEdit(pkg)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => setDeletingPackage(pkg)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
            itemName="packages"
          />
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPackage} onOpenChange={(open) => { if (!open) setEditingPackage(null); }}>
        <DialogContent className="sm:max-w-xl rounded-3xl p-0 border-none shadow-2xl overflow-hidden">
          {isLoadingDetails ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
              <DialogTitle className="sr-only">Loading Package Details</DialogTitle>
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
              <p className="font-medium text-slate-500">Loading package details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmitWrapper)}>
              <div className="p-8 border-b">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900">
                    <Pencil className="h-6 w-6 text-violet-600" />
                    Configure Package
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium text-lg">
                    Editing <span className="text-slate-900 font-bold">{editingPackage?.name}</span>
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Package Name</Label>
                    <Input {...register("name")} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Internal Code</Label>
                    <Input {...register("code")} disabled className="h-11 rounded-xl bg-slate-100 font-mono" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Description</Label>
                  <Input {...register("description")} className="h-11 rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Validity Value</Label>
                    <Input type="number" {...register("validity")} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Duration Unit</Label>
                    <Controller
                      name="validityTimeUnit"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl">
                            <SelectItem value="MONTH">Monthly</SelectItem>
                            <SelectItem value="YEAR">Yearly</SelectItem>
                            <SelectItem value="DAY">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Max Team Size</Label>
                    <Input type="number" {...register("maximumTeamSize")} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Max Service Providers</Label>
                    <Input type="number" {...register("maximumServiceProvidersAllowed")} className="h-11 rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Free Trial Days</Label>
                    <Input type="number" {...register("freeDays")} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Apply Discount</Label>
                    <Controller
                      name="discountId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="No Discount" /></SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl">
                            <SelectItem value="none">No Discount</SelectItem>
                            {availableDiscounts.map((d: any) => (
                              <SelectItem key={d.id} value={String(d.id)}>
                                {d.name} ({d.percentage ? `${d.percentage}%` : `-${d.fixedValue}`})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="font-bold text-slate-700">Organization Types</Label>
                  <Card className="border-slate-200 shadow-none overflow-hidden rounded-xl">
                    <ScrollArea className="h-[120px] p-4">
                      <div className="space-y-3">
                        <Controller
                          name="orgTypeIds"
                          control={control}
                          render={({ field }) => (
                            <>
                              {availableOrgTypes.map((ot) => (
                                <div key={ot.id} className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`edit-orgtype-${ot.id}`}
                                    checked={field.value.includes(ot.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, ot.id])
                                        : field.onChange(field.value.filter((val) => val !== ot.id));
                                    }}
                                  />
                                  <Label htmlFor={`edit-orgtype-${ot.id}`} className="flex-1 cursor-pointer font-medium text-sm">
                                    {ot.name} <span className="text-slate-400 font-normal">({ot.code})</span>
                                  </Label>
                                </div>
                              ))}
                            </>
                          )}
                        />
                      </div>
                    </ScrollArea>
                  </Card>
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="font-bold text-slate-700">Linked Offers</Label>
                  <Card className="border-slate-200 shadow-none overflow-hidden rounded-xl">
                    <ScrollArea className="h-[140px] p-4">
                      <div className="space-y-3">
                        <Controller
                          name="offerIds"
                          control={control}
                          render={({ field }) => (
                            <>
                              {availableOffers.map((offer) => (
                                <div key={offer.id} className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`edit-offer-${offer.id}`}
                                    checked={field.value.includes(offer.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, offer.id])
                                        : field.onChange(field.value.filter((val) => val !== offer.id));
                                    }}
                                  />
                                  <Label htmlFor={`edit-offer-${offer.id}`} className="flex-1 cursor-pointer font-medium text-sm">
                                    {offer.name} <span className="text-slate-400 font-normal">({offer.code})</span>
                                  </Label>
                                </div>
                              ))}
                            </>
                          )}
                        />
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              </div>

              <DialogFooter className="p-6 bg-slate-50 border-t flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setEditingPackage(null)} className="h-11 rounded-xl font-bold">Cancel</Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700 h-11 rounded-xl font-black px-8 shadow-md shadow-violet-500/20" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPackage} onOpenChange={(open) => { if (!open) setDeletingPackage(null); }}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-red-600 flex items-center gap-2">
              <Trash2 className="h-7 w-7" />
              Delete Package
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-lg leading-relaxed">
              Are you sure you want to delete <span className="text-slate-900 font-bold">{deletingPackage?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeletingPackage(null)} className="h-12 rounded-xl font-bold flex-1">Keep Package</Button>
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
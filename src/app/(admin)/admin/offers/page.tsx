"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useGetOffers,
  useGetOffer,
  useSearchOffers,
  useAddOffer,
  useUpdateOffer,
  useDeleteOffer,
  getGetOffersQueryKey,
  getSearchOffersQueryKey,
} from "@/lib/generated/billing/offers/offers";
import { useGetServicePackages } from "@/lib/generated/billing/packages/packages";
import { useGetProductCategories } from "@/lib/generated/billing/product-categories/product-categories";
import { useGetServiceCategories } from "@/lib/generated/billing/service-categories/service-categories";
import { useGetServiceSubcategories } from "@/lib/generated/billing/service-subcategories/service-subcategories";
import type { OfferDto, CreateOfferDto, UpdateOfferDto } from "@/lib/generated/billing/models";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tags, 
  Search, 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Users,
  Gift,
  Package,
  CheckCircle2,
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

const offerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").regex(/^[a-zA-Z0-9]+$/, "Code must only contain alphanumeric characters"),
  description: z.string().min(1, "Description is required"),
  unitPrice: z.string().min(1, "Price is required"),
  currencyId: z.string(),
  maximumCheckIns: z.string(),
  serviceSubcategoryId: z.string().min(1, "Service subcategory is required"),
  productCategoryId: z.string().min(1, "Product category is required"),
  packageIds: z.array(z.string()),
});

type OfferFormValues = z.infer<typeof offerSchema>;

export default function AdminOffersPage() {
  const { symbol } = useCurrency();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = React.useState(1);
  const limit = 20;

  const [originalPackageIds, setOriginalPackageIds] = React.useState<string[]>([]);

  const [showPriceCalculator, setShowPriceCalculator] = React.useState(false);
  const [desiredTotalPrice, setDesiredTotalPrice] = React.useState("");
  const [numberOfUsers, setNumberOfUsers] = React.useState("1");

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingOffer, setEditingOffer] = React.useState<OfferDto | null>(null);
  const [deletingOffer, setDeletingOffer] = React.useState<OfferDto | null>(null);

  const { data: detailedOfferResp, isLoading: isLoadingDetails } = useGetOffer(
    Number(editingOffer?.id || 0),
    { query: { enabled: !!editingOffer?.id } }
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      unitPrice: "",
      currencyId: "",
      maximumCheckIns: "-1",
      serviceSubcategoryId: "",
      productCategoryId: "",
      packageIds: [],
    },
  });

  const { availableCurrencies } = useCurrency();

  const watchedCategoryId = watch("productCategoryId");

  React.useEffect(() => {
    const catId = parseInt(watchedCategoryId);
    if (!isNaN(catId)) {
      setSelectedCategoryId(catId);
    }
  }, [watchedCategoryId]);

  const calculateUnitPrice = () => {
    const total = parseFloat(desiredTotalPrice);
    const users = parseInt(numberOfUsers);
    if (total > 0 && users > 0) {
      const unitPrice = total / users;
      setValue("unitPrice", unitPrice.toFixed(2));
      toast.success(`Unit price calculated: ${unitPrice.toFixed(2)} per user`);
    }
  };

  React.useEffect(() => {
    if (editingOffer?.id && detailedOfferResp?.data) {
      const offer = detailedOfferResp.data;
      const pkgIds = offer.packages?.map((pkg) => String(pkg.id)) || [];
      reset({
        name: offer.name || "",
        code: offer.code || "",
        description: offer.description || "",
        unitPrice: String(offer.unitPrice || ""),
        currencyId: String(offer.currencyId || "1"),
        maximumCheckIns: String(offer.maximumCheckIns || "-1"),
        serviceSubcategoryId: String(offer.serviceSubcategoryId || ""),
        productCategoryId: String(offer.productCategoryId || ""),
        packageIds: pkgIds,
      });
      setOriginalPackageIds(pkgIds);
      setSelectedCategoryId(offer.productCategoryId);
    }
  }, [detailedOfferResp?.data, editingOffer?.id, reset]);

  const { data: packagesData } = useGetServicePackages({ page: 1, limit: 100 });
  const availablePackages = packagesData?.data || [];

  const { data: categoriesData } = useGetProductCategories({ limit: 100 });
  const productCategories = (categoriesData?.data as any[]) || [];

  const { data: serviceCatsData } = useGetServiceCategories({ limit: 100 });
  const serviceCategories = (serviceCatsData?.data as any[]) || [];

  const { data: serviceSubsData } = useGetServiceSubcategories(
    selectedCategoryId || 0,
    { limit: 100 },
    { query: { enabled: !!selectedCategoryId } }
  );
  const serviceSubcategories = (serviceSubsData?.data as any[]) || [];

  const isSearching = debouncedSearch.trim().length > 0;
  
  const stdQuery = useGetOffers(
    { page: currentPage, limit },
    { query: { enabled: !isSearching } }
  );
  
  const searchQuery = useSearchOffers(
    { q: debouncedSearch, page: currentPage, limit },
    { query: { enabled: isSearching } }
  );

  const activeQuery = isSearching ? searchQuery : stdQuery;
  const offers = Array.isArray(activeQuery.data?.data) ? (activeQuery.data.data as OfferDto[]) : [];
  const pagination = activeQuery.data?.pagination;

  const createMutation = useAddOffer({
    mutation: {
      onSuccess: () => {
        toast.success("Offer created successfully");
        queryClient.invalidateQueries({ queryKey: getGetOffersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getSearchOffersQueryKey() });
        setIsCreateOpen(false);
        reset();
        setSelectedCategoryId(undefined);
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to create offer");
      },
    },
  });

  const updateMutation = useUpdateOffer({
    mutation: {
      onSuccess: () => {
        toast.success("Offer updated successfully");
        queryClient.invalidateQueries({ queryKey: getGetOffersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getSearchOffersQueryKey() });
        setEditingOffer(null);
        reset();
        setSelectedCategoryId(undefined);
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to update offer");
      },
    },
  });

  const deleteMutation = useDeleteOffer({
    mutation: {
      onSuccess: () => {
        toast.success("Offer deleted successfully");
        queryClient.invalidateQueries({ queryKey: getGetOffersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getSearchOffersQueryKey() });
        setDeletingOffer(null);
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to delete offer");
      },
    },
  });

  const onSubmit = (data: OfferFormValues) => {
    const selectedCurrency = availableCurrencies.find(c => c.code === data.currencyId || String(c.id) === data.currencyId);
    const currencyCode = selectedCurrency?.code || "GHS";
    const currencyId = selectedCurrency?.id || Number(data.currencyId) || 1;

    if (editingOffer) {
      const linkedPackageIds = data.packageIds.filter(id => !originalPackageIds.includes(id));
      const unlinkedPackageIds = originalPackageIds.filter(id => !data.packageIds.includes(id));

      const updateData: UpdateOfferDto = {
        name: data.name,
        code: data.code,
        description: data.description,
        maximumCheckIns: Number(data.maximumCheckIns),
        unitPrice: data.unitPrice,
        currencyId: currencyId,
        serviceSubcategoryId: Number(data.serviceSubcategoryId),
        productCategoryId: Number(data.productCategoryId),
        linkedPackageIds: linkedPackageIds.length > 0 ? linkedPackageIds : undefined,
        unlinkedPackageIds: unlinkedPackageIds.length > 0 ? unlinkedPackageIds : undefined,
      };
      updateMutation.mutate({ id: editingOffer.id, data: updateData });
    } else {
      const createData: CreateOfferDto = {
        name: data.name,
        code: data.code,
        description: data.description,
        unitPrice: data.unitPrice,
        currencyId: currencyId,
        currencyCode: currencyCode,
        serviceSubcategoryId: Number(data.serviceSubcategoryId),
        productCategoryId: Number(data.productCategoryId),
        maximumCheckIns: Number(data.maximumCheckIns),
        packageIds: data.packageIds.length > 0 ? data.packageIds : undefined,
      };
      createMutation.mutate({ data: createData });
    }
  };

  const openEdit = (offer: OfferDto) => {
    setEditingOffer(offer);
  };

  const confirmDelete = () => {
    if (deletingOffer) {
      deleteMutation.mutate({ id: deletingOffer.id });
    }
  };

  const onSubmitWrapper = (data: any) => onSubmit(data as OfferFormValues);

  const ProductCategorySelect = ({ control, errors }: { control: any; errors: any; }) => (
    <div className="space-y-2">
      <Label className="font-bold text-slate-700">Product Category</Label>
      <Controller
        name="productCategoryId"
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={(v) => { field.onChange(v); if (!editingOffer) setValue("serviceSubcategoryId", ""); }}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              {productCategories.map((cat: any) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name} ({cat.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors.productCategoryId && <p className="text-sm text-red-500 font-medium">{errors.productCategoryId.message}</p>}
    </div>
  );

  const ServiceSubcategorySelect = ({ control, errors }: { control: any; errors: any; }) => (
    <div className="space-y-2">
      <Label className="font-bold text-slate-700">Service Subcategory</Label>
      <Controller
        name="serviceSubcategoryId"
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange} disabled={!watchedCategoryId}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder={watchedCategoryId ? "Select subcategory" : "Select category first"} /></SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              {serviceSubcategories.map((sub: any) => (
                <SelectItem key={sub.id} value={String(sub.id)}>{sub.name} ({sub.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors.serviceSubcategoryId && <p className="text-sm text-red-500 font-medium">{errors.serviceSubcategoryId.message}</p>}
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-violet-600 font-bold text-sm uppercase tracking-wider">
            <Tag className="h-4 w-4" />
            Product Management
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Offers</h1>
          <p className="text-slate-500 text-lg">Create and manage your service offerings and pricing models.</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (open) reset();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-xl shadow-violet-500/25 h-12 px-8 rounded-2xl font-black text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="mr-2 h-5 w-5 stroke-[3px]" />
                Create Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Tag className="h-32 w-32 rotate-12" />
                  </div>
                  <DialogHeader className="relative z-10">
                    <DialogTitle className="text-3xl font-black flex items-center gap-3">
                      <Gift className="h-8 w-8 text-violet-400" />
                      Create New Offer
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-lg">
                      Define a new product or service offering for your clients.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-bold text-slate-700">Offer Name</Label>
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
                      <Label className="font-bold text-slate-700">Unit Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{symbol === "$" ? "GHS" : symbol}</span>
                        <Input type="number" {...register("unitPrice")} className="h-11 pl-12 rounded-xl" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-violet-600 hover:text-violet-700 font-bold"
                        onClick={() => setShowPriceCalculator(!showPriceCalculator)}
                      >
                        <Users className="mr-1 h-3 w-3" />
                        {showPriceCalculator ? "Hide" : "Calculate from total price"}
                      </Button>
                      {showPriceCalculator && (
                        <div className="mt-2 p-4 bg-violet-50 rounded-2xl border border-violet-100 space-y-3 shadow-sm">
                          <p className="text-[10px] text-violet-700 font-black uppercase tracking-wider">Price Distribution Calculator</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-600">Total Price</Label>
                              <Input type="number" value={desiredTotalPrice} onChange={(e) => setDesiredTotalPrice(e.target.value)} className="h-9 rounded-lg" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-600">Users</Label>
                              <Input type="number" value={numberOfUsers} onChange={(e) => setNumberOfUsers(e.target.value)} className="h-9 rounded-lg" />
                            </div>
                          </div>
                          <Button type="button" size="sm" onClick={calculateUnitPrice} className="w-full rounded-lg bg-violet-600 font-bold">Apply Result</Button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Max Check-ins</Label>
                      <Input type="number" {...register("maximumCheckIns")} className="h-11 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Currency</Label>
                      <Controller
                        name="currencyId"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select currency" /></SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                              {availableCurrencies.map((c) => (
                                <SelectItem key={c.code} value={String(c.id || c.code)}>{c.code} ({c.symbol})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.currencyId && <p className="text-sm text-red-500 font-medium">{errors.currencyId.message}</p>}
                    </div>
                    <ProductCategorySelect control={control} errors={errors} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <ServiceSubcategorySelect control={control} errors={errors} />
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="font-bold text-slate-700">Link to Packages</Label>
                    <Card className="border-slate-200 shadow-none overflow-hidden rounded-xl">
                      <ScrollArea className="h-[140px] p-4">
                        <div className="space-y-3">
                          <Controller
                            name="packageIds"
                            control={control}
                            render={({ field }) => (
                              <>
                                {availablePackages.map((pkg) => (
                                  <div key={pkg.id} className="flex items-center space-x-3">
                                    <Checkbox
                                      id={`pkg-${pkg.id}`}
                                      checked={field.value.includes(pkg.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, pkg.id])
                                          : field.onChange(field.value.filter((val) => val !== pkg.id));
                                      }}
                                    />
                                    <Label htmlFor={`pkg-${pkg.id}`} className="flex-1 cursor-pointer font-medium text-sm">
                                      {pkg.name} <span className="text-slate-400 font-normal">({pkg.code})</span>
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
                  <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="h-11 rounded-xl font-bold">Cancel</Button>
                  <Button type="submit" className="bg-violet-600 hover:bg-violet-700 h-11 rounded-xl font-black px-8 shadow-md shadow-violet-500/20" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Create Offer
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
            placeholder="Search by offer name or code..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 h-12 rounded-xl border-slate-200 focus-visible:ring-violet-500" 
          />
        </div>
      </div>

      {activeQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
          <p className="text-slate-500 font-medium">Fetching offers...</p>
        </div>
      ) : activeQuery.error ? (
        <div className="text-center py-20 text-red-500 font-bold bg-red-50 rounded-3xl border border-red-100">Failed to load offers</div>
      ) : (
        <div className="space-y-6">
          {viewMode === "list" ? (
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold">Offer Name</TableHead>
                    <TableHead className="font-bold">Code</TableHead>
                    <TableHead className="font-bold">Price</TableHead>
                    <TableHead className="font-bold">Category</TableHead>
                    <TableHead className="font-bold hidden lg:table-cell">Subcategory</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-500"><Tags className="h-12 w-12 mx-auto mb-3 text-slate-200" />No offers found</TableCell></TableRow>
                  ) : offers.map((offer) => (
                    <TableRow key={offer.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300">
                            <Gift className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{offer.name}</div>
                            <div className="text-xs text-slate-400 line-clamp-1">{offer.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><code className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded tracking-wider uppercase">{offer.code}</code></TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {symbol === "$" && offer.name.includes("(GHS)") ? "GHS" : symbol}
                        {parseFloat(String(offer.unitPrice || "0")).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {offer.productCategory?.name || offer.productCategoryId || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 hidden lg:table-cell">
                        {offer.serviceSubcategory?.name || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600" onClick={() => openEdit(offer)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setDeletingOffer(offer)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {offers.map((offer) => (
                <Card key={offer.id} className="relative border-slate-200 hover:border-violet-300 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                        <Gift className="h-6 w-6" />
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200 font-black text-[10px]">ACTIVE</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">{offer.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] mt-1">{offer.description || "No description provided"}</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Unit Price</p>
                        <p className="text-lg font-black text-slate-900">
                          {symbol === "$" && offer.name.includes("(GHS)") ? "GHS" : symbol}
                          {parseFloat(String(offer.unitPrice || "0")).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</p>
                        <p className="text-sm font-bold text-slate-700">{offer.productCategory?.name || "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                      <div className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-orange-500" /> {offer.type}</div>
                      <div className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5 text-orange-500" /> {offer.packages?.length || 0} Packages</div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-50 transition-colors" onClick={() => openEdit(offer)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => setDeletingOffer(offer)}>
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
            itemName="offers"
          />
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingOffer} onOpenChange={(open) => { if (!open) setEditingOffer(null); }}>
        <DialogContent className="sm:max-w-xl rounded-3xl p-0 border-none shadow-2xl overflow-hidden">
          {isLoadingDetails ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
              <DialogTitle className="sr-only">Loading Offer Details</DialogTitle>
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
              <p className="font-medium text-slate-500">Loading offer details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmitWrapper)}>
              <div className="p-8 border-b">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900">
                    <Pencil className="h-6 w-6 text-violet-600" />
                    Configure Offer
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium text-lg">
                    Editing <span className="text-slate-900 font-bold">{editingOffer?.name}</span>
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Offer Name</Label>
                    <Input {...register("name")} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Internal Code</Label>
                    <Input 
                      {...register("code")} 
                      placeholder="OFF-001" 
                      className="h-11 rounded-xl bg-slate-50 font-mono uppercase" 
                      onChange={(e) => {
                        e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        register("code").onChange(e);
                      }}
                    />
                    {errors.code && <p className="text-xs text-red-500 font-medium">{errors.code.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Description</Label>
                  <Input {...register("description")} className="h-11 rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Unit Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{symbol === "$" ? "GHS" : symbol}</span>
                      <Input type="number" {...register("unitPrice")} className="h-11 pl-12 rounded-xl" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-violet-600 hover:text-violet-700 font-bold"
                      onClick={() => setShowPriceCalculator(!showPriceCalculator)}
                    >
                      <Users className="mr-1 h-3 w-3" />
                      {showPriceCalculator ? "Hide" : "Calculate from total price"}
                    </Button>
                    {showPriceCalculator && (
                      <div className="mt-2 p-4 bg-violet-50 rounded-2xl border border-violet-100 space-y-3 shadow-sm">
                        <p className="text-[10px] text-violet-700 font-black uppercase tracking-wider">Price Distribution Calculator</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-600">Total Price</Label>
                            <Input type="number" value={desiredTotalPrice} onChange={(e) => setDesiredTotalPrice(e.target.value)} className="h-9 rounded-lg" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-600">Users</Label>
                            <Input type="number" value={numberOfUsers} onChange={(e) => setNumberOfUsers(e.target.value)} className="h-9 rounded-lg" />
                          </div>
                        </div>
                        <Button type="button" size="sm" onClick={calculateUnitPrice} className="w-full rounded-lg bg-violet-600 font-bold">Apply Result</Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Max Check-ins</Label>
                    <Input type="number" {...register("maximumCheckIns")} className="h-11 rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Currency</Label>
                    <Controller
                      name="currencyId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select currency" /></SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl">
                            {availableCurrencies.map((c) => (
                              <SelectItem key={c.code} value={String(c.id || c.code)}>{c.code} ({c.symbol})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.currencyId && <p className="text-sm text-red-500 font-medium">{errors.currencyId.message}</p>}
                  </div>
                  <ProductCategorySelect control={control} errors={errors} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ServiceSubcategorySelect control={control} errors={errors} />
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="font-bold text-slate-700">Linked Packages</Label>
                  <Card className="border-slate-200 shadow-none overflow-hidden rounded-xl">
                    <ScrollArea className="h-[140px] p-4">
                      <div className="space-y-3">
                        <Controller
                          name="packageIds"
                          control={control}
                          render={({ field }) => (
                            <>
                              {availablePackages.map((pkg) => (
                                <div key={pkg.id} className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`edit-pkg-${pkg.id}`}
                                    checked={field.value.includes(pkg.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, pkg.id])
                                        : field.onChange(field.value.filter((val) => val !== pkg.id));
                                    }}
                                  />
                                  <Label htmlFor={`edit-pkg-${pkg.id}`} className="flex-1 cursor-pointer font-medium text-sm">
                                    {pkg.name} <span className="text-slate-400 font-normal">({pkg.code})</span>
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
                <Button type="button" variant="ghost" onClick={() => setEditingOffer(null)} className="h-11 rounded-xl font-bold">Cancel</Button>
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
      <Dialog open={!!deletingOffer} onOpenChange={(open) => { if (!open) setDeletingOffer(null); }}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-red-600 flex items-center gap-2">
              <Trash2 className="h-7 w-7" />
              Delete Offer
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-lg leading-relaxed">
              Are you sure you want to delete <span className="text-slate-900 font-bold">{deletingOffer?.name}</span>? This action cannot be undone and may affect linked packages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeletingOffer(null)} className="h-12 rounded-xl font-bold flex-1">Keep Offer</Button>
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

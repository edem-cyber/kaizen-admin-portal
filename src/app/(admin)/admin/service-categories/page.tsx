"use client";

import * as React from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  FolderOpen, 
  Folder, 
  Tag, 
  MoreVertical,
  Search,
  Loader2,
  Layers,
  LayoutGrid,
  List as ListIcon,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/react-query-provider";

// Billing Hooks
import { 
  useGetServiceCategories, 
  useAddServiceCategory, 
  useUpdateServiceCategory, 
  useDeleteServiceCategory,
  getGetServiceCategoriesQueryKey
} from "@/lib/generated/billing/service-categories/service-categories";
import { 
  useGetServiceSubcategories, 
  useAddServiceSubcategory, 
  useUpdateServiceSubcategory, 
  useDeleteServiceSubcategory,
  getGetServiceSubcategoriesQueryKey
} from "@/lib/generated/billing/service-subcategories/service-subcategories";

// Models
import type { ServiceCategoryDto, CreateServiceCategoryDto, UpdateServiceCategoryDto } from "@/lib/generated/billing/models";
import type { ServiceSubcategoryDto, CreateServiceSubcategoryDto, UpdateServiceSubcategoryDto } from "@/lib/generated/billing/models";

export default function AdminServiceCategoriesPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
  const [expandedCategories, setExpandedCategories] = React.useState<Set<number>>(new Set());

  // Dialog states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  // Selection states
  const [editingCategory, setEditingCategory] = React.useState<ServiceCategoryDto | null>(null);
  const [editingSubcategory, setEditingSubcategory] = React.useState<ServiceSubcategoryDto | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<{ id: number; type: "category" | "subcategory"; categoryId?: number } | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = React.useState<CreateServiceCategoryDto>({
    name: "",
    code: "",
    type: "END_USER" as any,
  });

  const [subcategoryForm, setSubcategoryForm] = React.useState<CreateServiceSubcategoryDto>({
    name: "",
    code: "",
  });

  // Queries
  const { data: categoriesData, isLoading: isLoadingCategories, refetch: refetchCategories } = useGetServiceCategories({
    limit: 100, // Get all for now
  });

  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];
  const filteredCategories = categories.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutations
  const addCategoryMutation = useAddServiceCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Service category created successfully");
        queryClient.invalidateQueries({ queryKey: getGetServiceCategoriesQueryKey() });
        setIsCategoryDialogOpen(false);
        resetCategoryForm();
      },
      onError: (error: any) => toast.error(error?.message || "Failed to create category")
    }
  });

  const updateCategoryMutation = useUpdateServiceCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Service category updated successfully");
        queryClient.invalidateQueries({ queryKey: getGetServiceCategoriesQueryKey() });
        setIsCategoryDialogOpen(false);
        resetCategoryForm();
      },
      onError: (error: any) => toast.error(error?.message || "Failed to update category")
    }
  });

  const deleteCategoryMutation = useDeleteServiceCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Service category deleted successfully");
        queryClient.invalidateQueries({ queryKey: getGetServiceCategoriesQueryKey() });
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
      },
      onError: (error: any) => toast.error(error?.message || "Failed to delete category")
    }
  });

  const addSubcategoryMutation = useAddServiceSubcategory({
    mutation: {
      onSuccess: () => {
        toast.success("Subcategory created successfully");
        if (selectedCategoryId) {
          queryClient.invalidateQueries({ queryKey: getGetServiceSubcategoriesQueryKey(selectedCategoryId) });
        }
        setIsSubcategoryDialogOpen(false);
        resetSubcategoryForm();
      },
      onError: (error: any) => toast.error(error?.message || "Failed to create subcategory")
    }
  });

  const updateSubcategoryMutation = useUpdateServiceSubcategory({
    mutation: {
      onSuccess: () => {
        toast.success("Subcategory updated successfully");
        if (selectedCategoryId) {
          queryClient.invalidateQueries({ queryKey: getGetServiceSubcategoriesQueryKey(selectedCategoryId) });
        }
        setIsSubcategoryDialogOpen(false);
        resetSubcategoryForm();
      },
      onError: (error: any) => toast.error(error?.message || "Failed to update subcategory")
    }
  });

  const deleteSubcategoryMutation = useDeleteServiceSubcategory({
    mutation: {
      onSuccess: () => {
        toast.success("Subcategory deleted successfully");
        if (itemToDelete?.categoryId) {
          queryClient.invalidateQueries({ queryKey: getGetServiceSubcategoriesQueryKey(itemToDelete.categoryId) });
        }
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
      },
      onError: (error: any) => toast.error(error?.message || "Failed to delete subcategory")
    }
  });

  // Handlers
  const toggleCategory = (id: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", code: "", type: "END_USER" as any });
    setEditingCategory(null);
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({ name: "", code: "" });
    setEditingSubcategory(null);
    setSelectedCategoryId(null);
  };

  const handleCategorySubmit = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ 
        id: editingCategory.id!, 
        data: categoryForm as UpdateServiceCategoryDto 
      });
    } else {
      addCategoryMutation.mutate({ data: categoryForm });
    }
  };

  const handleSubcategorySubmit = () => {
    if (!selectedCategoryId) return;
    
    if (editingSubcategory) {
      updateSubcategoryMutation.mutate({ 
        categoryId: selectedCategoryId,
        id: editingSubcategory.id!, 
        data: subcategoryForm as UpdateServiceSubcategoryDto 
      });
    } else {
      addSubcategoryMutation.mutate({ 
        categoryId: selectedCategoryId,
        data: subcategoryForm 
      });
    }
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === "category") {
      deleteCategoryMutation.mutate({ id: itemToDelete.id });
    } else if (itemToDelete.type === "subcategory" && itemToDelete.categoryId) {
      deleteSubcategoryMutation.mutate({ 
        categoryId: itemToDelete.categoryId, 
        id: itemToDelete.id 
      });
    }
  };

  const openEditCategory = (category: ServiceCategoryDto) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || "",
      code: category.code || "",
      type: category.type as any || "END_USER",
    });
    setIsCategoryDialogOpen(true);
  };

  const openAddSubcategory = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    resetSubcategoryForm();
    setSelectedCategoryId(categoryId); // Set again after reset
    setIsSubcategoryDialogOpen(true);
  };

  const openEditSubcategory = (categoryId: number, sub: ServiceSubcategoryDto) => {
    setSelectedCategoryId(categoryId);
    setEditingSubcategory(sub);
    setSubcategoryForm({
      name: sub.name || "",
      code: sub.code || "",
    });
    setIsSubcategoryDialogOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Service Categories</h1>
          <p className="text-slate-500 text-lg font-medium">Define and organize the taxonomy of platform services</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-xl h-11 w-11 border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-200 transition-all"
            onClick={() => refetchCategories()}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button 
            className="bg-violet-600 hover:bg-violet-700 shadow-xl shadow-violet-500/20 h-11 px-6 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => { resetCategoryForm(); setIsCategoryDialogOpen(true); }}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats/Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-violet-500 to-indigo-600 border-none shadow-2xl shadow-violet-500/10 rounded-[2rem] text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 font-bold uppercase tracking-wider text-xs mb-1">Total Categories</p>
                <h3 className="text-4xl font-black">{categories.length}</h3>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Folder className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-100 shadow-sm rounded-[2rem]">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">End User Types</p>
                <h3 className="text-4xl font-black text-slate-900">{categories.filter(c => c.type === 'END_USER').length}</h3>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Layers className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-100 shadow-sm rounded-[2rem]">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Host Types</p>
                <h3 className="text-4xl font-black text-slate-900">{categories.filter(c => c.type === 'HOST').length}</h3>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Tag className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white/50 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search categories by name or code..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-11 h-12 bg-white rounded-xl border-slate-100 focus-visible:ring-violet-500" 
          />
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <Button 
            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
            size="sm" 
            className={cn("h-10 px-4 rounded-lg font-bold", viewMode === 'list' && "bg-white shadow-sm")}
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="h-4 w-4 mr-2" /> List
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
            size="sm" 
            className={cn("h-10 px-4 rounded-lg font-bold", viewMode === 'grid' && "bg-white shadow-sm")}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" /> Grid
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoadingCategories ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
          <p className="text-slate-500 font-bold tracking-tight">Syncing Service Registry...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-24 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem]">
          <FolderOpen className="h-20 w-20 mx-auto mb-6 text-slate-200" />
          <h3 className="text-2xl font-black text-slate-900">No categories found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">Try adjusting your search or add a new category to get started.</p>
          <Button 
            variant="outline" 
            className="mt-8 rounded-xl h-12 px-8 border-slate-200 font-bold"
            onClick={() => { setSearchTerm(""); resetCategoryForm(); setIsCategoryDialogOpen(true); }}
          >
            Create New Category
          </Button>
        </div>
      ) : (
        <div className={cn(
          "gap-6",
          viewMode === 'list' ? "flex flex-col" : "grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3"
        )}>
          {filteredCategories.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={category} 
              isExpanded={expandedCategories.has(category.id!)}
              onToggle={() => toggleCategory(category.id!)}
              onEdit={() => openEditCategory(category)}
              onDelete={() => {
                setItemToDelete({ id: category.id!, type: "category" });
                setIsDeleteDialogOpen(true);
              }}
              onAddSub={() => openAddSubcategory(category.id!)}
              onEditSub={(sub) => openEditSubcategory(category.id!, sub)}
              onDeleteSub={(subId) => {
                setItemToDelete({ id: subId, type: "subcategory", categoryId: category.id });
                setIsDeleteDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-violet-600 p-10 text-white">
            <DialogTitle className="text-3xl font-black tracking-tight">
              {editingCategory ? "Update Category" : "New Category"}
            </DialogTitle>
            <DialogDescription className="text-violet-100 font-medium mt-2">
              {editingCategory ? "Refine the details of this service category." : "Add a new classification level to the platform taxonomy."}
            </DialogDescription>
          </div>
          <div className="p-10 space-y-6">
            <div className="space-y-2.5">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Display Name</label>
              <Input 
                placeholder="e.g. Workspace Services" 
                value={categoryForm.name} 
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="h-14 rounded-xl border-slate-200 focus-visible:ring-violet-500 font-medium"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Internal Code</label>
              <Input 
                placeholder="e.g. WRK-SPC" 
                value={categoryForm.code} 
                onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                className="h-14 rounded-xl border-slate-200 focus-visible:ring-violet-500 font-mono"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Category Type</label>
              <Select 
                value={categoryForm.type as any} 
                onValueChange={(v) => setCategoryForm({ ...categoryForm, type: v as any })}
              >
                <SelectTrigger className="h-14 rounded-xl border-slate-200">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="END_USER">End User (B2C/B2B)</SelectItem>
                  <SelectItem value="HOST">Host (Partners)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-10 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold bg-slate-50" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
            <Button 
              className="flex-1 h-12 rounded-xl font-black bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
              onClick={handleCategorySubmit}
              disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
            >
              {(addCategoryMutation.isPending || updateCategoryMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-emerald-600 p-10 text-white">
            <DialogTitle className="text-3xl font-black tracking-tight">
              {editingSubcategory ? "Update Subcategory" : "Add Subcategory"}
            </DialogTitle>
            <DialogDescription className="text-emerald-100 font-medium mt-2">
              Defining granular service types for the parent category.
            </DialogDescription>
          </div>
          <div className="p-10 space-y-6">
            <div className="space-y-2.5">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Subcategory Name</label>
              <Input 
                placeholder="e.g. Dedicated Desk" 
                value={subcategoryForm.name} 
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                className="h-14 rounded-xl border-slate-200 focus-visible:ring-emerald-500 font-medium"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Subcategory Code</label>
              <Input 
                placeholder="e.g. DESK-DED" 
                value={subcategoryForm.code} 
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, code: e.target.value })}
                className="h-14 rounded-xl border-slate-200 focus-visible:ring-emerald-500 font-mono"
              />
            </div>
          </div>
          <DialogFooter className="p-10 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold bg-slate-50" onClick={() => setIsSubcategoryDialogOpen(false)}>Cancel</Button>
            <Button 
              className="flex-1 h-12 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
              onClick={handleSubcategorySubmit}
              disabled={addSubcategoryMutation.isPending || updateSubcategoryMutation.isPending}
            >
              {(addSubcategoryMutation.isPending || updateSubcategoryMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSubcategory ? "Save Changes" : "Add Subcategory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-10 border-none shadow-2xl bg-white">
          <DialogHeader>
            <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-lg leading-relaxed mt-2">
              Are you sure you want to remove this {itemToDelete?.type}? This action is permanent and may affect linked services and offers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-10">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold bg-slate-50" onClick={() => setIsDeleteDialogOpen(false)}>Keep it</Button>
            <Button 
              variant="destructive" 
              className="flex-1 h-12 rounded-xl font-black shadow-lg shadow-red-500/20"
              onClick={confirmDelete}
              disabled={deleteCategoryMutation.isPending || deleteSubcategoryMutation.isPending}
            >
              {(deleteCategoryMutation.isPending || deleteSubcategoryMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryCard({ 
  category, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onAddSub, 
  onEditSub, 
  onDeleteSub 
}: { 
  category: ServiceCategoryDto; 
  isExpanded: boolean; 
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSub: () => void;
  onEditSub: (sub: ServiceSubcategoryDto) => void;
  onDeleteSub: (id: number) => void;
}) {
  const { data: subData, isLoading: isLoadingSubs } = useGetServiceSubcategories(category.id!, {}, {
    query: { enabled: isExpanded }
  });
  
  const subcategories = Array.isArray(subData?.data) ? subData.data : [];

  return (
    <Card className={cn(
      "border-slate-100 overflow-hidden transition-all duration-300 rounded-[2.5rem]",
      isExpanded ? "shadow-2xl ring-2 ring-violet-500/10 scale-[1.02]" : "hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200"
    )}>
      <CardHeader className="p-8 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500",
              isExpanded ? "bg-violet-600 text-white rotate-6" : "bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-500"
            )}>
              {isExpanded ? <FolderOpen className="h-7 w-7" /> : <Folder className="h-7 w-7" />}
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-900 leading-tight">{category.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="font-mono text-[10px] tracking-widest text-slate-400 border-slate-200 px-2 py-0">
                  {category.code}
                </Badge>
                <Badge className={cn(
                  "text-[10px] font-bold px-2 py-0",
                  category.type === 'END_USER' ? "bg-blue-50 text-blue-600 border-none" : "bg-amber-50 text-amber-600 border-none"
                )}>
                  {category.type === 'END_USER' ? 'End User' : 'Host'}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50">
                <MoreVertical className="h-5 w-5 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl border-slate-100 p-2">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase text-slate-400 tracking-widest">Category Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={onEdit} className="rounded-xl h-11 px-3 font-bold gap-3">
                <Edit className="h-4 w-4 text-violet-500" /> Edit Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddSub} className="rounded-xl h-11 px-3 font-bold gap-3">
                <Plus className="h-4 w-4 text-emerald-500" /> Add Subcategory
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem onClick={onDelete} className="rounded-xl h-11 px-3 font-bold gap-3 text-red-600 focus:text-red-700 focus:bg-red-50">
                <Trash2 className="h-4 w-4" /> Delete Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-8 pt-0">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-between h-14 rounded-2xl font-black text-sm tracking-tight transition-all",
            isExpanded ? "bg-slate-50 text-violet-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
          onClick={onToggle}
        >
          <span className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {isExpanded ? "Hide Subcategories" : "Show Subcategories"}
            {!isExpanded && (
               <Badge className="ml-2 bg-slate-200 text-slate-600 border-none text-[10px] h-5 px-1.5">
                {subData?.total || 0}
              </Badge>
            )}
          </span>
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>

        {isExpanded && (
          <div className="mt-6 space-y-4 animate-in slide-in-from-top-4 duration-500 fill-mode-both">
            <Separator className="bg-slate-100" />
            
            {isLoadingSubs ? (
              <div className="flex items-center gap-3 py-10 justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                <span className="text-sm font-bold text-slate-400 italic">Retrieving sub-taxonomies...</span>
              </div>
            ) : subcategories.length === 0 ? (
              <div className="py-10 text-center bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-400">No subcategories defined</p>
                <Button variant="link" size="sm" className="text-violet-600 font-black h-auto p-0 mt-1" onClick={onAddSub}>
                  Create first one
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subcategories.map((sub) => (
                  <div key={sub.id} className="group/sub relative bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-emerald-200 hover:shadow-emerald-500/5 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-8">
                        <p className="font-black text-slate-900 truncate leading-tight">{sub.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{sub.code}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-all transform translate-x-2 group-hover/sub:translate-x-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                          onClick={() => onEditSub(sub)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => onDeleteSub(sub.id!)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-100 p-4 rounded-2xl text-slate-400 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all font-black text-sm"
                  onClick={onAddSub}
                >
                  <Plus className="h-4 w-4" /> Add New
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

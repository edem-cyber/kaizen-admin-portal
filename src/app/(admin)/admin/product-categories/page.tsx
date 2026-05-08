"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useGetProductCategories,
  useAddProductCategory,
  useUpdateProductCategory,
  useDeleteProductCategory,
  getGetProductCategoriesQueryKey,
} from "@/lib/generated/billing/product-categories/product-categories";
import type { ProductCategory, CreateProductCategoryDto, UpdateProductCategoryDto } from "@/lib/generated/billing/models";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText, Search, Loader2, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { PaginationController } from "@/components/ui/pagination-controller";
import { queryClient } from "@/lib/react-query-provider";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const templateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function ProductCategoriesPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const limit = 20;
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<ProductCategory | null>(null);
  const [deletingTemplate, setDeletingTemplate] = React.useState<ProductCategory | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", code: "" },
  });

  const { data: categoriesResp, isLoading, error, refetch } = useGetProductCategories({
    q: debouncedSearch || undefined,
    page: currentPage,
    limit,
  });

  const categories = Array.isArray(categoriesResp?.data) ? categoriesResp.data : [];

  const createMutation = useAddProductCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Package template created");
        queryClient.invalidateQueries({ queryKey: getGetProductCategoriesQueryKey() });
        setIsCreateOpen(false);
        reset();
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create template"),
    },
  });

  const updateMutation = useUpdateProductCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Package template updated");
        queryClient.invalidateQueries({ queryKey: getGetProductCategoriesQueryKey() });
        setEditingTemplate(null);
        reset();
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update template"),
    },
  });

  const deleteMutation = useDeleteProductCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Package template deleted");
        queryClient.invalidateQueries({ queryKey: getGetProductCategoriesQueryKey() });
        setDeletingTemplate(null);
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete template"),
    },
  });

  const onSubmit = (data: TemplateFormValues) => {
    if (editingTemplate) {
      const updateData: UpdateProductCategoryDto = {
        name: data.name,
        code: data.code,
      };
      updateMutation.mutate({ id: editingTemplate.id, data: updateData });
    } else {
      const createData: CreateProductCategoryDto = {
        name: data.name,
        code: data.code,
      };
      createMutation.mutate({ data: createData });
    }
  };

  const openEdit = (cat: ProductCategory) => {
    setEditingTemplate(cat);
    reset({ name: cat.name, code: cat.code });
  };

  const pagination = categoriesResp?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Product Categories</h1>
          <p className="text-slate-500 text-lg">Templates that organizations use to create their own packages</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (open) reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg shadow-violet-500/20 h-11 px-6 rounded-xl font-black text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="mr-2 h-4 w-4 stroke-[3px]" />
              Create Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-10 pb-0">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black text-slate-900">
                    New product category
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium text-base mt-2">
                    Create a template for organizations to build packages from.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-800">Category name</Label>
                  <Input {...register("name")} placeholder="Eg: Starter Package" className="h-12 rounded-xl border-slate-200" />
                  {errors.name && <p className="text-sm font-bold text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-800">System code</Label>
                  <Input {...register("code")} placeholder="Eg: STARTER" className="h-12 rounded-xl border-slate-200 bg-slate-50 font-mono uppercase" />
                  {errors.code && <p className="text-sm font-bold text-red-500">{errors.code.message}</p>}
                </div>
              </div>

              <DialogFooter className="p-10 pt-0 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="h-12 rounded-2xl px-8 font-bold bg-slate-50 text-slate-600">Cancel</Button>
                <Button type="submit" className="bg-[#8B5CF6] hover:bg-[#7C3AED] h-12 rounded-2xl px-10 font-black text-white shadow-lg shadow-violet-500/20" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Category
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 rounded-xl border-slate-200"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
          <p className="text-slate-500 font-medium">Loading categories...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 font-medium bg-red-50 rounded-2xl border border-red-100">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          Failed to load templates
          <Button variant="link" onClick={() => refetch()} className="block mx-auto mt-2">Try again</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Code</TableHead>
                  <TableHead className="font-bold hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-slate-500">
                      <FileText className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                      No product categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => (
                    <TableRow key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="font-semibold text-slate-900">{cat.name}</TableCell>
                      <TableCell>
                        <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded tracking-wider uppercase">
                          {cat.code}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 hidden md:table-cell">
                        {new Date(cat.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600" onClick={() => openEdit(cat)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setDeletingTemplate(cat)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {pagination && pagination.totalPages > 1 && (
            <PaginationController
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              limit={limit}
              onPageChange={setCurrentPage}
              itemName="categories"
            />
          )}
        </div>
      )}

      <Dialog open={!!editingTemplate} onOpenChange={(open) => { if (!open) setEditingTemplate(null); }}>
        <DialogContent className="sm:max-w-xl rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-10 pb-0">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black text-slate-900">
                  Edit category
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium text-base mt-2">
                  Updating information for <span className="text-violet-600 font-bold">{editingTemplate?.name}</span>
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <Label className="font-bold text-slate-800">Category name</Label>
                <Input {...register("name")} className="h-12 rounded-xl border-slate-200" />
                {errors.name && <p className="text-sm font-bold text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-800">System code</Label>
                <Input {...register("code")} disabled className="h-12 rounded-xl border-slate-200 bg-slate-50 font-mono" />
              </div>
            </div>

            <DialogFooter className="p-10 pt-0 flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setEditingTemplate(null)} className="h-12 rounded-2xl px-8 font-bold bg-slate-50 text-slate-600">Cancel</Button>
              <Button type="submit" className="bg-[#8B5CF6] hover:bg-[#7C3AED] h-12 rounded-2xl px-10 font-black text-white shadow-lg shadow-violet-500/20" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingTemplate} onOpenChange={(open) => { if (!open) setDeletingTemplate(null); }}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem] p-10 border-none shadow-2xl bg-white">
          <DialogHeader>
            <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-3xl font-black text-slate-900">
              Delete category
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-lg mt-2 leading-relaxed">
              Are you sure you want to delete <span className="text-slate-900 font-bold">{deletingTemplate?.name}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            <Button variant="ghost" onClick={() => setDeletingTemplate(null)} className="flex-1 h-12 rounded-2xl font-bold bg-slate-50 text-slate-600">Keep category</Button>
            <Button 
              onClick={() => deletingTemplate && deleteMutation.mutate({ id: deletingTemplate.id })} 
              disabled={deleteMutation.isPending}
              className="flex-1 h-12 rounded-2xl font-black bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20" 
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

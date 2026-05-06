"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetOrganizationRoles, useAddOrganizationRole, useUpdateOrganizationRole, useDeleteOrganizationRole } from "@/lib/generated/user/organization-roles/organization-roles";
import { useGetPermissions } from "@/lib/generated/user/permissions/permissions";
import { useGetPermissionGroups } from "@/lib/generated/user/permission-groups/permission-groups";
import { Shield, Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { OrganizationRole } from "@/lib/generated/user/models/organizationRole";

export default function AdminRolesPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<OrganizationRole | null>(null);
  const [formData, setFormData] = React.useState({ name: "", code: "", description: "", active: true, permissions: [] as string[] });

  // Queries
  const { data: rolesData, isLoading, refetch } = useGetOrganizationRoles({ limit: 100 });
  const { data: permissionsData } = useGetPermissions({ limit: 1000 });
  const { data: permissionGroupsData } = useGetPermissionGroups({ limit: 100 });

  // Mutations
  const addRoleMutation = useAddOrganizationRole();
  const updateRoleMutation = useUpdateOrganizationRole();
  const deleteRoleMutation = useDeleteOrganizationRole();

  const roles = Array.isArray(rolesData?.data) ? rolesData.data : [];
  const permissions = Array.isArray(permissionsData?.data) ? permissionsData.data : [];
  const permissionGroups = Array.isArray(permissionGroupsData?.data) ? permissionGroupsData.data : [];

  const filteredRoles = roles.filter((role: OrganizationRole) => String(role.name || "").toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddRole = async () => {
    try {
      await addRoleMutation.mutateAsync({ 
        data: { 
          name: formData.name, 
          code: formData.code || formData.name.toUpperCase().replace(/\s+/g, "_"), 
          organizationTypeId: 1, 
          active: formData.active, 
          permissions: formData.permissions 
        } 
      });
      toast.success("Role created successfully");
      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    } catch { 
      toast.error("Failed to create role"); 
    }
  };

  const handleEditRole = async () => {
    if (!selectedRole) return;
    try {
      await updateRoleMutation.mutateAsync({ 
        id: String(selectedRole.id), 
        data: { 
          name: formData.name, 
          active: formData.active,
          permissions: formData.permissions
        } 
      });
      toast.success("Role updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      refetch();
    } catch { 
      toast.error("Failed to update role"); 
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      await deleteRoleMutation.mutateAsync({ id: String(selectedRole.id) });
      toast.success("Role deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
      refetch();
    } catch { 
      toast.error("Failed to delete role"); 
    }
  };

  const resetForm = () => { 
    setFormData({ name: "", code: "", description: "", active: true, permissions: [] }); 
    setSelectedRole(null); 
  };

  const openEditDialog = (role: any) => { 
    setSelectedRole(role); 
    setFormData({ 
      name: String(role.name || ""), 
      code: String(role.code || ""), 
      description: "", 
      active: typeof role.active === 'boolean' ? role.active : true,
      permissions: Array.isArray(role.permissions) ? role.permissions.map((p: any) => p.code || p) : []
    }); 
    setIsEditDialogOpen(true); 
  };

  const openDeleteDialog = (role: OrganizationRole) => { 
    setSelectedRole(role); 
    setIsDeleteDialogOpen(true); 
  };

  const togglePermission = (code: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(code)
        ? prev.permissions.filter(c => c !== code)
        : [...prev.permissions, code]
    }));
  };

  const renderPermissionsSection = () => {
    if (!permissions.length) return <p className="text-sm text-slate-500 p-4 border rounded-md bg-slate-50 text-center">No permissions loaded.</p>;
  
    const grouped: Record<string, any[]> = {};
    const ungrouped: any[] = [];
  
    permissions.forEach(p => {
      if (p.groupId) {
        if (!grouped[String(p.groupId)]) grouped[String(p.groupId)] = [];
        grouped[String(p.groupId)].push(p);
      } else {
        ungrouped.push(p);
      }
    });
  
    return (
      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-slate-900">Permissions</Label>
          <Badge variant="secondary" className="font-mono">{formData.permissions.length} selected</Badge>
        </div>
        <ScrollArea className="h-[350px] w-full rounded-xl border border-slate-200 p-4 bg-slate-50/50">
          <div className="space-y-8">
            {permissionGroups.map(group => {
              const groupPerms = grouped[String(group.id)] || [];
              if (groupPerms.length === 0) return null;
              return (
                <div key={String(group.id)} className="space-y-4">
                  <h4 className="font-bold text-sm tracking-wide uppercase text-slate-500 border-b border-slate-200 pb-2">{String(group.name)}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupPerms.map(p => (
                      <div key={String(p.code)} className="flex items-start space-x-3">
                        <Checkbox
                          id={String(p.code)}
                          checked={formData.permissions.includes(String(p.code))}
                          onCheckedChange={() => togglePermission(String(p.code))}
                          className="mt-1"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label htmlFor={String(p.code)} className="text-sm font-medium leading-none cursor-pointer text-slate-800">
                            {String(p.name || p.code)}
                          </label>
                          {p.description && <p className="text-xs text-slate-500 leading-snug">{String(p.description)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {ungrouped.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm tracking-wide uppercase text-slate-500 border-b border-slate-200 pb-2">Other Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ungrouped.map(p => (
                    <div key={String(p.code)} className="flex items-start space-x-3">
                      <Checkbox
                        id={String(p.code)}
                        checked={formData.permissions.includes(String(p.code))}
                        onCheckedChange={() => togglePermission(String(p.code))}
                        className="mt-1"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor={String(p.code)} className="text-sm font-medium leading-none cursor-pointer text-slate-800">
                          {String(p.name || p.code)}
                        </label>
                        {p.description && <p className="text-xs text-slate-500 leading-snug">{String(p.description)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Roles & Permissions</h1>
          <p className="text-slate-500">Manage organizational roles and configure fine-grained permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 shadow-sm rounded-xl font-medium">
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl rounded-3xl p-6 border-none shadow-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold">Add New Role</DialogTitle>
              <DialogDescription>Create a new role and assign its capabilities.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">Role Name</Label>
                  <Input className="h-10 rounded-lg bg-slate-50" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">Code (optional)</Label>
                  <Input className="h-10 rounded-lg bg-slate-50" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="Auto-generated if empty" />
                </div>
              </div>
              {renderPermissionsSection()}
            </div>
            <DialogFooter className="mt-6">
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button className="bg-violet-600 hover:bg-violet-700 rounded-xl" onClick={handleAddRole} disabled={addRoleMutation.isPending || !formData.name}>
                {addRoleMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search roles by name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 h-12 rounded-xl bg-slate-50 border-transparent focus-visible:ring-violet-500 focus-visible:border-violet-500 text-base" 
            />
          </div>
        </CardContent>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 h-12 pl-6">Role Name</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12">Code</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12">Status</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12">Created</TableHead>
                  <TableHead className="text-right font-bold text-slate-700 h-12 pr-6 w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      <Shield className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                      <p className="text-lg font-medium text-slate-600">No roles found</p>
                      <p className="text-sm">Try adjusting your search query.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role: any, index: number) => (
                    <TableRow key={String(role.id || index)} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                            <Shield className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{String(role.name || '-')}</div>
                            {role.permissions && Array.isArray(role.permissions) && (
                              <div className="text-xs text-slate-500 mt-0.5">{role.permissions.length} permissions</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-slate-100 text-slate-600 px-2 py-1 text-xs font-mono font-medium tracking-wide">
                          {String(role.code || '-')}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={role.active === true ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}>
                          {role.active === true ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm font-medium">
                        {role.createdAt ? new Date(String(role.createdAt)).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                              <MoreHorizontal className="h-4 w-4 text-slate-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border-slate-100">
                            <DropdownMenuLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(role)} className="cursor-pointer font-medium">
                              <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 cursor-pointer font-medium focus:bg-red-50 focus:text-red-700" onClick={() => openDeleteDialog(role)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl p-6 border-none shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">Edit Role</DialogTitle>
            <DialogDescription>Update role details and permissions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-900">Role Name</Label>
              <Input className="h-10 rounded-lg bg-slate-50" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            {renderPermissionsSection()}
          </div>
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 rounded-xl" onClick={handleEditRole} disabled={updateRoleMutation.isPending || !formData.name}>
              {updateRoleMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-red-600">Delete Role</DialogTitle>
            <DialogDescription className="text-base text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{String(selectedRole?.name || '')}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDeleteRole} disabled={deleteRoleMutation.isPending}>
              {deleteRoleMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

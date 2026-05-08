"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { useGetUsers, useAddUser, useUpdateUser, useRemoveUser } from "@/lib/generated/user/users/users";
import { useGetUserStatuses } from "@/lib/generated/user/user-statuses/user-statuses";
import { useGetOrganizationRoles } from "@/lib/generated/user/organization-roles/organization-roles";
import { useGetOrganizations } from "@/lib/generated/org/organizations/organizations";
import { ProfilePicture } from "@/components/ui/profile-picture";
import { UserStatusBadge, type UserStatusValue } from "@/components/ui/status-display";
import { Users, Plus, Search, MoreHorizontal, Pencil, Trash2, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { UserDto } from "@/lib/generated/user/models/userDto";
import type { OrganizationDto as OrgServiceDto } from "@/lib/generated/org/models/organizationDto";

interface TypedStatus {
  code: string;
}
interface TypedRole {
  id: string;
  name: string;
}
interface TypedOrg {
  id: number;
  name: string;
}

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserDto | null>(null);
  const [formData, setFormData] = React.useState({ firstName: "", lastName: "", username: "", emailAddress: "", status: "active", organizationId: "", organizationRoleId: "" });

  const { data: usersData, isLoading, refetch } = useGetUsers({ limit: PAGE_SIZE, page: currentPage, status: statusFilter || undefined });
  const { data: statusesData } = useGetUserStatuses({});
  const { data: rolesData } = useGetOrganizationRoles({});
  const { data: orgsData } = useGetOrganizations({ limit: 100 });
  const addUserMutation = useAddUser();
  const updateUserMutation = useUpdateUser();
  const removeUserMutation = useRemoveUser();

  const users = Array.isArray(usersData?.data) ? usersData.data : [];
  const statuses = Array.isArray(statusesData?.data) ? (statusesData.data as unknown as TypedStatus[]) : [];
  const roles = Array.isArray(rolesData?.data) ? (rolesData.data as unknown as TypedRole[]) : [];
  const orgs = Array.isArray(orgsData?.data) ? (orgsData.data as unknown as TypedOrg[]) : [];

  const filteredUsers = users.filter((user: UserDto) => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAddUser = async () => {
    try {
      await addUserMutation.mutateAsync({
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          emailAddress: formData.emailAddress || null,
          confirmationUrl: `${window.location.origin}/confirm-account`,
          organizationId: parseInt(formData.organizationId),
          organizationRoleId: formData.organizationRoleId,
        }
      });
      toast.success("User created successfully");
      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser?.id) return;
    try {
      await updateUserMutation.mutateAsync({
        id: selectedUser.id,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          emailAddress: formData.emailAddress || null,
          status: formData.status,
        }
      });
      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?.id) return;
    try {
      await removeUserMutation.mutateAsync({ id: selectedUser.id });
      toast.success("User deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", username: "", emailAddress: "", status: "active", organizationId: "", organizationRoleId: "" });
    setSelectedUser(null);
  };

  const openEditDialog = (user: UserDto) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      emailAddress: user.emailAddress || "",
      status: user.status || "active",
      organizationId: String(user.organizationId || ""),
      organizationRoleId: user.organizationRoleId || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: UserDto) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500">Manage platform users</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg shadow-violet-500/20 h-11 px-6 rounded-xl font-black text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              <UserPlus className="mr-2 h-4 w-4 stroke-[3px]" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
            <div className="p-10 pb-0">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black text-slate-900">
                  New user account
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium text-base mt-2">
                  Create a new user account and assign access.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-800">First name</Label>
                  <Input className="h-12 rounded-xl border-slate-200" placeholder="Eg: John" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-800">Last name</Label>
                  <Input className="h-12 rounded-xl border-slate-200" placeholder="Eg: Doe" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-800">Username</Label>
                <Input className="h-12 rounded-xl border-slate-200 bg-slate-50 font-mono" placeholder="johndoe" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-800">Email address</Label>
                <Input className="h-12 rounded-xl border-slate-200" type="email" placeholder="john@example.com" value={formData.emailAddress} onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-800">Organization</Label>
                  <Select value={formData.organizationId} onValueChange={(v) => setFormData({ ...formData, organizationId: v })}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {orgs.map((org) => (<SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-800">System Role</Label>
                  <Select value={formData.organizationRoleId} onValueChange={(v) => setFormData({ ...formData, organizationRoleId: v })}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {roles.map((role) => (<SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="p-10 pt-0 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-12 rounded-2xl px-8 font-bold bg-slate-50 text-slate-600">Cancel</Button>
              <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] h-12 rounded-2xl px-10 font-black text-white shadow-lg shadow-violet-500/20" onClick={handleAddUser} disabled={addUserMutation.isPending}>
                {addUserMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((s) => (<SelectItem key={s.code} value={s.code}>{s.code}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Users</CardTitle><CardDescription>{filteredUsers.length} users found</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500"><Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />No users found</TableCell></TableRow>
                  ) : filteredUsers.map((user: UserDto) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProfilePicture
                            firstName={user.firstName}
                            lastName={user.lastName}
                            email={user.emailAddress}
                            size="default"
                          />
                          <div>
                            <div className="font-medium">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}</div>
                            <div className="text-sm text-slate-500">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.emailAddress || '-'}</TableCell>
                      <TableCell>{((user.organization as unknown) as OrgServiceDto | undefined)?.name || '-'}</TableCell>
                      <TableCell>{user.organizationRole?.name || '-'}</TableCell>
                      <TableCell><UserStatusBadge status={user.status as UserStatusValue} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(user)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(user)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
          <div className="p-10 pb-0">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-slate-900">
                Edit user details
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium text-base mt-2">
                Update account information for <span className="text-violet-600 font-bold">@{formData.username}</span>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-10 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-800">First name</Label>
                <Input className="h-12 rounded-xl border-slate-200" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-800">Last name</Label>
                <Input className="h-12 rounded-xl border-slate-200" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-800">Email address</Label>
              <Input className="h-12 rounded-xl border-slate-200" type="email" value={formData.emailAddress} onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-800">Account status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  {statuses.map((s) => (<SelectItem key={s.code} value={s.code} className="capitalize">{s.code}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-10 pt-0 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="h-12 rounded-2xl px-8 font-bold bg-slate-50 text-slate-600">Cancel</Button>
            <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] h-12 rounded-2xl px-10 font-black text-white shadow-lg shadow-violet-500/20" onClick={handleEditUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Update Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem] p-10 border-none shadow-2xl bg-white">
          <DialogHeader>
            <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-3xl font-black text-slate-900">
              Delete user
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-lg mt-2 leading-relaxed">
              Are you sure you want to delete <span className="text-slate-900 font-bold">{formData.firstName} {formData.lastName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 h-12 rounded-2xl font-bold bg-slate-50 text-slate-600">Keep account</Button>
            <Button 
              onClick={handleDeleteUser} 
              disabled={removeUserMutation.isPending}
              className="flex-1 h-12 rounded-2xl font-black bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20" 
            >
              {removeUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

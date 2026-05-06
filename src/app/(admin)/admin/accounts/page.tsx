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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useGetOrganizations, 
  useAddOrganization, 
  useUpdateOrganization, 
  useRemoveOrganization,
  getGetOrganizationsQueryKey 
} from "@/lib/generated/org/organizations/organizations";
import { useGetOrganizationTypes } from "@/lib/generated/org/organization-types/organization-types";
import { useGetCountries } from "@/lib/generated/org/countries/countries";
import { 
  Building2, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Loader2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  ExternalLink,
  ShieldCheck,
  Building,
  LayoutGrid,
  List as ListIcon,
  CalendarDays
} from "lucide-react";
import { ViewToggle } from "@/components/ui/view-toggle";
import { PaginationController } from "@/components/ui/pagination-controller";
import { queryClient } from "@/lib/react-query-provider";
import { toast } from "sonner";
import type { OrganizationDto } from "@/lib/generated/org/models/organizationDto";
import type { OrganizationStatus } from "@/lib/generated/org/models/organizationStatus";
import type { UpdateOrganizationDto, UpdateOrganizationDtoStatus, UpdateOrganizationDtoSpaceType } from "@/lib/generated/org/models";

export default function AdminAccountsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<OrganizationStatus | "">("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
  const [currentPage, setCurrentPage] = React.useState(1);
  const limit = 20;

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedOrg, setSelectedOrg] = React.useState<OrganizationDto | null>(null);
  
  const [formData, setFormData] = React.useState({ 
    name: "", 
    code: "",
    contactEmail: "",
    alternateEmail: "",
    contactMsisdn: "",
    address: "", 
    city: "", 
    region: "",
    logoUrl: "",
    domain: "", 
    webUrl: "",
    status: "ACTIVE" as UpdateOrganizationDtoStatus, 
    statusReason: "",
    countryId: "", 
    typeId: "",
    spaceType: "LOW" as UpdateOrganizationDtoSpaceType,
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminUsername: "",
    projectId: "",
    groupId: "",
  });

  const { data: orgsData, isLoading } = useGetOrganizations({ 
    page: currentPage,
    limit, 
    status: statusFilter || undefined,
    q: searchTerm || undefined
  });
  const { data: typesData } = useGetOrganizationTypes();
  const { data: countriesData } = useGetCountries();

  const addOrgMutation = useAddOrganization({
    mutation: {
      onSuccess: () => {
        toast.success("Organization created successfully");
        queryClient.invalidateQueries({ queryKey: getGetOrganizationsQueryKey() });
        setIsAddDialogOpen(false);
        resetForm();
      },
      onError: () => toast.error("Failed to create organization")
    }
  });

  const updateOrgMutation = useUpdateOrganization({
    mutation: {
      onSuccess: () => {
        toast.success("Organization updated successfully");
        queryClient.invalidateQueries({ queryKey: getGetOrganizationsQueryKey() });
        setIsEditDialogOpen(false);
        resetForm();
      },
      onError: () => toast.error("Failed to update organization")
    }
  });

  const removeOrgMutation = useRemoveOrganization({
    mutation: {
      onSuccess: () => {
        toast.success("Organization deleted successfully");
        queryClient.invalidateQueries({ queryKey: getGetOrganizationsQueryKey() });
        setIsDeleteDialogOpen(false);
        setSelectedOrg(null);
      },
      onError: () => toast.error("Failed to delete organization")
    }
  });

  const orgs = Array.isArray(orgsData?.data) ? orgsData.data : [];
  const pagination = orgsData?.pagination;
  const types = Array.isArray(typesData?.data) ? typesData.data : [];
  const countries = Array.isArray(countriesData?.data) ? countriesData.data : [];

  const handleAddOrg = () => {
    addOrgMutation.mutate({ 
      data: { 
        name: formData.name, 
        code: formData.code || undefined,
        domain: formData.domain || undefined, 
        address: formData.address, 
        city: formData.city || undefined, 
        region: formData.region || undefined,
        countryId: parseInt(formData.countryId), 
        typeId: parseInt(formData.typeId) || 1,
        projectId: formData.projectId ? parseInt(formData.projectId) : undefined,
        groupId: formData.groupId ? parseInt(formData.groupId) : undefined,
        adminProfile: {
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          emailAddress: formData.adminEmail,
          username: formData.adminUsername,
        },
        confirmationUrl: `${window.location.origin}/confirm`,
      } 
    });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleEditOrg = () => {
    if (!selectedOrg) return;
    const updateData: UpdateOrganizationDto = { 
      name: formData.name, 
      code: formData.code || undefined,
      contactEmail: formData.contactEmail || undefined,
      alternateEmail: formData.alternateEmail || undefined,
      contactMsisdn: formData.contactMsisdn || undefined,
      address: formData.address, 
      city: formData.city || undefined, 
      region: formData.region || undefined,
      logoUrl: formData.logoUrl || undefined,
      domain: formData.domain || undefined, 
      webUrl: formData.webUrl || undefined,
      status: formData.status, 
      statusReason: formData.statusReason || undefined,
      countryId: parseInt(formData.countryId),
      typeId: parseInt(formData.typeId),
      projectId: formData.projectId ? parseInt(formData.projectId) : undefined,
      groupId: formData.groupId ? parseInt(formData.groupId) : undefined,
      spaceType: formData.spaceType,
    };
    updateOrgMutation.mutate({ id: selectedOrg.id, data: updateData });
  };

  const handleDeleteOrg = () => {
    if (!selectedOrg) return;
    removeOrgMutation.mutate({ id: selectedOrg.id });
  };

  const resetForm = () => { 
    setFormData({ 
      name: "", 
      code: "",
      contactEmail: "",
      alternateEmail: "",
      contactMsisdn: "",
      address: "", 
      city: "", 
      region: "",
      logoUrl: "",
      domain: "", 
      webUrl: "",
      status: "ACTIVE", 
      statusReason: "",
      countryId: "", 
      typeId: "",
      spaceType: "LOW",
      adminFirstName: "",
      adminLastName: "",
      adminEmail: "",
      adminUsername: "",
      projectId: "",
      groupId: "",
    }); 
    setSelectedOrg(null); 
  };
  
  const openEditDialog = (org: OrganizationDto) => { 
    setSelectedOrg(org); 
    setFormData({ 
      name: org.name || "", 
      code: org.code || "",
      contactEmail: org.contactEmail || "",
      alternateEmail: org.alternateEmail || "",
      contactMsisdn: org.contactMsisdn || "",
      address: org.address || "", 
      city: org.city || "", 
      region: org.region || "",
      logoUrl: org.logoUrl || "",
      domain: org.domain || "", 
      webUrl: org.webUrl || "",
      status: (org.status || "ACTIVE") as UpdateOrganizationDtoStatus, 
      statusReason: org.statusReason || "",
      countryId: String(org.countryId || ""), 
      typeId: String(org.typeId || ""),
      spaceType: (org.spaceType || "LOW") as UpdateOrganizationDtoSpaceType,
      adminFirstName: "",
      adminLastName: "",
      adminEmail: "",
      adminUsername: "",
      projectId: String(org.projectId || ""),
      groupId: String(org.groupId || ""),
    }); 
    setIsEditDialogOpen(true); 
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
      case "SUSPENDED": return <Badge className="bg-red-100 text-red-700 border-red-200">Suspended</Badge>;
      case "INACTIVE": return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Inactive</Badge>;
      default: return <Badge variant="outline">{status || "unknown"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Accounts</h1>
          <p className="text-slate-500 text-lg">Manage platform organizations and access</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <Button 
            className="bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20 h-11 px-6 rounded-xl font-bold"
            onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Account
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search by name, code or domain..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 h-12 rounded-xl border-slate-200 focus-visible:ring-violet-500" 
          />
        </div>
        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v as OrganizationStatus)}>
          <SelectTrigger className="w-full md:w-[200px] h-12 rounded-xl border-slate-200">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
          <p className="text-slate-500 font-medium">Synchronizing organization registry...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === "list" ? (
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold">Organization</TableHead>
                    <TableHead className="font-bold">Contact</TableHead>
                    <TableHead className="font-bold">Location</TableHead>
                    <TableHead className="font-bold">Type</TableHead>
                    <TableHead className="font-bold">Created At</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-slate-500">
                        <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                        No organizations found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : orgs.map((org) => (
                    <TableRow key={org.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                            {org.logoUrl ? (
                              <img src={org.logoUrl} alt={org.name} className="h-full w-full object-cover rounded-xl" />
                            ) : (
                              <Building2 className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{org.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{org.code || 'NO-CODE'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Mail className="h-3 w-3" /> {org.contactEmail || '-'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="h-3 w-3" /> {org.contactMsisdn || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700">{org.city || '-'}</div>
                        <div className="text-[10px] text-slate-400">{org.country?.name || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium">
                          {org.type?.name || 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(org.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(String(org.status))}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-200">
                            <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(org)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => { setSelectedOrg(org); setIsDeleteDialogOpen(true); }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orgs.map((org) => (
                <Card key={org.id} className="relative border-slate-200 hover:border-violet-300 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                         {org.logoUrl ? (
                          <img src={org.logoUrl} alt={org.name} className="h-full w-full object-cover rounded-2xl" />
                        ) : (
                          <Building className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(String(org.status))}
                        <Badge variant="outline" className="text-[10px] font-mono border-slate-200 text-slate-400">{org.code || 'NO-CODE'}</Badge>
                      </div>
                    </div>
                    <div className="pt-4">
                      <CardTitle className="text-xl font-black text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1">{org.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1 font-medium">
                        <Globe className="h-3 w-3" /> {org.domain || 'no-domain.com'}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 border-t border-slate-50 pt-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Mail className="h-3.5 w-3.5 text-violet-500" />
                        <span className="truncate">{org.contactEmail || 'No email provided'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-violet-500" />
                        <span className="truncate">{org.city || 'Location unknown'}, {org.country?.code || ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold pt-1">
                        <CalendarDays className="h-3 w-3" />
                        Onboarded: {formatDate(org.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 rounded-xl h-9 font-bold border-slate-200 hover:bg-slate-50"
                        onClick={() => openEditDialog(org)}
                      >
                        Details
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50"
                        onClick={() => { setSelectedOrg(org); setIsDeleteDialogOpen(true); }}
                      >
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
            itemName="organizations"
          />
        </div>
      )}

      {/* Add Organization Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl">
          <div className="bg-linear-to-r from-violet-600 to-indigo-600 p-8 text-white relative">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black flex items-center gap-3">
                <Building2 className="h-8 w-8 text-violet-200" />
                Onboard Organization
              </DialogTitle>
              <DialogDescription className="text-violet-100 text-lg opacity-90">
                Initialize a new organizational entity on the platform
              </DialogDescription>
            </DialogHeader>
            <ShieldCheck className="absolute right-8 top-8 h-24 w-24 text-white/10 rotate-12" />
          </div>
          
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">Organization Name *</Label>
                  <Input placeholder="e.g. Acme Corporation" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">Official Domain</Label>
                  <Input placeholder="acme.com" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} className="h-12 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">Country *</Label>
                  <Select value={formData.countryId} onValueChange={(v) => setFormData({ ...formData, countryId: v })}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {countries.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">Organization Type *</Label>
                  <Select value={formData.typeId} onValueChange={(v) => setFormData({ ...formData, typeId: v })}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {types.map((t) => (<SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3"><Label className="text-sm font-bold text-slate-700">Project ID (Optional)</Label><Input type="number" placeholder="e.g. 102" value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} className="h-12 rounded-xl" /></div>
                <div className="space-y-3"><Label className="text-sm font-bold text-slate-700">Group ID (Optional)</Label><Input type="number" placeholder="e.g. 5" value={formData.groupId} onChange={(e) => setFormData({ ...formData, groupId: e.target.value })} className="h-12 rounded-xl" /></div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-violet-600" />
                  Primary Administrator
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-400">First Name</Label><Input value={formData.adminFirstName} onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })} className="bg-white rounded-lg h-10" /></div>
                  <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-400">Last Name</Label><Input value={formData.adminLastName} onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })} className="bg-white rounded-lg h-10" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-400">Official Email</Label><Input type="email" value={formData.adminEmail} onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} className="bg-white rounded-lg h-10" /></div>
                  <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-400">Username</Label><Input value={formData.adminUsername} onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })} className="bg-white rounded-lg h-10" /></div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 border-t bg-slate-50 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-12 rounded-xl px-6 font-bold">Cancel</Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700 h-12 rounded-2xl px-8 font-black shadow-xl shadow-violet-500/20" 
              onClick={handleAddOrg} 
              disabled={addOrgMutation.isPending}
            >
              {addOrgMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
              Complete Onboarding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white relative">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black flex items-center gap-3">
                <Pencil className="h-8 w-8 text-violet-400" />
                Configure Organization
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-lg font-medium">
                Modifying profile for <span className="text-white font-bold">{selectedOrg?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <Building2 className="absolute right-8 top-8 h-24 w-24 text-white/5 rotate-12" />
          </div>

          <ScrollArea className="flex-1 p-8">
            <Tabs defaultValue="general" className="space-y-8">
              <TabsList className="bg-slate-100 p-1 rounded-xl w-full max-w-md mx-auto grid grid-cols-2">
                <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">General Info</TabsTrigger>
                <TabsTrigger value="contact" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Contact & Access</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Organization Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-xl" /></div>
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Internal Code</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="h-11 rounded-xl uppercase font-mono" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3"><Label className="font-bold text-slate-700">City</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-11 rounded-xl" /></div>
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Region</Label><Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} className="h-11 rounded-xl" /></div>
                </div>
                <div className="space-y-3"><Label className="font-bold text-slate-700">Physical Address</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-11 rounded-xl" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Space Tier</Label>
                    <Select value={formData.spaceType || ""} onValueChange={(v) => setFormData({ ...formData, spaceType: v as any })}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl">
                        <SelectItem value="LOW">Low Tier</SelectItem>
                        <SelectItem value="MEDIUM">Medium Tier</SelectItem>
                        <SelectItem value="HIGH">High Tier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Account Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl">
                        <SelectItem value="ACTIVE" className="text-green-600 font-bold">Active</SelectItem>
                        <SelectItem value="INACTIVE" className="text-amber-600 font-bold">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED" className="text-red-600 font-bold">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Primary Email</Label><Input type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} className="h-11 rounded-xl" /></div>
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Phone Number</Label><Input value={formData.contactMsisdn} onChange={(e) => setFormData({ ...formData, contactMsisdn: e.target.value })} className="h-11 rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Official Domain</Label><Input value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} className="h-11 rounded-xl" /></div>
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Website URL</Label><Input value={formData.webUrl} onChange={(e) => setFormData({ ...formData, webUrl: e.target.value })} className="h-11 rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Alternate Email</Label><Input type="email" value={formData.alternateEmail} onChange={(e) => setFormData({ ...formData, alternateEmail: e.target.value })} className="h-11 rounded-xl" /></div>
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Logo URL</Label><Input value={formData.logoUrl} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} className="h-11 rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Status Reason</Label><Input value={formData.statusReason} onChange={(e) => setFormData({ ...formData, statusReason: e.target.value })} className="h-11 rounded-xl" placeholder="If inactive or suspended" /></div>
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Country ID</Label><Input type="number" value={formData.countryId} onChange={(e) => setFormData({ ...formData, countryId: e.target.value })} className="h-11 rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Type ID</Label><Input type="number" value={formData.typeId} onChange={(e) => setFormData({ ...formData, typeId: e.target.value })} className="h-11 rounded-xl" /></div>
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Project ID</Label><Input type="number" value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} className="h-11 rounded-xl" /></div>
                  <div className="space-y-3"><Label className="font-bold text-slate-700">Group ID</Label><Input type="number" value={formData.groupId} onChange={(e) => setFormData({ ...formData, groupId: e.target.value })} className="h-11 rounded-xl" /></div>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <DialogFooter className="p-8 border-t bg-slate-50 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="h-12 rounded-xl px-6 font-bold">Discard Changes</Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700 h-12 rounded-2xl px-8 font-black shadow-xl shadow-violet-500/20 min-w-[160px]" 
              onClick={handleEditOrg} 
              disabled={updateOrgMutation.isPending}
            >
              {updateOrgMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Save Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-red-600 flex items-center gap-2">
              <Trash2 className="h-7 w-7" />
              Terminate Account
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-lg leading-relaxed">
              Are you sure you want to delete <span className="text-slate-900 font-bold">{selectedOrg?.name}</span>? This will permanently remove all associated data and access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="h-12 rounded-xl font-bold flex-1">Keep Account</Button>
            <Button 
              variant="destructive" 
              className="h-12 rounded-xl font-black flex-1" 
              onClick={handleDeleteOrg} 
              disabled={removeOrgMutation.isPending}
            >
              {removeOrgMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useGetPaymentInstitutions, 
  useAddPaymentInstitution, 
  useUpdatePaymentInstitution, 
  useDeletePaymentInstitution,
  useSearchPaymentInstitutions,
  getGetPaymentInstitutionsQueryKey
} from "@/lib/generated/billing/payment-institutions/payment-institutions";
import { 
  useGetPaymentChannels, 
  useAddPaymentChannel, 
  useUpdatePaymentChannel, 
  useDeletePaymentChannel,
  useSearchPaymentChannels,
  getGetPaymentChannelsQueryKey
} from "@/lib/generated/billing/payment-channels/payment-channels";
import {
  useGetPaymentInstitutionBranches,
  useAddPaymentInstitutionBranch,
  useUpdatePaymentInstitutionBranch,
  useDeletePaymentInstitutionBranch,
  useSearchPaymentInstitutionBranches,
  getGetPaymentInstitutionBranchesQueryKey
} from "@/lib/generated/billing/payment-institution-branches/payment-institution-branches";
import { useListCountries } from "@/lib/generated/payment/miscellaneous/miscellaneous";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Building2, 
  Loader2, 
  CreditCard,
  Globe,
  MoreHorizontal,
  MapPin
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AdminPaymentConfigPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("institutions");
  const [searchTerm, setSearchTerm] = React.useState("");

  // --- INSTITUTIONS STATE ---
  const [isInstitutionOpen, setIsInstitutionOpen] = React.useState(false);
  const [editingInstitution, setEditingInstitution] = React.useState<any>(null);
  const [institutionForm, setInstitutionForm] = React.useState({
    shortName: "",
    name: "",
    active: true,
    countryId: 1,
    paymentChannelType: "BANK",
    code: "",
    swiftCode: "",
  });

  // --- CHANNELS STATE ---
  const [isChannelOpen, setIsChannelOpen] = React.useState(false);
  const [editingChannel, setEditingChannel] = React.useState<any>(null);
  const [channelForm, setChannelForm] = React.useState({
    countryId: 1,
    code: "",
    name: "",
    description: "",
    chargeType: "FLAT",
    chargeRate: 0,
    minimumCharge: "0",
    maximumCharge: "0",
    hasThirdPartyApiSupport: false,
    applyTax: false,
    active: true,
  });

  // --- BRANCHES STATE ---
  const [isBranchOpen, setIsBranchOpen] = React.useState(false);
  const [editingBranch, setEditingBranch] = React.useState<any>(null);
  const [branchForm, setBranchForm] = React.useState({
    paymentInstitutionId: 0,
    name: "",
    sortCode: "",
    description: "",
  });

  // --- DATA FETCHING ---
  const { data: instListData } = useGetPaymentInstitutions({ limit: 100 }, { 
    query: { enabled: !searchTerm || activeTab === "institutions" } 
  });
  const { data: instSearchData } = useSearchPaymentInstitutions({ q: searchTerm }, { 
    query: { enabled: !!searchTerm && activeTab === "institutions" } 
  });
  
  const { data: channelsListData } = useGetPaymentChannels({ limit: 100 }, { 
    query: { enabled: !searchTerm || activeTab === "channels" } 
  });
  const { data: channelsSearchData } = useSearchPaymentChannels({ q: searchTerm }, { 
    query: { enabled: !!searchTerm && activeTab === "channels" } 
  });

  const { data: branchesListData } = useGetPaymentInstitutionBranches({ limit: 100 }, { 
    query: { enabled: !searchTerm || activeTab === "branches" } 
  });
  const { data: branchesSearchData } = useSearchPaymentInstitutionBranches({ q: searchTerm }, { 
    query: { enabled: !!searchTerm && activeTab === "branches" } 
  });

  const { data: countriesData } = useListCountries();

  const institutions = searchTerm && activeTab === "institutions" ? (instSearchData?.data || []) : (instListData?.data || []);
  const channels = searchTerm && activeTab === "channels" ? (channelsSearchData?.data || []) : (channelsListData?.data || []);
  const branches = searchTerm && activeTab === "branches" ? (branchesSearchData?.data || []) : (branchesListData?.data || []);
  const countries = countriesData?.data || [];

  const getInstitutionName = (id: number) => {
    return institutions.find(i => i.id === id)?.name || `Institution #${id}`;
  };

  // --- MUTATIONS ---
  const addInst = useAddPaymentInstitution({
    mutation: { onSuccess: () => { toast.success("Institution added"); queryClient.invalidateQueries({ queryKey: getGetPaymentInstitutionsQueryKey() }); setIsInstitutionOpen(false); } }
  });
  const updateInst = useUpdatePaymentInstitution({
    mutation: { onSuccess: () => { toast.success("Institution updated"); queryClient.invalidateQueries({ queryKey: getGetPaymentInstitutionsQueryKey() }); setEditingInstitution(null); } }
  });
  const deleteInst = useDeletePaymentInstitution({
    mutation: { onSuccess: () => { toast.success("Institution deleted"); queryClient.invalidateQueries({ queryKey: getGetPaymentInstitutionsQueryKey() }); } }
  });

  const addChannel = useAddPaymentChannel({
    mutation: { onSuccess: () => { toast.success("Channel added"); queryClient.invalidateQueries({ queryKey: getGetPaymentChannelsQueryKey() }); setIsChannelOpen(false); } }
  });
  const updateChannel = useUpdatePaymentChannel({
    mutation: { onSuccess: () => { toast.success("Channel updated"); queryClient.invalidateQueries({ queryKey: getGetPaymentChannelsQueryKey() }); setEditingChannel(null); } }
  });
  const deleteChannel = useDeletePaymentChannel({
    mutation: { onSuccess: () => { toast.success("Channel deleted"); queryClient.invalidateQueries({ queryKey: getGetPaymentChannelsQueryKey() }); } }
  });

  const addBranch = useAddPaymentInstitutionBranch({
    mutation: { onSuccess: () => { toast.success("Branch added"); queryClient.invalidateQueries({ queryKey: getGetPaymentInstitutionBranchesQueryKey() }); setIsBranchOpen(false); } }
  });
  const updateBranch = useUpdatePaymentInstitutionBranch({
    mutation: { onSuccess: () => { toast.success("Branch updated"); queryClient.invalidateQueries({ queryKey: getGetPaymentInstitutionBranchesQueryKey() }); setEditingBranch(null); } }
  });
  const deleteBranch = useDeletePaymentInstitutionBranch({
    mutation: { onSuccess: () => { toast.success("Branch deleted"); queryClient.invalidateQueries({ queryKey: getGetPaymentInstitutionBranchesQueryKey() }); } }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payment Configuration</h1>
          <p className="text-slate-500">Global treasury and gateway settings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="institutions" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4" /> 
            Payment Institutions 
            <Badge variant="secondary" className="ml-1.5 bg-slate-200 text-slate-700 hover:bg-slate-200">{institutions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard className="h-4 w-4" /> 
            Payment Channels 
            <Badge variant="secondary" className="ml-1.5 bg-slate-200 text-slate-700 hover:bg-slate-200">{channels.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="branches" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <MapPin className="h-4 w-4" /> 
            Institution Branches
            <Badge variant="secondary" className="ml-1.5 bg-slate-200 text-slate-700 hover:bg-slate-200">{branches.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="institutions" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search institutions..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => { setEditingInstitution(null); setInstitutionForm({ shortName: "", name: "", active: true, countryId: 1, paymentChannelType: "BANK", code: "", swiftCode: "" }); setIsInstitutionOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Institution
            </Button>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Swift Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutions.map((inst: any) => (
                  <TableRow key={inst.id}>
                    <TableCell>
                      <div className="font-medium">{inst.name}</div>
                      <div className="text-xs text-slate-400">{inst.shortName}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{inst.code}</TableCell>
                    <TableCell><Badge variant="outline">{inst.paymentChannelType}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{inst.swiftCode || "-"}</TableCell>
                    <TableCell>{inst.active ? <Badge className="bg-green-100 text-green-700">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { 
                          setEditingInstitution(inst); 
                          setInstitutionForm({
                            ...inst,
                            name: inst.name || "",
                            shortName: inst.shortName || "",
                            code: inst.code || "",
                            swiftCode: inst.swiftCode || "",
                          }); 
                          setIsInstitutionOpen(true); 
                        }}><Pencil className="h-4 w-4" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteInst.mutate({ id: inst.id })}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search channels..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => { setEditingChannel(null); setChannelForm({ countryId: 1, code: "", name: "", description: "", chargeType: "FLAT", chargeRate: 0, minimumCharge: "0", maximumCharge: "0", hasThirdPartyApiSupport: false, applyTax: false, active: true }); setIsChannelOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Channel
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((ch: any) => (
              <Card key={ch.id} className="group hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ch.name}</CardTitle>
                    {ch.active ? <Badge className="bg-green-100 text-green-700">Live</Badge> : <Badge variant="secondary">Off</Badge>}
                  </div>
                  <CardDescription className="line-clamp-2">{ch.description || "No description provided"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="font-mono">{ch.code}</span>
                    <div className="flex gap-2">
                      {ch.applyTax && <Badge variant="outline" className="text-[10px]">Tax</Badge>}
                      {ch.hasThirdPartyApiSupport && <Badge variant="outline" className="text-[10px]">API</Badge>}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm font-medium">Charge: {ch.chargeRate}% <span className="text-slate-400 text-[10px] ml-1">({ch.chargeType})</span></div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { 
                        setEditingChannel(ch); 
                        setChannelForm({
                          ...ch,
                          name: ch.name || "",
                          description: ch.description || "",
                          code: ch.code || "",
                          minimumCharge: ch.minimumCharge || "0",
                          maximumCharge: ch.maximumCharge || "0",
                        }); 
                        setIsChannelOpen(true); 
                      }}>Settings</Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteChannel.mutate({ id: ch.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search branches..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => { setEditingBranch(null); setBranchForm({ paymentInstitutionId: institutions[0]?.id || 0, name: "", sortCode: "", description: "" }); setIsBranchOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Branch
            </Button>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Sort Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch: any) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{getInstitutionName(branch.paymentInstitutionId)}</TableCell>
                    <TableCell className="font-mono text-xs">{branch.sortCode}</TableCell>
                    <TableCell className="text-slate-500 text-sm max-w-xs truncate">{branch.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { 
                          setEditingBranch(branch); 
                          setBranchForm({
                            ...branch,
                            name: branch.name || "",
                            sortCode: branch.sortCode || "",
                            description: branch.description || "",
                          }); 
                          setIsBranchOpen(true); 
                        }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteBranch.mutate({ id: branch.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Institution Dialog */}
      <Dialog open={isInstitutionOpen} onOpenChange={setIsInstitutionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingInstitution ? "Edit Institution" : "Add Institution"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={institutionForm.name} onChange={(e) => setInstitutionForm({ ...institutionForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Short Name</Label>
                <Input value={institutionForm.shortName} onChange={(e) => setInstitutionForm({ ...institutionForm, shortName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={institutionForm.code} onChange={(e) => setInstitutionForm({ ...institutionForm, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Swift Code</Label>
                <Input value={institutionForm.swiftCode} onChange={(e) => setInstitutionForm({ ...institutionForm, swiftCode: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={String(institutionForm.countryId)} onValueChange={(v) => setInstitutionForm({ ...institutionForm, countryId: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={institutionForm.paymentChannelType} onValueChange={(v) => setInstitutionForm({ ...institutionForm, paymentChannelType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK">Bank</SelectItem>
                    <SelectItem value="WALLET">Wallet</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={institutionForm.active} onCheckedChange={(v) => setInstitutionForm({ ...institutionForm, active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => editingInstitution ? updateInst.mutate({ id: editingInstitution.id, data: institutionForm as any }) : addInst.mutate({ data: institutionForm as any })}>
              {editingInstitution ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Channel Dialog */}
      <Dialog open={isChannelOpen} onOpenChange={setIsChannelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingChannel ? "Edit Channel" : "Add Channel"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={channelForm.name} onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={channelForm.code} onChange={(e) => setChannelForm({ ...channelForm, code: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={channelForm.description} onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Charge Type</Label>
                <Select value={channelForm.chargeType} onValueChange={(v) => setChannelForm({ ...channelForm, chargeType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat Fee</SelectItem>
                    <SelectItem value="PERCENT">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Charge Rate</Label>
                <Input type="number" value={channelForm.chargeRate} onChange={(e) => setChannelForm({ ...channelForm, chargeRate: parseFloat(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Charge</Label>
                <Input value={channelForm.minimumCharge} onChange={(e) => setChannelForm({ ...channelForm, minimumCharge: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max Charge</Label>
                <Input value={channelForm.maximumCharge} onChange={(e) => setChannelForm({ ...channelForm, maximumCharge: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={channelForm.hasThirdPartyApiSupport} onCheckedChange={(v) => setChannelForm({ ...channelForm, hasThirdPartyApiSupport: v })} />
                <Label>API Support</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={channelForm.applyTax} onCheckedChange={(v) => setChannelForm({ ...channelForm, applyTax: v })} />
                <Label>Apply Tax</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={channelForm.active} onCheckedChange={(v) => setChannelForm({ ...channelForm, active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => editingChannel ? updateChannel.mutate({ id: editingChannel.id, data: channelForm as any }) : addChannel.mutate({ data: channelForm as any })}>
              {editingChannel ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branch Dialog */}
      <Dialog open={isBranchOpen} onOpenChange={setIsBranchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBranch ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Institution</Label>
              <Select 
                value={String(branchForm.paymentInstitutionId)} 
                onValueChange={(v) => setBranchForm({ ...branchForm, paymentInstitutionId: parseInt(v) })}
              >
                <SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger>
                <SelectContent>
                  {institutions.map((inst: any) => <SelectItem key={inst.id} value={String(inst.id)}>{inst.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch Name</Label>
                <Input value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sort Code</Label>
                <Input value={branchForm.sortCode} onChange={(e) => setBranchForm({ ...branchForm, sortCode: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={branchForm.description} onChange={(e) => setBranchForm({ ...branchForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => editingBranch ? updateBranch.mutate({ id: editingBranch.id, data: branchForm as any }) : addBranch.mutate({ data: branchForm as any })}>
              {editingBranch ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
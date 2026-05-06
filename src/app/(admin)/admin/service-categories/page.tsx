"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetOrganizationTypes } from "@/lib/generated/org/organization-types/organization-types";
import { Layers, Search, Loader2 } from "lucide-react";

export default function AdminServiceCategoriesPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { data: typesData, isLoading } = useGetOrganizationTypes({});
  const types = Array.isArray(typesData?.data) ? typesData.data : [];
  const filteredTypes = types.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-slate-900">Service Categories</h1><p className="text-slate-500">Manage organization types and categories</p></div>
      <Card><CardContent className="pt-6"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search categories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>All Categories</CardTitle><CardDescription>{filteredTypes.length} categories found</CardDescription></CardHeader>
        <CardContent>{isLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div> : <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Status</TableHead><TableHead>Admin</TableHead></TableRow></TableHeader>
          <TableBody>{filteredTypes.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500"><Layers className="h-8 w-8 mx-auto mb-2 text-slate-300" />No categories found</TableCell></TableRow> : filteredTypes.map((type) => (
            <TableRow key={type.id}><TableCell><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Layers className="h-5 w-5" /></div><div className="font-medium">{type.name}</div></div></TableCell><TableCell><code className="rounded bg-slate-100 px-2 py-1">{type.code || '-'}</code></TableCell><TableCell><Badge className={type.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>{type.active ? "Active" : "Inactive"}</Badge></TableCell><TableCell>{type.admin ? "Yes" : "No"}</TableCell></TableRow>))}</TableBody></Table>}</CardContent></Card>
    </div>
  );
}

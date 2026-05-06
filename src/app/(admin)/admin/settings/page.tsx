"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateSelf, useGetSelf } from "@/lib/generated/user/users/users";
import { useUpdateOwnOrganization } from "@/lib/generated/org/organizations/organizations";
import { Settings, Bell, Shield, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [formData, setFormData] = React.useState({ siteName: "KaizenAdmin", siteUrl: "https://kaizenAdmin.example.com", supportEmail: "support@example.com", emailNotifications: true, smsNotifications: false, marketingEmails: true, twoFactorRequired: false, sessionTimeout: "30", passwordExpiry: "90" });
  const { data: userData, isLoading: userLoading } = useGetSelf();
  const updateSelfMutation = useUpdateSelf();
  const updateOrgMutation = useUpdateOwnOrganization();

  React.useEffect(() => {
    const org = userData?.data?.organization;
    if (org) {
      setFormData(prev => ({ ...prev, siteName: String(org.name || prev.siteName) }));
    }
  }, [userData]);

  const handleSave = async () => {
    try {
      await updateSelfMutation.mutateAsync({ data: { firstName: formData.siteName } });
      toast.success("Settings saved successfully");
    } catch { toast.error("Failed to save settings"); }
  };

  if (userLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-slate-900">Settings</h1><p className="text-slate-500">Manage platform settings</p></div>
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList><TabsTrigger value="general">General</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger></TabsList>
        <TabsContent value="general"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />General Settings</CardTitle><CardDescription>Basic platform configuration</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-2"><Label>Site Name</Label><Input value={formData.siteName} onChange={(e) => setFormData({ ...formData, siteName: e.target.value })} /></div><div className="grid gap-2"><Label>Site URL</Label><Input value={formData.siteUrl} onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })} /></div><div className="grid gap-2"><Label>Support Email</Label><Input value={formData.supportEmail} onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })} /></div></CardContent></Card></TabsContent>
        <TabsContent value="notifications"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notification Settings</CardTitle><CardDescription>Configure notification preferences</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><div><Label>Email Notifications</Label><p className="text-sm text-slate-500">Send email notifications to users</p></div><Switch checked={formData.emailNotifications} onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })} /></div><div className="flex items-center justify-between"><div><Label>SMS Notifications</Label><p className="text-sm text-slate-500">Send SMS notifications to users</p></div><Switch checked={formData.smsNotifications} onCheckedChange={(checked) => setFormData({ ...formData, smsNotifications: checked })} /></div><div className="flex items-center justify-between"><div><Label>Marketing Emails</Label><p className="text-sm text-slate-500">Send marketing emails to users</p></div><Switch checked={formData.marketingEmails} onCheckedChange={(checked) => setFormData({ ...formData, marketingEmails: checked })} /></div></CardContent></Card></TabsContent>
        <TabsContent value="security"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Security Settings</CardTitle><CardDescription>Configure security options</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><div><Label>Two-Factor Authentication Required</Label><p className="text-sm text-slate-500">Require 2FA for all users</p></div><Switch checked={formData.twoFactorRequired} onCheckedChange={(checked) => setFormData({ ...formData, twoFactorRequired: checked })} /></div><div className="grid gap-2"><Label>Session Timeout (minutes)</Label><Input type="number" value={formData.sessionTimeout} onChange={(e) => setFormData({ ...formData, sessionTimeout: e.target.value })} /></div><div className="grid gap-2"><Label>Password Expiry (days)</Label><Input type="number" value={formData.passwordExpiry} onChange={(e) => setFormData({ ...formData, passwordExpiry: e.target.value })} /></div></CardContent></Card></TabsContent>
      </Tabs>
      <div className="flex justify-end"><Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSave} disabled={updateSelfMutation.isPending}>{updateSelfMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Settings</>}</Button></div>
    </div>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VendorStatus, VendorDesignation, PaymentTerms, OrderingMethod } from "@/lib/generated/kaizenAdmin/models";
import type { VendorCreate, Vendor } from "@/lib/generated/kaizenAdmin/models";
import { useListVendorCategoriesApiV1VendorsCategoriesGet } from "@/lib/generated/kaizenAdmin/vendors-v1/vendors-v1";
import { Store, User, CreditCard, ShieldCheck, Mail, Phone, Globe, MapPin, Loader2, Award, Plus, X, Paperclip, FileText } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import {
    VENDOR_DOCUMENT_TYPE,
    VENDOR_DOCUMENT_TYPE_LABELS,
    type VendorDocumentType,
    type VendorDocumentListItem,
} from "@/lib/vendor-documents";

/**
 * A file staged for upload to POST /api/v1/vendors/{vendor_id}/documents.
 * Uploads happen AFTER the vendor is created/updated — the parent handles
 * calling uploadVendorDocument() once it has the vendor_id.
 */
export interface PendingVendorDocument {
    file: File;
    document_type: VendorDocumentType;
    description?: string;
    is_required?: boolean;
}

const vendorSchema = z.object({
    company_name: z.string().min(1, "Company name is required"),
    email_address: z.string().email("Invalid email address"),
    phone_number: z.string().min(1, "Phone number is required"),
    website: z.string().url().optional().or(z.literal("")),
    primary_contact_name: z.string().optional(),
    primary_contact_title: z.string().optional(),
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    state_province: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
    general_lead_time: z.string().optional(),
    tax_id: z.string().optional(),
    vat_number: z.string().optional(),
    business_registration_number: z.string().optional(),
    bank_name: z.string().optional(),
    bank_account_number: z.string().optional(),
    bank_routing_number: z.string().optional(),
    swift_code: z.string().optional(),
    iban: z.string().optional(),
    payment_terms: z.nativeEnum(PaymentTerms).optional(),
    preferred_ordering_method: z.nativeEnum(OrderingMethod).optional(),
    designation: z.nativeEnum(VendorDesignation).optional(),
    categories: z.array(z.string()),
    certifications: z.array(z.string()),
    internal_notes: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

interface VendorFormProps {
    initialData?: Partial<Vendor>;
    /** Documents already uploaded to this vendor (edit mode). Rendered
     *  read-only with a delete button in the Documents tab. Parent owns
     *  the deletion flow; the form only emits the doc id via `onDeleteDocument`. */
    existingDocuments?: VendorDocumentListItem[];
    onSubmit: (data: VendorCreate, extras: { pendingDocuments: PendingVendorDocument[] }) => void;
    onCancel: () => void;
    onDeleteDocument?: (documentId: string) => void;
    isLoading?: boolean;
    /** True while the parent is uploading the pendingDocuments after save. */
    isUploading?: boolean;
}

export function VendorForm({
    initialData,
    existingDocuments = [],
    onSubmit,
    onCancel,
    onDeleteDocument,
    isLoading,
    isUploading,
}: VendorFormProps) {
    const { data: categoriesData } = useListVendorCategoriesApiV1VendorsCategoriesGet();

    const form = useForm<VendorFormValues>({
        resolver: zodResolver(vendorSchema),
        defaultValues: {
            company_name: initialData?.company_name || "",
            email_address: initialData?.email_address || "",
            phone_number: initialData?.phone_number || "",
            website: initialData?.website || "",
            primary_contact_name: (initialData?.primary_contact_name as string) || "",
            primary_contact_title: (initialData?.primary_contact_title as string) || "",
            address_line1: (initialData?.address_line1 as string) || "",
            address_line2: (initialData?.address_line2 as string) || "",
            city: (initialData?.city as string) || "",
            state_province: (initialData?.state_province as string) || "",
            postal_code: (initialData?.postal_code as string) || "",
            country: (initialData?.country as string) || "",
            general_lead_time: initialData?.general_lead_time || "",
            tax_id: (initialData?.tax_id as string) || "",
            vat_number: (initialData?.vat_number as string) || "",
            business_registration_number: (initialData?.business_registration_number as string) || "",
            bank_name: (initialData?.bank_name as string) || "",
            bank_account_number: (initialData?.bank_account_number as string) || "",
            bank_routing_number: (initialData?.bank_routing_number as string) || "",
            swift_code: (initialData?.swift_code as string) || "",
            iban: (initialData?.iban as string) || "",
            payment_terms: initialData?.payment_terms || PaymentTerms.net_30,
            preferred_ordering_method:
                (initialData?.preferred_ordering_method as OrderingMethod) || OrderingMethod.email,
            designation: initialData?.designation || VendorDesignation.trial,
            categories: initialData?.categories?.map(c => typeof c === 'string' ? c : c.id).filter((c): c is string => !!c) || [],
            certifications: (initialData?.certifications as string[]) || [],
            internal_notes: (initialData?.internal_notes as string) || "",
        },
    });

    const [certificationDraft, setCertificationDraft] = useState("");
    const [pendingDocuments, setPendingDocuments] = useState<PendingVendorDocument[]>([]);

    const addCertification = () => {
        const trimmed = certificationDraft.trim();
        if (!trimmed) return;
        const current = form.getValues("certifications") ?? [];
        if (current.includes(trimmed)) {
            setCertificationDraft("");
            return;
        }
        form.setValue("certifications", [...current, trimmed], { shouldDirty: true });
        setCertificationDraft("");
    };

    const removeCertification = (cert: string) => {
        const current = form.getValues("certifications") ?? [];
        form.setValue("certifications", current.filter((c) => c !== cert), { shouldDirty: true });
    };

    const handleCertificationKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addCertification();
        }
    };

    const handleFormSubmit = (values: VendorFormValues) => {
        onSubmit(values as unknown as VendorCreate, { pendingDocuments });
    };

    const addFiles = (files: FileList | null) => {
        if (!files) return;
        const newDocs: PendingVendorDocument[] = Array.from(files).map((f) => ({
            file: f,
            document_type: VENDOR_DOCUMENT_TYPE.other,
        }));
        setPendingDocuments((current) => [...current, ...newDocs]);
    };

    const removeFile = (index: number) => {
        setPendingDocuments((current) => current.filter((_, i) => i !== index));
    };

    const updatePendingType = (index: number, type: VendorDocumentType) => {
        setPendingDocuments((current) =>
            current.map((d, i) => (i === index ? { ...d, document_type: type } : d)),
        );
    };

    const updatePendingDescription = (index: number, description: string) => {
        setPendingDocuments((current) =>
            current.map((d, i) => (i === index ? { ...d, description: description || undefined } : d)),
        );
    };

    const toggleCategory = (categoryId: string) => {
        const current = form.getValues("categories") || [];
        if (current.includes(categoryId)) {
            form.setValue("categories", current.filter(id => id !== categoryId));
        } else {
            form.setValue("categories", [...current, categoryId]);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 h-auto">
                    <TabsTrigger value="general" className="gap-2">
                        <Store className="h-4 w-4" />
                        <span>General</span>
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="gap-2">
                        <User className="h-4 w-4" />
                        <span>Contact</span>
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Financial</span>
                    </TabsTrigger>
                    <TabsTrigger value="compliance" className="gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Compliance</span>
                    </TabsTrigger>
                </TabsList>
                        <TabsContent value="general" className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">Company Name <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <Store className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                        <Input id="company_name" className="pl-10" {...form.register("company_name")} placeholder="Acme Corporation" />
                                    </div>
                                    {form.formState.errors.company_name && <p className="text-xs text-destructive font-medium animate-in slide-in-from-top-1">{form.formState.errors.company_name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="general_lead_time">Lead Time</Label>
                                    <Input id="general_lead_time" {...form.register("general_lead_time")} placeholder="e.g., 3-5 business days" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="designation">Vendor Designation</Label>
                                    <Select value={form.watch("designation")} onValueChange={(value) => form.setValue("designation", value as VendorDesignation)}>
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder="Select designation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(VendorDesignation).map(d => (
                                                <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="preferred_ordering_method">Preferred Ordering Method</Label>
                                    <Select
                                        value={form.watch("preferred_ordering_method")}
                                        onValueChange={(value) =>
                                            form.setValue("preferred_ordering_method", value as OrderingMethod, {
                                                shouldDirty: true,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder="How to place orders" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={OrderingMethod.email}>Email</SelectItem>
                                            <SelectItem value={OrderingMethod.phone}>Phone</SelectItem>
                                            <SelectItem value={OrderingMethod.online}>Online portal</SelectItem>
                                            <SelectItem value={OrderingMethod.fax}>Fax</SelectItem>
                                            <SelectItem value={OrderingMethod.in_person}>In person</SelectItem>
                                            <SelectItem value={OrderingMethod.api}>API integration</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Categories</Label>
                                    <div className="flex flex-wrap gap-2 pt-1 border rounded-md p-3 bg-muted/20 min-h-[100px]">
                                        {categoriesData?.map((cat: any) => (
                                            <Badge
                                                key={cat.id}
                                                variant={form.watch("categories")?.includes(cat.id) ? "default" : "outline"}
                                                className="cursor-pointer transition-all active:scale-95"
                                                onClick={() => toggleCategory(cat.id)}
                                            >
                                                {cat.name}
                                            </Badge>
                                        ))}
                                        {!categoriesData && <p className="text-xs text-muted-foreground italic">Fetching categories...</p>}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="contact" className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                                <div className="space-y-2">
                                    <Label htmlFor="email_address">Email Address <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                        <Input id="email_address" className="pl-10" {...form.register("email_address")} placeholder="billing@acme.com" />
                                    </div>
                                    {form.formState.errors.email_address && <p className="text-xs text-destructive font-medium animate-in slide-in-from-top-1">{form.formState.errors.email_address.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone_number">Phone Number <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <Phone className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                        <Input id="phone_number" className="pl-10" {...form.register("phone_number")} placeholder="+1 (555) 000-0000" />
                                    </div>
                                    {form.formState.errors.phone_number && <p className="text-xs text-destructive font-medium animate-in slide-in-from-top-1">{form.formState.errors.phone_number.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <div className="relative">
                                        <Globe className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                        <Input id="website" className="pl-10" {...form.register("website")} placeholder="https://acme.com" />
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="primary_contact_name">Primary Contact Name</Label>
                                            <Input id="primary_contact_name" {...form.register("primary_contact_name")} placeholder="Jane Smith" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="primary_contact_title">Contact Title</Label>
                                            <Input id="primary_contact_title" {...form.register("primary_contact_title")} placeholder="Procurement Officer" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Address Information</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-xl p-4 bg-muted/10">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="address_line1">Address Line 1</Label>
                                            <div className="relative">
                                                <MapPin className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                                <Input id="address_line1" className="pl-10" {...form.register("address_line1")} placeholder="123 Supply Lane" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input id="city" {...form.register("city")} placeholder="New York" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input id="country" {...form.register("country")} placeholder="United States" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="financial" className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                                <div className="space-y-2">
                                    <Label htmlFor="payment_terms">Payment Terms</Label>
                                    <Select value={form.watch("payment_terms")} onValueChange={(value) => form.setValue("payment_terms", value as PaymentTerms)}>
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder="Select payment terms" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(PaymentTerms).map(pt => (
                                                <SelectItem key={pt} value={pt}>{pt.toUpperCase().replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Banking Details</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-xl p-4 bg-muted/10">
                                        <div className="space-y-2">
                                            <Label htmlFor="bank_name">Bank Name</Label>
                                            <Input id="bank_name" {...form.register("bank_name")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bank_account_number">Account Number</Label>
                                            <Input id="bank_account_number" {...form.register("bank_account_number")} />
                                        </div>
                                        <div className="space-y-2 text-xs sm:text-sm">
                                            <Label htmlFor="swift_code">SWIFT/BIC</Label>
                                            <Input id="swift_code" {...form.register("swift_code")} placeholder="ABCDEF12" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="iban">IBAN</Label>
                                            <Input id="iban" {...form.register("iban")} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="compliance" className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                                <div className="space-y-2">
                                    <Label htmlFor="business_registration_number">Bus. Registration #</Label>
                                    <Input id="business_registration_number" {...form.register("business_registration_number")} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tax_id">Tax ID / PIN</Label>
                                    <Input id="tax_id" {...form.register("tax_id")} />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Certifications</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Award className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                            <Input
                                                className="pl-10"
                                                value={certificationDraft}
                                                onChange={(e) => setCertificationDraft(e.target.value)}
                                                onKeyDown={handleCertificationKeyDown}
                                                placeholder="e.g. ISO 9001, SOC 2 Type II"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={addCertification}
                                            className="h-7 px-3 text-xs"
                                        >
                                            <Plus className="mr-1 h-3.5 w-3.5" />
                                            Add
                                        </Button>
                                    </div>
                                    {(form.watch("certifications")?.length ?? 0) > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {form.watch("certifications")?.map((cert) => (
                                                <Badge
                                                    key={cert}
                                                    variant="secondary"
                                                    className="pr-1 pl-2 py-1 text-xs"
                                                >
                                                    {cert}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCertification(cert)}
                                                        className="ml-1 rounded hover:bg-background/60 p-0.5 text-muted-foreground hover:text-foreground"
                                                        aria-label={`Remove ${cert}`}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground pt-1">
                                            No certifications added.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="vendor_documents">Supporting documents</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Paperclip className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                            <input
                                                id="vendor_documents"
                                                type="file"
                                                multiple
                                                onChange={(e) => {
                                                    addFiles(e.target.files);
                                                    e.target.value = "";
                                                }}
                                                disabled={isUploading}
                                                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm file:mr-3 file:py-0 file:px-3 file:rounded-md file:border-0 file:bg-accent file:text-sm file:font-medium file:text-foreground file:cursor-pointer cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        W-9, tax ID, business licenses, insurance certs, etc. Files upload after the vendor is saved.
                                    </p>

                                    {existingDocuments.length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Uploaded
                                            </Label>
                                            {existingDocuments.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="flex items-center justify-between gap-2 rounded-md border p-2"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm truncate">
                                                                {doc.filename ?? "Unnamed document"}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                                                {doc.document_type && (
                                                                    <span>
                                                                        {VENDOR_DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                                                                    </span>
                                                                )}
                                                                {doc.uploaded_at && (
                                                                    <span>
                                                                        · {new Date(doc.uploaded_at).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {onDeleteDocument && doc.id && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            className="text-destructive shrink-0"
                                                            onClick={() => onDeleteDocument(doc.id!)}
                                                            disabled={isUploading}
                                                            aria-label={`Delete ${doc.filename ?? "document"}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {pendingDocuments.length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            {pendingDocuments.map((doc, idx) => (
                                                <div
                                                    key={`pending-${idx}`}
                                                    className="rounded-md border p-3 space-y-2"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                            <span className="text-sm truncate">{doc.file.name}</span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            className="text-destructive shrink-0"
                                                            onClick={() => removeFile(idx)}
                                                            disabled={isUploading}
                                                            aria-label={`Remove ${doc.file.name}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        <Select
                                                            value={doc.document_type}
                                                            onValueChange={(v) =>
                                                                updatePendingType(idx, v as VendorDocumentType)
                                                            }
                                                            disabled={isUploading}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue placeholder="Document type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.entries(VENDOR_DOCUMENT_TYPE_LABELS).map(
                                                                    ([v, label]) => (
                                                                        <SelectItem key={v} value={v}>
                                                                            {label}
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            className="h-8 text-xs"
                                                            placeholder="Description (optional)"
                                                            value={doc.description ?? ""}
                                                            onChange={(e) =>
                                                                updatePendingDescription(idx, e.target.value)
                                                            }
                                                            disabled={isUploading}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="internal_notes">Internal Notes</Label>
                                    <Textarea id="internal_notes" {...form.register("internal_notes")} placeholder="Enter any private vendor notes or performance history..." className="min-h-[120px]" />
                                </div>
                            </div>
                        </TabsContent>
            </Tabs>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/60">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="shadow-xs active:scale-95 transition-transform">
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isUploading} className="shadow-md active:scale-95 transition-transform min-w-[140px]">
                    {isUploading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Uploading...</span>
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                        </div>
                    ) : (
                        initialData ? "Update Vendor" : "Create Vendor"
                    )}
                </Button>
            </div>
        </form>
    );
}

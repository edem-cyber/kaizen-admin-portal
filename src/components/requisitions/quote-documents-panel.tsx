"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, FileText, Upload, Loader2, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { Can, PERMISSION } from "@/lib/authorization";
import {
  listQuoteDocuments,
  uploadQuoteDocument,
  QUOTE_DOCUMENT_TYPE,
  QUOTE_DOCUMENT_TYPE_LABELS,
  type QuoteDocumentListItem,
  type QuoteDocumentType,
} from "@/lib/vendor-quotes";
import { deleteDocumentApiV1DocumentsDocumentIdDelete } from "@/lib/generated/requisition/documents-v1/documents-v1";
import { downloadDocument } from "@/lib/documents";
import { extractErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

interface QuoteDocumentsPanelProps {
  quoteId: string;
}

export function QuoteDocumentsPanel({ quoteId }: QuoteDocumentsPanelProps) {
  const [open, setOpen] = useState(true);
  const [documents, setDocuments] = useState<QuoteDocumentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<QuoteDocumentType>(QUOTE_DOCUMENT_TYPE.other);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listQuoteDocuments(quoteId);
      setDocuments(list);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to load quote documents"));
    } finally {
      setIsLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadQuoteDocument(quoteId, {
        file,
        document_type: docType,
        description: description.trim() || undefined,
      });
      toast.success("Document uploaded");
      setFile(null);
      setDescription("");
      setDocType(QUOTE_DOCUMENT_TYPE.other);
      await refresh();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to upload document"));
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteDocumentApiV1DocumentsDocumentIdDelete(deletingId);
      toast.success("Document deleted");
      setDeletingId(null);
      await refresh();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete document"));
    } finally {
      setIsDeleting(false);
    }
  };

  const count = documents.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span>Attachments</span>
            {count > 0 && <Badge variant="secondary" className="h-5">{count}</Badge>}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !open && "-rotate-90")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-4">
        <Can permission={PERMISSION.VENDORS_WRITE}>
          <div className="rounded-md border border-dashed p-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={isUploading}
                className="sm:col-span-3 text-xs"
              />
              <Select
                value={docType}
                onValueChange={(v) => setDocType(v as QuoteDocumentType)}
                disabled={isUploading}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUOTE_DOCUMENT_TYPE_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="sm:col-span-2 h-8 text-xs"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload
              </Button>
            </div>
          </div>
        </Can>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading documents…</p>
        ) : documents.length === 0 ? (
          <p className="text-xs text-muted-foreground">No documents attached to this quote.</p>
        ) : (
          <ul className="space-y-1.5">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-start justify-between gap-2 rounded-md border p-2.5"
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {doc.filename ?? "Unnamed document"}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      {doc.document_type && (
                        <Badge variant="secondary" className="font-normal">
                          {QUOTE_DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                        </Badge>
                      )}
                      {doc.is_required && (
                        <Badge variant="outline" className="font-normal border-amber-300 text-amber-700">
                          Required
                        </Badge>
                      )}
                      {doc.uploaded_at && (
                        <span>
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {doc.id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-primary"
                      onClick={() =>
                        downloadDocument(doc.id!, doc.filename ?? `document-${doc.id}`)
                      }
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Can permission={PERMISSION.VENDORS_WRITE}>
                    {doc.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive"
                        onClick={() => setDeletingId(doc.id!)}
                        aria-label={`Delete ${doc.filename ?? "document"}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </Can>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleContent>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(o) => {
          if (!o && !isDeleting) setDeletingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  );
}

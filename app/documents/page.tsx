"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const MAX_UPLOAD_SIZE_MB = 5;
const uploadSchema = z.object({ name: z.string().min(1), description: z.string().optional() });
type UploadFormData = z.infer<typeof uploadSchema>;
type DocumentItem = { id: string; name: string; mimeType: string; fileSize: number; uploadedBy: { name: string } };

async function fetchDocuments() {
  const response = await fetch("/api/documents?limit=100");
  if (!response.ok) throw new Error("Failed to load documents");
  return (await response.json()).data.documents as DocumentItem[];
}

export default function DocumentsPage() {
  const query = useQuery({ queryKey: ["documents"], queryFn: fetchDocuments, staleTime: 0, refetchInterval: 30_000 });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<UploadFormData>({ resolver: zodResolver(uploadSchema), defaultValues: { name: "", description: "" } });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Choose a file first");
      if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        throw new Error(`Ukuran file terlalu besar. Maksimal ${MAX_UPLOAD_SIZE_MB} MB.`);
      }
      const allowedExtensions = ["png", "jpg", "jpeg", "webp", "pdf", "doc", "docx", "xls", "xlsx", "txt"];
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!["image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain"].includes(file.type) && !allowedExtensions.includes(extension ?? "")) {
        throw new Error("Jenis file tidak didukung. Gunakan JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, atau TXT.");
      }
      const body = new FormData();
      body.set("file", file);
      body.set("name", data.name || file.name);
      body.set("description", data.description || "");
      const response = await fetch("/api/documents", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Upload failed");
    },
    onSuccess: () => { toast.success("Document uploaded"); setOpen(false); form.reset(); if (fileRef.current) fileRef.current.value = ""; queryClient.invalidateQueries({ queryKey: ["documents"] }); },
    onError: (error) => toast.error(error.message),
  });

  const onSubmit = (data: UploadFormData) => uploadMutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Documents</h1><p className="text-muted-foreground">Manage your files and documents.</p></div>
        <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Upload className="mr-2 h-4 w-4" /> Upload</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Upload Document</DialogTitle><DialogDescription>Upload file JPG/PNG/PDF/DOC maksimal {MAX_UPLOAD_SIZE_MB} MB.</DialogDescription></DialogHeader><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Document name" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Description" {...field} /></FormControl><FormMessage /></FormItem>} /><FormItem><FormLabel>File</FormLabel><Input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt" required /></FormItem><Button type="submit" disabled={uploadMutation.isPending}>{uploadMutation.isPending ? "Uploading..." : "Upload"}</Button></form></Form></DialogContent></Dialog>
      </div>

      {query.isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : query.data && query.data.length > 0 ? (
        <div className="space-y-2">{query.data.map((doc) => (
          <Card key={doc.id} className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-muted-foreground" /><div><p className="font-medium">{doc.name}</p><p className="text-sm text-muted-foreground">Uploaded by {doc.uploadedBy.name} • {(doc.fileSize / 1024).toFixed(1)} KB</p></div></div><a href={`/api/documents/${doc.id}/download`} download={doc.name}><Button type="button" variant="ghost" size="icon" aria-label={`Download ${doc.name}`}><Download className="h-4 w-4" /></Button></a></Card>
        ))}</div>
      ) : (
        <Card className="p-8 text-center"><FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No documents found.</p></Card>
      )}
    </div>
  );
}

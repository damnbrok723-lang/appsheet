"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

const uploadSchema = z.object({ name: z.string().min(1), description: z.string().optional() });
type UploadFormData = z.infer<typeof uploadSchema>;

async function fetchDocuments() {
  return [{ id: "1", name: "Q4 Report.pdf", mimeType: "application/pdf", fileSize: 1024000, uploadedBy: { name: "John Doe" }, createdAt: "2024-12-01" }];
}

export default function DocumentsPage() {
  const query = useQuery({ queryKey: ["documents"], queryFn: fetchDocuments, staleTime: 5 * 60 * 1000 });
  const [open, setOpen] = useState(false);

  const form = useForm<UploadFormData>({ resolver: zodResolver(uploadSchema), defaultValues: { name: "", description: "" } });

  const onSubmit = (data: UploadFormData) => { toast.success("Document uploaded!"); setOpen(false); form.reset(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Documents</h1><p className="text-muted-foreground">Manage your files and documents.</p></div>
        <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Upload className="mr-2 h-4 w-4" /> Upload</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Upload Document</DialogTitle><DialogDescription>Upload a new document to the system.</DialogDescription></DialogHeader><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Document name" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Description" {...field} /></FormControl><FormMessage /></FormItem>} /><Button type="submit">Upload</Button></form></Form></DialogContent></Dialog>
      </div>

      {query.isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : query.data && query.data.length > 0 ? (
        <div className="space-y-2">{query.data.map((doc) => (
          <Card key={doc.id} className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-muted-foreground" /><div><p className="font-medium">{doc.name}</p><p className="text-sm text-muted-foreground">Uploaded by {doc.uploadedBy.name} • {(doc.fileSize / 1024).toFixed(1)} KB</p></div></div><Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button></Card>
        ))}</div>
      ) : (
        <Card className="p-8 text-center"><FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No documents found.</p></Card>
      )}
    </div>
  );
}

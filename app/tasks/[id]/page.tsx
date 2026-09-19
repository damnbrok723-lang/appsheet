"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, CheckCircle, Paperclip } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type TaskComment = { id: string; comment: string; createdAt: string; user?: { name?: string } };
type TaskAttachment = { id: string; fileName: string; fileSize: number; mimeType: string; createdAt: string; user?: { name?: string } };
type TaskDetail = { id: string; title: string; description?: string; priority: string; status: string; dueDate?: string; createdBy: { name: string }; assignedTo?: { name: string }; comments: TaskComment[]; attachments: TaskAttachment[] };

async function fetchTask(id: string) {
  const response = await fetch(`/api/tasks/${id}`);
  if (!response.ok) throw new Error("Unable to load task");
  return (await response.json()).data as TaskDetail;
}

async function updateTask(id: string, action: string) {
  const response = action === "complete"
    ? await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) })
    : await fetch(`/api/tasks/${id}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Action failed");
  return result.data;
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const taskQuery = useQuery({ queryKey: ["task", params.id], queryFn: () => fetchTask(params.id), staleTime: 0, refetchInterval: 30_000 });
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);
  const actionMutation = useMutation({
    mutationFn: (action: string) => updateTask(params.id, action),
    onSuccess: () => { toast.success("Task updated"); queryClient.invalidateQueries({ queryKey: ["task", params.id] }); },
    onError: (error) => toast.error(error.message),
  });
  const commentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${params.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Comment failed");
      return result.data;
    },
    onSuccess: () => { setComment(""); toast.success("Comment added"); queryClient.invalidateQueries({ queryKey: ["task", params.id] }); },
    onError: (error) => toast.error(error.message),
  });
  const attachmentMutation = useMutation({
    mutationFn: async () => { if (!attachment) throw new Error("Pilih file terlebih dahulu"); if (attachment.size > 5 * 1024 * 1024) throw new Error("Ukuran file terlalu besar. Maksimal 5 MB."); const allowedExtensions = ["png", "jpg", "jpeg", "webp", "pdf", "doc", "docx", "xls", "xlsx", "txt"]; const extension = attachment.name.split(".").pop()?.toLowerCase(); if (!["image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain"].includes(attachment.type) && !allowedExtensions.includes(extension ?? "")) { throw new Error("Jenis file tidak didukung. Gunakan JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, atau TXT."); } const body = new FormData(); body.set("file", attachment); const response = await fetch(`/api/tasks/${params.id}/attachments`, { method: "POST", body }); const result = await response.json(); if (!response.ok) throw new Error(result.message || "Upload gagal"); },
    onSuccess: () => { setAttachment(null); toast.success("Lampiran task tersimpan"); queryClient.invalidateQueries({ queryKey: ["task", params.id] }); },
    onError: (error) => toast.error(error.message),
  });

  function submitComment(event: FormEvent) { event.preventDefault(); if (comment.trim()) commentMutation.mutate(); }

  if (taskQuery.isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;
  }

  const task = taskQuery.data;
  if (!task) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8 text-center"><h2 className="text-xl font-bold mb-2">Task not found</h2><p className="text-muted-foreground mb-4">The task you&apos;re looking for doesn&apos;t exist.</p><Link href="/tasks"><Button>Back to Tasks</Button></Link></Card>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tasks"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="destructive">{task.priority}</Badge>
            <Badge variant="outline">{task.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Task Details</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{task.description}</p>
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="font-medium">Assigned to:</span> {task.assignedTo?.name}</p>
                <p><span className="font-medium">Created by:</span> {task.createdBy.name}</p>
                <p><span className="font-medium">Due date:</span> {task.dueDate}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Paperclip className="h-5 w-5" /> Lampiran Task</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">{task.attachments?.length ? task.attachments.map((file) => { const url = `/api/tasks/${task.id}/attachments/${file.id}`; const isImage = file.mimeType.startsWith("image/"); return <div key={file.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"><span className="min-w-0 truncate">{file.fileName}<span className="ml-2 text-xs text-muted-foreground">{(file.fileSize / 1024).toFixed(1)} KB</span></span><div className="flex shrink-0 gap-2">{isImage && <Button type="button" variant="outline" size="sm" onClick={() => setPreview({ name: file.fileName, url })}>Preview</Button>}<a href={url} className="rounded-md px-3 py-2 text-primary hover:bg-accent">Download</a></div></div>; }) : <p className="text-sm text-muted-foreground">Belum ada lampiran.</p>}</div>
              <div className="flex flex-wrap items-center gap-2"><input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} /><Button type="button" onClick={() => attachmentMutation.mutate()} disabled={!attachment || attachmentMutation.isPending}>{attachmentMutation.isPending ? "Uploading..." : "Upload ke task"}</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Comments</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-xs font-bold">{comment.user?.name?.[0] ?? "U"}</span></div>
                    <div><p className="text-sm">{comment.comment}</p><p className="text-xs text-muted-foreground mt-1">{comment.user?.name ?? "User"} · {new Date(comment.createdAt).toLocaleString("id-ID")}</p></div>
                  </div>
                ))}
              </div>
              <form onSubmit={submitComment} className="mt-4 flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} type="text" placeholder="Add a comment..." className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /><Button size="sm" type="submit" disabled={commentMutation.isPending}>Send</Button></form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Workflow Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {task.status === "ASSIGNED" && <Button className="w-full" variant="outline" onClick={() => actionMutation.mutate("accept")} disabled={actionMutation.isPending}><CheckCircle className="mr-2 h-4 w-4" /> Accept</Button>}
              {task.status === "ACCEPTED" && <Button className="w-full" variant="outline" onClick={() => actionMutation.mutate("start")} disabled={actionMutation.isPending}><CheckCircle className="mr-2 h-4 w-4" /> Start</Button>}
              {task.status === "IN_PROGRESS" && <Button className="w-full" variant="outline" onClick={() => actionMutation.mutate("submit")} disabled={actionMutation.isPending}><CheckCircle className="mr-2 h-4 w-4" /> Send for Review</Button>}
              {task.status === "WAITING_REVIEW" && <><Button className="w-full" variant="outline" onClick={() => actionMutation.mutate("approve")} disabled={actionMutation.isPending}><CheckCircle className="mr-2 h-4 w-4" /> Approve</Button><Button className="w-full" variant="outline" onClick={() => actionMutation.mutate("revision")} disabled={actionMutation.isPending}>Request Revision</Button><Button className="w-full" variant="destructive" onClick={() => actionMutation.mutate("block")} disabled={actionMutation.isPending}>Mark as Blocked</Button></>}
              {task.status === "APPROVED" && <Button className="w-full" variant="outline" onClick={() => actionMutation.mutate("complete")} disabled={actionMutation.isPending}><CheckCircle className="mr-2 h-4 w-4" /> Complete</Button>}
              {task.status === "REVISION" && <Button className="w-full" variant="outline" onClick={() => actionMutation.mutate("submit")} disabled={actionMutation.isPending}>Send for Review</Button>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    {preview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" onClick={() => setPreview(null)}><div className="relative max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}><img src={preview.url} alt={preview.name} className="max-h-[85vh] max-w-full rounded-lg object-contain" /><Button type="button" variant="secondary" className="absolute right-2 top-2" onClick={() => setPreview(null)}>Tutup</Button></div></div>}
    </>
  );
}

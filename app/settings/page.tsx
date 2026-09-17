import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Keep your personal workspace preferences in one place.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Workspace access</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div><p className="font-medium">Shared workspace</p><p className="text-sm text-muted-foreground">People with an account can see shared tasks, events, and members.</p></div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Enabled</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div><p className="font-medium">Private by default</p><p className="text-sm text-muted-foreground">Only signed-in members can access this workspace.</p></div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Enabled</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

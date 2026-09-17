import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const name = session?.user?.name ?? "Workspace member";
  const email = session?.user?.email ?? "No email available";
  const role = (session?.user as { role?: string } | undefined)?.role ?? "MEMBER";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your identity in this shared workspace.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Account details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{name}</p></div>
          <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{email}</p></div>
          <div><p className="text-sm text-muted-foreground">Workspace role</p><p className="font-medium">{role}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}

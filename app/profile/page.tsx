import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, UserCheck } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const name = session?.user?.name ?? "Workspace member";
  const email = session?.user?.email ?? "No email available";
  const role = (session?.user as { role?: string } | undefined)?.role ?? "MEMBER";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil Pengguna</h1>
        <p className="text-muted-foreground">Informasi akun dan akses role Anda di OfficeHub.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Detail Akun & Peran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Nama Lengkap</p>
              <p className="font-semibold text-foreground text-base mt-0.5">{name}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Alamat Email</p>
              <p className="font-semibold text-foreground text-base mt-0.5">{email}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Peran / Workspace Role</p>
              <span className="mt-1 inline-block rounded-md bg-primary/10 px-2.5 py-1 text-xs font-extrabold text-primary">
                {role}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <form action="/api/auth/logout" method="POST">
              <Button type="submit" variant="destructive" className="w-full sm:w-auto font-semibold">
                <LogOut className="mr-2 h-4 w-4" />
                Keluar Akun / Logout
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

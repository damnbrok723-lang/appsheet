"use client";

import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Private workspace</CardTitle>
          <CardDescription>Accounts are created by your OfficeHub administrator.</CardDescription>
        </CardHeader>
        <CardContent><Link href="/login" className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Back to sign in</Link></CardContent>
      </Card>
    </div>
  );
}

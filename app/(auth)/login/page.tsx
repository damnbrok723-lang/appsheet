"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (!result?.error) {
        toast.success("Login berhasil");
        router.replace("/dashboard");
      } else {
        toast.error("Email atau kata sandi tidak valid");
      }
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Selamat datang kembali</CardTitle>
          <CardDescription>Masuk ke akun OfficeHub Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-4">
            <label className="block space-y-2 text-sm font-medium">Email<Input name="email" type="email" placeholder="nama@perusahaan.com" autoComplete="email" required /></label>
            <label className="block space-y-2 text-sm font-medium">Kata sandi<div className="relative"><Input name="password" type={showPassword ? "text" : "password"} placeholder="Masukkan kata sandi" autoComplete="current-password" minLength={6} required className="pr-10" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isLoading ? "Memproses..." : "Masuk"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

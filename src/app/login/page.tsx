"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Paintbrush, Lock, User, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await loginAction({ username, password });
      if (!res.success) {
        setError(res.error || "Gagal masuk");
      } else if (res.redirectUrl) {
        router.push(res.redirectUrl);
      }
    } catch {
      setError("Terjadi kesalahan jaringan atau server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-muted/40">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-lg border-muted">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Paintbrush className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Sumber Rejeki POS
          </CardTitle>
          <CardDescription>
            Sistem Manajemen Toko Cat & Bahan Bangunan
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-2">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full h-10 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk ke Sistem"
              )}
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              Akun default: <strong>owner</strong> / <strong>owner123</strong> atau <strong>kasir</strong> / <strong>kasir123</strong>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

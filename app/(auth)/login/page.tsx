"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@nexus.io");
  const [password, setPassword] = useState("Password123!");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back to Nexus Workspace!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-lg border">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xl shadow-md">
            N
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Nexus Workspace</CardTitle>
          <CardDescription>
            Enter your credentials to access your task & project management workspace.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Demo Quick Fill Helper */}
            <div className="pt-2 border-t">
              <p className="text-[11px] text-muted-foreground font-medium mb-2">
                Click demo credentials to test roles:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 justify-start"
                  onClick={() => handleQuickLogin("admin@nexus.io")}
                >
                  <span className="font-semibold text-primary mr-1">Admin:</span> admin@nexus.io
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 justify-start"
                  onClick={() => handleQuickLogin("sarah.miller@nexus.io")}
                >
                  <span className="font-semibold text-emerald-500 mr-1">Sales:</span> sarah@nexus.io
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Don&apos;t have an organization workspace?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Create new workspace
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

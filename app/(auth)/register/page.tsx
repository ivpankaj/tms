"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Mail,
  Lock,
  Building2,
  User,
  RotateCw,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

type RegistrationStep = "email" | "otp" | "details";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  // Step state
  const [step, setStep] = useState<RegistrationStep>("email");

  // Form states
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userExists, setUserExists] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // OTP input refs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check query params for Google OAuth errors
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "google_not_configured") {
      setAuthError(
        "Google Sign-Up is not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file."
      );
      toast.error("Google Sign-Up not configured yet in .env");
    } else if (errorParam) {
      setAuthError(`Registration error: ${errorParam.replace(/_/g, " ")}`);
    }
  }, [searchParams]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Auto-focus first OTP slot when entering OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle Google OAuth Sign Up
  const handleGoogleSignUp = () => {
    setIsGoogleLoading(true);
    window.location.href = "/api/auth/google";
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e?: React.FormEvent, isResend = false) => {
    if (e) e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setAuthError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    setUserExists(false);

    try {
      const res = await fetch("/api/auth/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (res.status === 409 || data.error?.code === "USER_EXISTS") {
        setUserExists(true);
        setAuthError(data.error?.message || "An account with this email already exists.");
        toast.error("Account already exists. Please sign in.");
        return;
      }

      if (!res.ok || !data.success) {
        const errorMsg = data.error?.message || "Failed to send verification code";
        setAuthError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.success(
        isResend
          ? "A new verification code has been sent to your email."
          : "Verification code sent! Please check your inbox."
      );
      setStep("otp");
      setResendTimer(60);
      setOtpDigits(["", "", "", "", "", ""]);
    } catch (err: any) {
      setAuthError(err.message || "Network error while sending verification code");
      toast.error(err.message || "Network error while sending verification code");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Input Changes
  const handleOtpChange = (index: number, value: string) => {
    // If pasted full OTP or multi-character string
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otpDigits];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtpDigits(newOtp);

      const focusIdx = Math.min(digits.length, 5);
      otpInputRefs.current[focusIdx]?.focus();

      if (digits.length === 6) {
        verifyOtpCode(digits.join(""));
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    // Move to next input if filled
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 filled
    if (digit && index === 5 && newOtp.every((d) => d !== "")) {
      verifyOtpCode(newOtp.join(""));
    }
  };

  // OTP Input Key Navigation (Backspace & Arrows)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const verifyOtpCode = async (codeToVerify?: string) => {
    const fullOtp = codeToVerify || otpDigits.join("");
    if (fullOtp.length !== 6) {
      setAuthError("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/auth/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: fullOtp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.error?.message || "Invalid or expired verification code");
        toast.error(data.error?.message || "Invalid verification code");
        return;
      }

      setVerificationToken(data.data.verificationToken);
      toast.success("Email verified successfully!");

      // Pre-fill workspace name suggestion if empty
      if (!organizationName) {
        const domain = email.split("@")[1]?.split(".")[0];
        if (domain && domain !== "gmail" && domain !== "yahoo" && domain !== "outlook" && domain !== "hotmail") {
          setOrganizationName(`${domain.charAt(0).toUpperCase() + domain.slice(1)} Workspace`);
        } else {
          setOrganizationName("My Workspace");
        }
      }

      setStep("details");
    } catch (err: any) {
      setAuthError(err.message || "Failed to verify code");
      toast.error(err.message || "Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Complete Account Setup & Set Password
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setAuthError("Please enter your full name.");
      toast.error("Please enter your full name.");
      return;
    }

    if (!organizationName.trim()) {
      setAuthError("Please enter a workspace or organization name.");
      toast.error("Please enter a workspace name.");
      return;
    }

    if (!password) {
      setAuthError("Please enter a password.");
      toast.error("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match. Please verify both fields.");
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await register({
        name: name.trim(),
        organizationName: organizationName.trim(),
        email: email.trim().toLowerCase(),
        password,
        verificationToken: verificationToken || undefined,
      });

      if (res.success) {
        toast.success("Workspace created successfully! Welcome to Cookmywork.");
        router.push("/");
      } else {
        setAuthError(res.error || "Registration failed");
        toast.error(res.error || "Registration failed");
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred during setup");
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border my-auto transition-all duration-300">
      {/* ========================================================================= */}
      {/* STEP 1: WELCOME & EMAIL INPUT                                             */}
      {/* ========================================================================= */}
      {step === "email" && (
        <>
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-linear-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-black text-2xl shadow-md ring-1 ring-primary/20">
              C
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Create Workspace</CardTitle>
            <CardDescription className="text-sm">
              Get started with your free Cookmywork project workspace
            </CardDescription>
          </CardHeader>

          <div className="px-6 space-y-4">
            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 gap-2.5 font-medium border-border/80 hover:bg-muted/60 transition-colors shadow-2xs cursor-pointer text-sm"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </Button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1">
              <span className="w-full border-t border-border/70" />
              <span className="bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold absolute">
                or enter your email
              </span>
            </div>

            {/* Error / User Exists Alert Message */}
            {authError && (
              <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authError}</span>
                </div>
                {userExists && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs border-destructive/30 hover:bg-destructive/10 text-destructive font-medium cursor-pointer"
                    onClick={() => router.push(`/login?email=${encodeURIComponent(email)}`)}
                  >
                    Sign in to your existing account
                  </Button>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSendOtp}>
            <CardContent className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label htmlFor="workEmail" className="text-xs font-semibold">
                  Work Email
                </Label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                  <Input
                    id="workEmail"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (authError) setAuthError(null);
                      if (userExists) setUserExists(false);
                    }}
                    required
                    autoFocus
                    autoComplete="email"
                    className="pl-9 h-10"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  We will send a 6-digit verification code to confirm your email.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-1 pb-6">
              <Button
                type="submit"
                className="w-full h-10 gap-2 cursor-pointer font-medium"
                disabled={isLoading || isGoogleLoading || !email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending Code...
                  </>
                ) : (
                  <>
                    Continue with Email <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground pt-1">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: 6-DIGIT OTP VERIFICATION                                         */}
      {/* ========================================================================= */}
      {step === "otp" && (
        <>
          <CardHeader className="space-y-2 text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs ring-1 ring-primary/20">
              <Mail className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Check your email</CardTitle>
            <CardDescription className="text-xs">
              We sent a 6-digit verification code to{" "}
              <span className="font-semibold text-foreground">{email}</span>
            </CardDescription>
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                onClick={() => {
                  setStep("email");
                  setAuthError(null);
                }}
              >
                <ArrowLeft className="h-3 w-3" /> Wrong email? Change
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Error Message */}
            {authError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {/* 6 OTP Boxes */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold block text-center">
                Enter 6-digit Code
              </Label>
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={isLoading}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-lg border border-border bg-background shadow-2xs focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all text-foreground"
                  />
                ))}
              </div>
            </div>

            {/* Resend Action */}
            <div className="text-center pt-2">
              {resendTimer > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Didn&apos;t receive code? Resend in{" "}
                  <span className="font-semibold text-foreground font-mono">{resendTimer}s</span>
                </p>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-primary font-medium hover:underline cursor-pointer"
                  onClick={() => handleSendOtp(undefined, true)}
                  disabled={isLoading}
                >
                  <RotateCw className="h-3 w-3" /> Resend verification code
                </Button>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2 pb-6">
            <Button
              type="button"
              className="w-full h-10 gap-2 cursor-pointer font-medium"
              onClick={() => verifyOtpCode()}
              disabled={isLoading || otpDigits.some((d) => !d)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying Code...
                </>
              ) : (
                <>
                  Verify Code <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: CREATE PASSWORD & WORKSPACE ONBOARDING                            */}
      {/* ========================================================================= */}
      {step === "details" && (
        <>
          <CardHeader className="space-y-2 text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Create your password</CardTitle>
            <CardDescription className="text-xs">
              Email verified! Finish setting up your Cookmywork workspace.
            </CardDescription>
          </CardHeader>

          {authError && (
            <div className="mx-6 mb-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{authError}</span>
            </div>
          )}

          <form onSubmit={handleCompleteRegistration}>
            <CardContent className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold">
                  Your Full Name
                </Label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    autoComplete="name"
                    className="pl-9 h-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orgName" className="text-xs font-semibold">
                  Workspace / Organization Name
                </Label>
                <div className="relative">
                  <Building2 className="h-4 w-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                  <Input
                    id="orgName"
                    type="text"
                    placeholder="e.g. Acme Studio, TechCorp"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    className="pl-9 h-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Create Password
                </Label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pl-9 pr-10 h-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Minimum 6 characters</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pl-9 pr-10 h-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-3 pb-6">
              <Button
                type="submit"
                className="w-full h-10 gap-2 cursor-pointer font-medium"
                disabled={isLoading || !name || !organizationName || !password || !confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating Workspace...
                  </>
                ) : (
                  <>
                    Complete Setup & Launch Dashboard <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-[11px] text-muted-foreground leading-relaxed px-2">
                By clicking Complete Setup, you agree to our Terms of Service and Privacy Policy.
              </p>
            </CardFooter>
          </form>
        </>
      )}
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-dvh min-h-screen w-full flex flex-col items-center justify-center py-8 px-4 sm:py-12 bg-muted/20 overflow-y-auto">
      <Suspense
        fallback={
          <Card className="w-full max-w-md p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </Card>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/lib/generated/user/auth/auth";
import { accountCheck } from "@/lib/generated/user/users/users";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { isPlatformAdmin } from "@/lib/authorization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicPageLayout } from "@/components/layout/public-layout";
import { loginSchema } from "@/lib/validations/auth";
import type { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, isLoading: authLoading, devLoginAs } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, authLoading, router]);

  const testAccounts = [
    { username: "admin", password: "taEj4aAetTv5T3Sv", isAdmin: true },
    { username: "testuser1", password: "F00b@rrr" },
    { username: "ebotest1", password: "F00b@rrr" },
  ];

  const handleTestAccountLogin = (username: string, password: string) => {
    loginMutation.mutate({ data: { username, password } });
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    trigger,
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const accountCheckMutation = useMutation({
    mutationFn: (username: string) => accountCheck({ username }),
    onSuccess: (data) => {
      if (data.data?.exists) {
        setStep(2);
        setErrorMessage(null);
      } else {
        setErrorMessage("Account not found. Please check your username or sign up.");
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setErrorMessage(err?.response?.data?.message || "Error checking account. Please try again.");
    },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        setAuth(data.access_token, data.user, data.refresh_token);
        if (isPlatformAdmin(data.user)) {
          router.push("/admin");
        } else {
          router.push("/admin");
        }
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } } };
        setErrorMessage(err?.response?.data?.message || "Invalid credentials. Please try again.");
      },
    },
  });

  const onNextStep = async () => {
    const isValid = await trigger("username");
    if (!isValid) return;
    const val = getValues("username");
    setUsername(val);
    accountCheckMutation.mutate(val);
  };

  const onSubmit = async (data: LoginFormData) => {
    if (step === 1) {
      await onNextStep();
    } else {
      loginMutation.mutate({ data: { username: data.username, password: data.password } });
    }
  };

  if (authLoading) return null;

  return (
    <PublicPageLayout showNavbar={false} showFooter={false}>
      <div className="flex min-h-screen w-full bg-white lg:flex-row-reverse">
        {/* Right side - Login Form (visually) */}
        <div className="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:w-1/2 lg:flex-none lg:px-20 xl:px-24 z-10">
          <div className="mx-auto w-full max-w-md space-y-8">
            <div className="text-left">
              <Link href="/" className="inline-flex items-center justify-center mb-8">
                <Image src="/logovar6.svg" alt="Kaizen Admin" width={100} height={100} className="h-16 w-auto" priority />
              </Link>
              <h1 className="text-4xl font-bold tracking-tight text-black">
                {step === 1 ? "Welcome back" : "Enter password"}
              </h1>
              <p className="mt-3 text-base text-[#4A4A4A]">
                {step === 1 ? "Sign in to account to continue" : `Enter password for ${getValues("username")}`}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {errorMessage && (
                <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              {step === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input id="username" type="text" placeholder="Username or email" {...register("username")} disabled={accountCheckMutation.isPending || isSubmitting} className={`h-12 rounded-xl border-black/10 text-black ${errors.username ? "border-destructive" : ""}`} />
                    {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                  </div>
                  <Button type="button" onClick={onNextStep} className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-full h-12 transition-all active:scale-95" disabled={accountCheckMutation.isPending || isSubmitting}>
                    {accountCheckMutation.isPending ? (<div className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />Checking...</div>) : "Next"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoFocus {...register("password")} disabled={loginMutation.isPending || isSubmitting} className={`h-12 rounded-xl border-black/10 text-black pr-10 ${errors.password ? "border-destructive" : ""}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none" tabIndex={-1}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setStep(1)} className="text-sm text-[#4A4A4A] hover:text-black font-medium">Change username</button>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">Forgot password?</Link>
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-full h-12 transition-all active:scale-95" disabled={loginMutation.isPending || isSubmitting}>
                    {loginMutation.isPending || isSubmitting ? (<div className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />Signing in...</div>) : "Sign in"}
                  </Button>
                </div>
              )}
            </form>

            <div className="text-center text-sm text-[#4A4A4A]">
              Don't have an account? <Link href="/signup" className="text-primary hover:underline font-semibold">Sign up</Link>
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-4 border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Dev Mode</span>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-amber-700 mb-2">Login with test accounts:</p>
                  <div className="space-y-2">
                    {testAccounts.map((account) => (
                      <Button key={account.username} type="button" variant="outline" onClick={() => handleTestAccountLogin(account.username, account.password)} disabled={loginMutation.isPending} className="w-full bg-white hover:bg-amber-100 text-amber-800 border-amber-300 font-medium h-10 justify-between">
                        <span>{account.username} {account.isAdmin && <span className="text-xs text-violet-600">(Admin)</span>}</span>
                        <span className="text-xs text-amber-500">tap to login</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-amber-200 pt-3">
                  <p className="text-xs text-amber-700 mb-2">Skip login when backend is unavailable</p>
                  <Button type="button" variant="outline" onClick={() => { devLoginAs(); router.push("/admin"); }} className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 font-medium h-10">Skip Login (Dev Only)</Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Left side - Image (visually) */}
        <div className="relative hidden w-0 flex-1 lg:block lg:w-1/2 overflow-hidden bg-black">
          <Image
            src="/signin-image.png"
            alt="Sign in featured image"
            fill
            className="absolute inset-0 h-full w-full object-cover object-left"
            priority
          />
          {/* Dark overlay for contrast */}
          <div className="absolute inset-0 bg-black/50 transition-opacity" />
          
          {/* Glassmorphic floating card */}
          <div className="absolute bottom-12 left-12 right-12 z-20 xl:left-24 xl:right-24">
            <div className="p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl overflow-hidden">
              {/* Refined subtle shine */}
              <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent" />
              
              <div className="relative space-y-5">
                <div className="flex gap-1 mb-2 text-white/90">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
                    </svg>
                  ))}
                </div>
                
                <h2 className="text-[26px] font-medium text-white tracking-tight leading-snug drop-shadow-sm">
                  {"\"The most elegant procurement platform we've ever used. It transformed our entire workflow overnight.\""}
                </h2>
                
                <div className="pt-2 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-linear-to-br from-white/30 to-white/10 flex items-center justify-center text-white font-medium border border-white/20 shadow-inner">
                    KA
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-medium text-sm drop-shadow-sm">Kwesi Arthur</span>
                    <span className="text-white/70 text-sm mt-0.5"> Director, TechFlow</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}
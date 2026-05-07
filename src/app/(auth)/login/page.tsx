"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/lib/generated/user/auth/auth";
import { useAuth } from "@/hooks/use-auth";
import { isPlatformAdmin } from "@/lib/authorization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validations/auth";
import type { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, devLoginAs } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
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
        const err = error as { response?: { data?: { message?: string; }; }; };
        setErrorMessage(err?.response?.data?.message || "Invalid credentials. Please try again.");
      },
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    loginMutation.mutate({ data: { username: data.username, password: data.password } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Image src="/logovar6.svg" alt="Kaizen Ace It" width={64} height={64} className="h-16 w-auto" priority />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Kaizen Ace It</h1>
          <p className="mt-1 text-sm text-[#4A4A4A]">Admin</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <Input
              id="username"
              type="text"
              placeholder="Username or email"
              {...register("username")}
              disabled={loginMutation.isPending}
              className={`h-12 rounded-xl border-black/10 text-black ${errors.username ? "border-destructive" : ""}`}
            />
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password")}
                disabled={loginMutation.isPending}
                className={`h-12 rounded-xl border-black/10 text-black pr-10 ${errors.password ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-full h-12 transition-all active:scale-95"
            disabled={loginMutation.isPending || isSubmitting}
          >
            {loginMutation.isPending || isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Signing in...
              </div>
            ) : "Sign in"}
          </Button>
        </form>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-3">Dev Mode</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => { devLoginAs(); router.push("/admin"); }}
              className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 font-medium h-10"
            >
              Skip Login (Dev Only)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

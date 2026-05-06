"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useAccountCheck } from "@/lib/generated/user/users/users";
import { useCheck } from "@/lib/generated/org/organizations/organizations";
import { useGetOrganizationTypesRegistry } from "@/lib/generated/org/organization-types/organization-types";
import { useGetCountries } from "@/lib/generated/org/countries/countries";
import { useOrganizationSelfSignup } from "@/lib/generated/org/organizations/organizations";
import type { OrganizationType } from "@/lib/generated/org/models";
import type { AxiosError } from "axios";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { showApiToast } from "@/lib/toast";
import { PublicPageLayout } from "@/components/layout/public-layout";


export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedOrgType, setSelectedOrgType] = useState<OrganizationType | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, authLoading, router]);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    organizationName: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    region: "",
    countryId: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [usernameDebounce, setUsernameDebounce] = useState("");
  const [orgNameDebounce, setOrgNameDebounce] = useState("");

  // Auto-fill dummy data on localhost
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const randomStr = Math.random().toString(36).substring(2, 8);
      setFormData((prev) => ({
        ...prev,
        email: "edem.agbakpe@outlook.com",
        username: `user_${randomStr}`,
        organizationName: `Org ${randomStr}`,
        firstName: "Test",
        lastName: "User",
        address: "123 Test St",
        city: "Test City",
        region: "Test Region",
      }));
    }
  }, []);

  // Fetch organization types and auto-select the first active one
  const { data: orgTypesData } = useGetOrganizationTypesRegistry({
    query: {},
  });

  useEffect(() => {
    if (orgTypesData?.data?.length) {
      const firstActive = orgTypesData.data.find((t) => t.active) ?? orgTypesData.data[0];
      setSelectedOrgType(firstActive);
    }
  }, [orgTypesData]);

  // Fetch countries
  const { data: countriesData } = useGetCountries(undefined, {
    query: {},
  });

  // Auto-select first country in development
  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      countriesData?.data?.length &&
      formData.countryId === 0
    ) {
      setFormData((prev) => ({
        ...prev,
        countryId: countriesData.data[0].id,
      }));
    }
  }, [countriesData, formData.countryId]);

  // Debounce username
  useEffect(() => {
    const timer = setTimeout(() => {
      setUsernameDebounce(formData.username);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  // Debounce organization name
  useEffect(() => {
    const timer = setTimeout(() => {
      setOrgNameDebounce(formData.organizationName);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.organizationName]);

  // Check username availability
  const usernameCheck = useAccountCheck(
    { username: usernameDebounce },
    {
      query: {
        enabled: usernameDebounce.length >= 3,
      },
    }
  );

  // Check organization name availability
  const orgNameCheck = useCheck(
    orgNameDebounce ? { name: orgNameDebounce } : undefined,
    {
      query: {
        enabled: orgNameDebounce.length >= 3,
      },
    }
  );

  const isUsernameAvailable = useMemo(() => {
    if (!usernameDebounce || usernameDebounce.length < 3) return null;
    if (usernameCheck.isLoading) return null;
    if (usernameCheck.error) return null;
    return usernameCheck.data?.data?.exists === false;
  }, [usernameCheck, usernameDebounce]);

  const isOrgNameAvailable = useMemo(() => {
    if (!orgNameDebounce || orgNameDebounce.length < 3) return null;
    if (orgNameCheck.isLoading) return null;
    if (orgNameCheck.error) return null;
    return orgNameCheck.data?.data?.nameExists === false;
  }, [orgNameCheck, orgNameDebounce]);

  // Signup mutation
  const signupMutation = useOrganizationSelfSignup({
    mutation: {
      onSuccess: () => {
        showApiToast(null, "Account created successfully! Please check your email to confirm your account.");
        router.push("/login");
      },
      onError: (error) => {
        const axiosError = error as AxiosError<{ message?: string; }>;
        showApiToast(axiosError);
        setError(
          axiosError?.response?.data?.message ||
          axiosError?.message ||
          "Failed to create account. Please try again."
        );
      },
    },
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);


    if (formData.username.length >= 3 && isUsernameAvailable === false) {
      setError("Username is already taken. Please choose a different username.");
      return;
    }

    if (formData.organizationName.length >= 3 && isOrgNameAvailable === false) {
      setError("Organization name is already taken. Please choose a different name.");
      return;
    }

    if (formData.username.length >= 3 && isUsernameAvailable === null && usernameCheck.isLoading) {
      setError("Please wait while we check username availability.");
      return;
    }

    if (formData.organizationName.length >= 3 && isOrgNameAvailable === null && orgNameCheck.isLoading) {
      setError("Please wait while we check organization name availability.");
      return;
    }

    if (!formData.countryId || formData.countryId === 0) {
      setError("Please select a country");
      return;
    }

    if (!formData.address.trim()) {
      setError("Address is required");
      return;
    }

    // Construct confirmation URL
    const confirmationUrl = `${window.location.origin}/otp-confirmation?username=${encodeURIComponent(formData.username)}`;

    // Submit signup
    signupMutation.mutate({
      data: {
        name: formData.organizationName,
        typeId: selectedOrgType?.id ?? 0,
        countryId: formData.countryId,
        address: formData.address,
        city: formData.city || null,
        region: formData.region || null,
        contactEmail: formData.email || null,
        adminProfile: {
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          emailAddress: formData.email || null,
          msisdn: null,
        },
        confirmationUrl,
      },
    });
  };

  if (authLoading) return null;

  // Signup Form
  return (
    <PublicPageLayout showNavbar={false} showFooter={false}>
      <div className="flex min-h-screen w-full bg-white lg:flex-row-reverse">
        {/* Right side - Signup Form (visually) */}
        <div className="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:w-1/2 lg:flex-none lg:px-20 xl:px-24 z-10">
          <div className="mx-auto w-full max-w-md space-y-8">
            <div className="text-left">
              <Link href="/" className="inline-flex items-center justify-center mb-8">
                <Image src="/logovar6.svg" alt="Kaizen Admin" width={100} height={100} className="h-16 w-auto" priority />
              </Link>
              <h1 className="text-4xl font-bold tracking-tight text-black">
                Create your account
              </h1>
              <p className="mt-3 text-base text-[#4A4A4A]">
                Fill in your details below to get started.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="h-12 rounded-xl border-black/10 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="h-12 rounded-xl border-black/10 text-black"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-12 rounded-xl border-black/10 text-black"
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className={`h-12 rounded-xl border-black/10 text-black pr-10 ${isUsernameAvailable === false ? "border-destructive" : isUsernameAvailable === true ? "border-green-500" : ""}`}
                  />
                  {formData.username.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameCheck.isLoading ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      ) : isUsernameAvailable === true ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : isUsernameAvailable === false ? (
                        <XCircle className="w-4 h-4 text-destructive" />
                      ) : null}
                    </div>
                  )}
                </div>
                {formData.username.length >= 3 && isUsernameAvailable === false && (
                  <p className="text-xs text-destructive">Username is already taken</p>
                )}
                {formData.username.length >= 3 && isUsernameAvailable === true && (
                  <p className="text-xs text-green-600">Username is available</p>
                )}
              </div>

              {/* Organization name */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="organizationName"
                    type="text"
                    placeholder="Organization name"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    required
                    className={`h-12 rounded-xl border-black/10 text-black pr-10 ${isOrgNameAvailable === false ? "border-destructive" : isOrgNameAvailable === true ? "border-green-500" : ""}`}
                  />
                  {formData.organizationName.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {orgNameCheck.isLoading ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      ) : isOrgNameAvailable === true ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : isOrgNameAvailable === false ? (
                        <XCircle className="w-4 h-4 text-destructive" />
                      ) : null}
                    </div>
                  )}
                </div>
                {formData.organizationName.length >= 3 && isOrgNameAvailable === false && (
                  <p className="text-xs text-destructive">Organization name is already taken</p>
                )}
                {formData.organizationName.length >= 3 && isOrgNameAvailable === true && (
                  <p className="text-xs text-green-600">Organization name is available</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Input
                  id="address"
                  type="text"
                  placeholder="Organization address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="h-12 rounded-xl border-black/10 text-black"
                />
              </div>

              {/* City / Region */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="city"
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-12 rounded-xl border-black/10 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="region"
                    type="text"
                    placeholder="Region / State"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="h-12 rounded-xl border-black/10 text-black"
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Select
                  value={formData.countryId ? String(formData.countryId) : ""}
                  onValueChange={(value) => setFormData({ ...formData, countryId: parseInt(value) })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-black/10 text-black bg-white w-full">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-black/10 max-h-60">
                    {countriesData?.data?.map((country) => (
                      <SelectItem
                        key={country.id}
                        value={String(country.id)}
                      >
                        {country.name || country.officialName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Terms and Conditions Agreement */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-black/20 text-primary focus:ring-primary"
                />
                <label htmlFor="terms" className="text-sm text-[#4A4A4A]">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline font-medium">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                disabled={signupMutation.isPending || !agreedToTerms}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-full h-12 transition-all active:scale-95"
              >
                {signupMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    Creating account...
                  </div>
                ) : "Create account"}
              </Button>
            </form>

            <div className="text-center text-sm text-[#4A4A4A]">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Left side - Image (visually) */}
        <div className="relative hidden w-0 flex-1 lg:block lg:w-1/2 overflow-hidden bg-black">
          <Image
            src="/signin-image.png"
            alt="Sign up featured image"
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
                  {"\"Join thousands of organizations streamlining their procurement process with our platform.\""}
                </h2>

                <div className="pt-2 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-linear-to-br from-white/30 to-white/10 flex items-center justify-center text-white font-medium border border-white/20 shadow-inner">
                    JD
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-medium text-sm drop-shadow-sm">John Doe</span>
                    <span className="text-white/70 text-sm mt-0.5">CEO, TechStart Inc.</span>
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
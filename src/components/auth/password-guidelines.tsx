"use client";

import { useGetDefaultPasswordPolicy } from "@/lib/generated/user/password-policies/password-policies";
import { CheckCircle2, XCircle } from "lucide-react";

interface PasswordGuidelinesProps {
    password?: string;
    showAlways?: boolean;
}

// Default password policy fallback
const DEFAULT_POLICY = {
    minLength: 8,
    minUppercaseCount: 1,
    minLowercaseCount: 1,
    minDigitCount: 1,
    minSymbolCount: 1,
};

export function PasswordGuidelines({ password = "", showAlways = false }: PasswordGuidelinesProps) {
    const { data: policyResponse, isLoading, error } = useGetDefaultPasswordPolicy({
        query: {
            retry: false, // Don't retry on auth pages
        },
    });

    interface TypedPolicy {
        minLength?: number;
        minUppercaseCount?: number;
        minLowercaseCount?: number;
        minDigitCount?: number;
        minSymbolCount?: number;
    }

    // Use default policy if API fails or returns no data
    const policy = (policyResponse?.data || DEFAULT_POLICY) as TypedPolicy;

    // Show loading state briefly, then show default if needed
    if (isLoading) {
        return (
            <div className="mt-2">
                <p className="text-sm text-muted-foreground">Loading password requirements...</p>
            </div>
        );
    }

    const getRequirements = () => {
        const rules = [];

        if (policy.minLength) {
            rules.push({
                label: `At least ${policy.minLength} characters`,
                met: password.length >= policy.minLength,
            });
        }

        if (policy.minUppercaseCount) {
            rules.push({
                label: `At least ${policy.minUppercaseCount} uppercase letter(s)`,
                met: (password.match(/[A-Z]/g) || []).length >= policy.minUppercaseCount,
            });
        }

        if (policy.minLowercaseCount) {
            rules.push({
                label: `At least ${policy.minLowercaseCount} lowercase letter(s)`,
                met: (password.match(/[a-z]/g) || []).length >= policy.minLowercaseCount,
            });
        }

        if (policy.minDigitCount) {
            rules.push({
                label: `At least ${policy.minDigitCount} number(s)`,
                met: (password.match(/[0-9]/g) || []).length >= policy.minDigitCount,
            });
        }

        if (policy.minSymbolCount) {
            rules.push({
                label: `At least ${policy.minSymbolCount} special character(s)`,
                met: (password.match(/[^A-Za-z0-9]/g) || []).length >= policy.minSymbolCount,
            });
        }

        return rules;
    };

    const requirements = getRequirements();

    if (requirements.length === 0) return null;

    return (
        <div className="mt-2 space-y-2">
            <p className="text-sm font-medium text-foreground">Password requirements:</p>
            <ul className="space-y-1">
                {requirements.map((req, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                        {req.met ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={req.met ? "text-green-600" : "text-muted-foreground"}>
                            {req.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

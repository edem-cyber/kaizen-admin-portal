"use client";

import { Fragment, useState, useEffect } from "react";
import { useConsentStore } from "@/lib/cookies/consent-store";
import { COOKIE_CATEGORIES, type CookieCategory } from "@/lib/cookies/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cookie, Settings, ShieldCheck, BarChart3, Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// CONSENT BANNER
// ============================================================================

export function CookieConsentBanner() {
  const { showBanner, hydrated, acceptAll, rejectAll, openSettings } = useConsentStore();
  const [delayPassed, setDelayPassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDelayPassed(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Don't render until hydrated, delay has passed, and banner should show
  if (!hydrated || !showBanner || !delayPassed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-3xl animate-in slide-in-from-bottom-4 duration-500">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 dark:border-slate-700/50 dark:bg-slate-900/95 dark:shadow-black/20">
          {/* Decorative gradient accent */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

          <div className="p-5 md:p-6">
            <div className="flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-violet-400/20 blur-md" />
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                      <Cookie className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Cookie Settings
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    We use cookies to improve your experience. Choose your preferences below or accept all to continue.
                  </p>
                </div>
              </div>

              {/* Quick options */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={acceptAll}
                  className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Accept All</span>
                </button>

                <button
                  onClick={rejectAll}
                  className="flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Essential Only
                </button>

                <button
                  onClick={openSettings}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-500"
                >
                  <Settings className="h-4 w-4" />
                  <span>Customize</span>
                </button>
              </div>

              {/* Footer note */}
              <p className="text-xs text-slate-500 dark:text-slate-500">
                By continuing, you agree to our{" "}
                <a href="/privacy" className="underline hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a href="/terms" className="underline hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Terms of Service
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COOKIE SETTINGS DIALOG
// ============================================================================

const categoryIcons: Record<CookieCategory, React.ElementType> = {
  essential: ShieldCheck,
  functional: Settings,
  analytics: BarChart3,
  marketing: Megaphone,
};

const categoryColors: Record<CookieCategory, { bg: string; icon: string; border: string; }> = {
  essential: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    icon: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  functional: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  analytics: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  marketing: {
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    icon: "bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-600 dark:text-fuchsia-400",
    border: "border-fuchsia-200 dark:border-fuchsia-800",
  },
};

export function CookieSettingsDialog() {
  const {
    settingsOpen,
    closeSettings,
    status,
    updateConsent,
    saveConsent,
    acceptAll,
    rejectAll,
  } = useConsentStore();

  const handleToggle = (category: CookieCategory, enabled: boolean) => {
    updateConsent({ [category]: enabled });
  };

  const handleSave = () => {
    saveConsent('settings');
  };

  return (
    <Dialog open={settingsOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Cookie className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Cookie Preferences</DialogTitle>
              <DialogDescription className="mt-1">
                Choose which cookies you want to accept
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {(Object.entries(COOKIE_CATEGORIES) as [CookieCategory, typeof COOKIE_CATEGORIES[CookieCategory]][]).map(
            ([category, config]) => {
              const Icon = categoryIcons[category];
              const isEnabled = status[category];
              const colors = categoryColors[category];

              return (
                <div
                  key={category}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border p-4 transition-all duration-200",
                    isEnabled
                      ? `${colors.bg} ${colors.border}`
                      : "border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                      isEnabled
                        ? colors.icon
                        : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {config.name}
                        </h4>
                        {config.required && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {config.description}
                      </p>
                    </div>

                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(category, checked)}
                      disabled={config.required}
                      aria-label={`Toggle ${config.name}`}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>

        <DialogFooter className="flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-between">
          <div className="flex flex-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={rejectAll}
              className="flex-1"
            >
              Essential Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={acceptAll}
              className="flex-1"
            >
              Accept All
            </Button>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 sm:flex-none"
          >
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// COMBINED PROVIDER COMPONENT
// ============================================================================

export function CookieConsentProvider() {
  return (
    <Fragment>
      <CookieConsentBanner />
      <CookieSettingsDialog />
    </Fragment>
  );
}
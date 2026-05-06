/**
 * Currency Selector Component
 * Amazon-style currency selection with flag, code, and name
 */

"use client";

import * as React from "react";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/lib/currency";
import type { CurrencyData } from "@/lib/currency";
import { AlertCircle } from "lucide-react";

interface CurrencySelectorProps {
  /** Show full currency name alongside code */
  showName?: boolean;
  /** Compact mode - just show flag and code */
  compact?: boolean;
  /** Trigger button variant */
  variant?: "default" | "outline" | "ghost" | "link";
  /** Trigger button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Additional class names */
  className?: string;
  /** Placeholder when no currency selected */
  placeholder?: string;
  /** Callback when currency changes */
  onCurrencyChange?: (currency: CurrencyData) => void;
  /** If set, only this currency can be selected (others are disabled) */
  allowedCurrency?: string;
}

/**
 * Currency Selector Component
 * 
 * @example
 * // Compact mode (default) - shows flag and code
 * <CurrencySelector />
 * 
 * // Full mode - shows flag, code, and name
 * <CurrencySelector showName />
 * 
 * // With change callback
 * <CurrencySelector onCurrencyChange={(c) => console.log(c.code)} />
 */
export function CurrencySelector({
  showName = false,
  compact = true,
  variant = "outline",
  size = "sm",
  className,
  placeholder = "Select currency",
  onCurrencyChange,
  allowedCurrency,
}: CurrencySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const {
    currency,
    availableCurrencies,
    isLoadingCurrencies,
    setCurrency,
    getFlag,
  } = useCurrency();

  // Pre-select allowed currency on mount
  React.useEffect(() => {
    if (allowedCurrency && currency.code !== allowedCurrency) {
      const allowed = availableCurrencies.find(c => c.code === allowedCurrency);
      if (allowed) {
        setCurrency({
          code: allowed.code,
          symbol: allowed.symbol,
          name: allowed.name,
          decimalPlaces: allowed.decimalPlaces ?? 2,
        });
      }
    }
  }, [allowedCurrency, availableCurrencies]);

  const handleSelect = (currencyData: CurrencyData) => {
    // If allowedCurrency is set, only allow that currency
    if (allowedCurrency && currencyData.code !== allowedCurrency) {
      return;
    }
    setCurrency({
      code: currencyData.code,
      symbol: currencyData.symbol,
      name: currencyData.name,
      decimalPlaces: currencyData.decimalPlaces ?? 2,
    });
    onCurrencyChange?.(currencyData);
    setOpen(false);
  };

  if (isLoadingCurrencies && availableCurrencies.length === 0) {
    return (
      <Skeleton className={cn("h-9 w-24", className)} />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          role="combobox"
          aria-expanded={open}
          aria-label="Select currency"
          className={cn(
            "gap-1.5 font-normal",
            compact ? "w-auto px-3" : "w-full justify-between",
            className
          )}
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="flex items-center gap-1.5">
            <span className="text-base">{getFlag(currency.code)}</span>
            <span className="font-medium">{currency.code}</span>
            {showName && (
              <span className="text-muted-foreground hidden sm:inline">
                ({currency.name})
              </span>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {availableCurrencies.map((c) => {
                const isDisabled = allowedCurrency && c.code !== allowedCurrency;
                return (
                  <CommandItem
                    key={c.code}
                    value={`${c.code} ${c.name}`}
                    onSelect={() => handleSelect(c)}
                    disabled={!!isDisabled}
                    className={cn(
                      "gap-2",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="text-lg">{getFlag(c.code)}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {c.code}
                        <span className="ml-2 text-muted-foreground">
                          {c.symbol}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {c.name}
                      </span>
                    </div>
                    {isDisabled && (
                      <span className="ml-auto text-[10px] text-slate-400">Coming soon</span>
                    )}
                    {!isDisabled && (
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          currency.code === c.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Currency Badge Component
 * Shows current currency as a small badge (for headers/toolbars)
 */
export function CurrencyBadge({
  className,
}: {
  className?: string;
}) {
  const { currency, getFlag } = useCurrency();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm",
        className
      )}
    >
      <span>{getFlag(currency.code)}</span>
      <span className="font-medium">{currency.code}</span>
    </div>
  );
}

/**
 * Currency Display Component
 * Shows an amount with proper formatting and currency
 */
export function CurrencyDisplay({
  amount,
  currencyCode,
  showCode = false,
  className,
}: {
  amount: number | string | null | undefined;
  currencyCode?: string;
  showCode?: boolean;
  className?: string;
}) {
  const { format, formatIntl, currency, getFlag } = useCurrency();

  // If a specific currency code is provided and it differs from current,
  // we show it with the flag
  if (currencyCode && currencyCode !== currency.code) {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        <span className="text-sm">{getFlag(currencyCode)}</span>
        <span>{formatIntl(amount)}</span>
        {showCode && (
          <span className="text-xs text-muted-foreground">{currencyCode}</span>
        )}
      </span>
    );
  }

  return (
    <span className={className}>
      {format(amount)}
      {showCode && (
        <span className="ml-1 text-xs text-muted-foreground">
          {currency.code}
        </span>
      )}
    </span>
  );
}

export default CurrencySelector;
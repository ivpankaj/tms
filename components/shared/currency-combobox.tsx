"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  WORLD_CURRENCIES,
  WorldCurrency,
  formatCurrencySample,
} from "@/lib/constants/currencies";

interface CurrencyComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CurrencyCombobox({
  value,
  onValueChange,
  className = "",
  disabled = false,
}: CurrencyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("All");

  // Find currently selected currency item
  const selectedItem = useMemo(() => {
    return (
      WORLD_CURRENCIES.find(
        (c) => c.code.toUpperCase() === (value || "").toUpperCase()
      ) ||
      WORLD_CURRENCIES.find((c) => c.code === "INR") ||
      WORLD_CURRENCIES[0]
    );
  }, [value]);

  const samplePreview = useMemo(() => {
    return formatCurrencySample(selectedItem.code, 10000);
  }, [selectedItem]);

  const regions = ["All", "Asia", "Americas", "Europe", "Middle East", "Africa", "Oceania"];

  const filteredCurrencies = useMemo(() => {
    if (selectedRegion === "All") return WORLD_CURRENCIES;
    return WORLD_CURRENCIES.filter((c) => c.region === selectedRegion);
  }, [selectedRegion]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={`w-full justify-between h-10 px-3 text-left font-normal border-input bg-background hover:bg-muted/50 cursor-pointer shadow-2xs ${className}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <span
              className="text-lg leading-none shrink-0"
              role="img"
              aria-label={selectedItem.country}
            >
              {selectedItem.flag}
            </span>
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-xs text-foreground">
                  {selectedItem.code}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  ({selectedItem.symbol}) • {selectedItem.name}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground truncate">
                {selectedItem.country}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              <Coins className="h-3 w-3" />
              <span>{samplePreview}</span>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-5">
              {selectedItem.symbol}
            </Badge>
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[480px] max-w-md p-0 shadow-xl" align="start">
        <Command>
          <CommandInput placeholder="Search currency, code, symbol, country (e.g. INR, Rupee, India, USD, €)..." />

          {/* Quick Region Filter Pills */}
          <div className="flex items-center gap-1 p-2 border-b border-border/70 overflow-x-auto scrollbar-none bg-muted/30">
            {regions.map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedRegion === reg
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          <CommandList className="max-h-[320px] overflow-y-auto">
            <CommandEmpty className="p-4 text-center text-xs text-muted-foreground">
              No matching currency or country found.
            </CommandEmpty>

            <CommandGroup heading={`Currencies & Countries (${filteredCurrencies.length})`}>
              {filteredCurrencies.map((c) => {
                const isSelected = c.code.toUpperCase() === (value || "").toUpperCase();
                const sample = formatCurrencySample(c.code, 10000);

                return (
                  <CommandItem
                    key={c.code}
                    value={`${c.code} ${c.name} ${c.country} ${c.symbol} ${c.symbolNative || ""}`}
                    onSelect={() => {
                      onValueChange(c.code);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-accent"
                  >
                    <div className="flex items-center gap-3 truncate flex-1 mr-2">
                      <span className="text-xl shrink-0" role="img" aria-label={c.country}>
                        {c.flag}
                      </span>
                      <div className="flex flex-col truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-xs text-foreground">
                            {c.code}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            ({c.symbol})
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            • {c.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {c.country}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        {sample}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-1" />}
                    </div>
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

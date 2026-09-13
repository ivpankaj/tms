"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, Globe, Clock, Search } from "lucide-react";
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
  COUNTRY_TIMEZONES,
  CountryTimezone,
  getLiveTimeInTimezone,
  getLiveOffsetInTimezone,
} from "@/lib/constants/timezones";

interface TimezoneComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimezoneCombobox({
  value,
  onValueChange,
  className = "",
  disabled = false,
}: TimezoneComboboxProps) {
  const [open, setOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedRegion, setSelectedRegion] = useState<string>("All");

  // Keep live time ticking every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Find currently selected timezone item
  const selectedItem = useMemo(() => {
    return (
      COUNTRY_TIMEZONES.find((t) => t.value === value) ||
      COUNTRY_TIMEZONES.find((t) => t.value === "Asia/Kolkata") ||
      COUNTRY_TIMEZONES[0]
    );
  }, [value]);

  const liveFormattedTime = useMemo(() => {
    return getLiveTimeInTimezone(selectedItem.value, currentTime);
  }, [selectedItem, currentTime]);

  const liveOffset = useMemo(() => {
    return getLiveOffsetInTimezone(selectedItem.value, currentTime) || selectedItem.offset;
  }, [selectedItem, currentTime]);

  const regions = ["All", "Asia", "Americas", "Europe", "Middle East", "Africa", "Oceania"];

  const filteredTimezones = useMemo(() => {
    if (selectedRegion === "All") return COUNTRY_TIMEZONES;
    return COUNTRY_TIMEZONES.filter((t) => t.region === selectedRegion);
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
            <span className="text-lg leading-none shrink-0" role="img" aria-label={selectedItem.country}>
              {selectedItem.flag}
            </span>
            <div className="flex flex-col truncate">
              <span className="font-medium text-xs text-foreground truncate">
                {selectedItem.country} ({selectedItem.label.split("(")[1]?.replace(")", "") || selectedItem.label})
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {selectedItem.value}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              <Clock className="h-3 w-3" />
              <span>{liveFormattedTime}</span>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-5">
              {liveOffset}
            </Badge>
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[480px] max-w-md p-0 shadow-xl" align="start">
        <Command>
          <CommandInput placeholder="Search country, timezone, or city (e.g. India, IST, New York, London)..." />

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
              No matching country or timezone found.
            </CommandEmpty>

            <CommandGroup heading={`Countries & Timezones (${filteredTimezones.length})`}>
              {filteredTimezones.map((tz) => {
                const isSelected = tz.value === value;
                const timeInTz = getLiveTimeInTimezone(tz.value, currentTime);
                const offsetInTz = getLiveOffsetInTimezone(tz.value, currentTime) || tz.offset;

                return (
                  <CommandItem
                    key={tz.value}
                    value={`${tz.country} ${tz.label} ${tz.value} ${tz.cities} ${tz.offset}`}
                    onSelect={() => {
                      onValueChange(tz.value);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-accent"
                  >
                    <div className="flex items-center gap-3 truncate flex-1 mr-2">
                      <span className="text-xl shrink-0" role="img" aria-label={tz.country}>
                        {tz.flag}
                      </span>
                      <div className="flex flex-col truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {tz.country}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            • {tz.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {tz.cities} ({tz.value})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {timeInTz}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {offsetInTz}
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

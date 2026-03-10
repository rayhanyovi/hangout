"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
};

export function Select({
  value,
  options,
  onValueChange,
  ariaLabel,
  className,
}: SelectProps) {
  return (
    <div
      className={cn(
        "relative rounded-full border border-line bg-card text-foreground shadow-sm",
        className,
      )}
    >
      <select
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-label={ariaLabel}
        className="h-11 w-full appearance-none rounded-full bg-transparent px-4 pr-11 text-sm font-semibold outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

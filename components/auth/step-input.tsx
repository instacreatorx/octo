"use client";

import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onNext?: () => void;
  onBack?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  type?: "text" | "email";
  label?: string;
}

export function StepInput({
  value,
  onChange,
  placeholder,
  onNext,
  onBack,
  disabled = false,
  autoFocus = false,
  type = "text",
  label,
}: StepInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onNext && !disabled && value.trim()) {
      onNext();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm text-muted-foreground block text-right">
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          className="text-right pr-10"
          dir="ltr"
        />
        {onNext && value.trim() && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={onNext}
            disabled={disabled}
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={onBack}
            disabled={disabled}
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
          </Button>
        )}
      </div>
    </div>
  );
}


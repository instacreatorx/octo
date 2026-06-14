"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEnter?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "رمز عبور",
  onEnter,
  disabled = false,
  autoFocus = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter && !disabled) {
      onEnter();
    }
  };

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoFocus={autoFocus}
        className="pr-10 text-right"
        dir="ltr"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}


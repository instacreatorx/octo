"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepInput } from "@/components/auth/step-input";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { setToken } from "@/lib/auth/client";
import Link from "next/link";

type Step = "email" | "password" | "success" | "loading";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("auth_token");
    if (token) {
      router.push("/chat");
    }
  }, [router]);

  const handleEmailNext = () => {
    if (email.trim() && email.includes("@")) {
      setStep("password");
      setError("");
    } else {
      setError("لطفاً یک ایمیل معتبر وارد کنید");
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setError("لطفاً رمز عبور را وارد کنید");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "خطا در ثبت‌نام");
        setIsLoading(false);
        return;
      }

      // Save token
      setToken(data.token);
      
      // Show success message
      setStep("success");
    } catch (err) {
      console.error("Signup error:", err);
      setError("خطا در اتصال به سرور");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">ثبت‌نام</h1>
          <p className="text-muted-foreground">حساب کاربری جدید ایجاد کنید</p>
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        {/* Form */}
        {step === "success" ? (
          <div className="space-y-4 text-center">
            <div className="bg-primary/10 text-primary p-6 rounded-lg space-y-4">
              <p className="font-semibold">ثبت‌نام موفقیت‌آمیز بود!</p>
              <p className="text-sm">
                شما در حالت انتظار هستید تا مدیر شما را تأیید کند.
                <br />
                لطفاً از مدیر بخواهید که شما را تأیید کند.
              </p>
            </div>
            <Button onClick={() => router.push("/chat")} className="w-full">
              رفتن به صفحه چت
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {step === "email" && (
              <StepInput
                value={email}
                onChange={setEmail}
                placeholder="ایمیل خود را وارد کنید"
                onNext={handleEmailNext}
                type="email"
                autoFocus
                label="ایمیل"
              />
            )}

            {step === "password" && (
              <>
                <div className="space-y-2">
                  <StepInput
                    value={email}
                    onChange={() => {}}
                    placeholder={email}
                    onBack={() => setStep("email")}
                    disabled
                    type="email"
                    label="ایمیل"
                  />
                </div>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder="رمز عبور خود را وارد کنید"
                  onEnter={handlePasswordSubmit}
                  autoFocus
                />
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={isLoading || !password.trim()}
                  className="w-full"
                >
                  {isLoading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
                </Button>
              </>
            )}

            {error && (
              <div className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link href="/login" className="text-primary hover:underline">
              وارد شوید
            </Link>
          </p>
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepInput } from "@/components/auth/step-input";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { setToken } from "@/lib/auth/client";
import Link from "next/link";

type Step = "email" | "password" | "loading";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialAdmin, setIsInitialAdmin] = useState(false);
  const [checkingUsers, setCheckingUsers] = useState(true);

  useEffect(() => {
    // Validate token before redirecting
    const validateAndRedirect = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        // No token, proceed with normal flow
        const checkUsers = async () => {
          try {
            const response = await fetch("/api/auth/check-users");
            const data = await response.json();
            setIsInitialAdmin(!data.hasUsers);
          } catch (error) {
            console.error("Error checking users:", error);
            setIsInitialAdmin(false);
          } finally {
            setCheckingUsers(false);
          }
        };
        checkUsers();
        return;
      }

      // Token exists, validate it
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          // Token is valid, redirect to chat
          router.push("/chat");
        } else {
          // Token is invalid, clear it and proceed with login
          localStorage.removeItem("auth_token");
          const checkUsers = async () => {
            try {
              const response = await fetch("/api/auth/check-users");
              const data = await response.json();
              setIsInitialAdmin(!data.hasUsers);
            } catch (error) {
              console.error("Error checking users:", error);
              setIsInitialAdmin(false);
            } finally {
              setCheckingUsers(false);
            }
          };
          checkUsers();
        }
      } catch (error) {
        // Network error, clear token and proceed with login
        console.error("Error validating token:", error);
        localStorage.removeItem("auth_token");
        const checkUsers = async () => {
          try {
            const response = await fetch("/api/auth/check-users");
            const data = await response.json();
            setIsInitialAdmin(!data.hasUsers);
          } catch (error) {
            console.error("Error checking users:", error);
            setIsInitialAdmin(false);
          } finally {
            setCheckingUsers(false);
          }
        };
        checkUsers();
      }
    };

    validateAndRedirect();
  }, [router]);

  const handleEmailNext = () => {
    if (email.trim() && email.includes("@")) {
      setStep("password");
      setError("");
    } else {
      setError("لطفاً یک ایمیل معتبر وارد کنید");
    }
  };

  // For initial admin, allow any email format
  const handleInitialAdminEmailNext = () => {
    if (email.trim()) {
      setStep("password");
      setError("");
    } else {
      setError("لطفاً ایمیل را وارد کنید");
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "خطا در ورود");
        setIsLoading(false);
        return;
      }

      // Save token
      setToken(data.token);
      
      // Redirect to chat
      router.push("/chat");
    } catch (err) {
      console.error("Login error:", err);
      setError("خطا در اتصال به سرور");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">ورود به حساب کاربری</h1>
          {isInitialAdmin ? (
            <div className="space-y-2">
              <p className="text-muted-foreground">ورود مدیر اولیه</p>
              <p className="text-sm text-primary bg-primary/10 p-3 rounded-md">
                هیچ کاربری در سیستم وجود ندارد. لطفاً ایمیل و رمز عبور اولیه (INIT_ADMIN_PASS) را وارد کنید.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">لطفاً اطلاعات خود را وارد کنید</p>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        {/* Form */}
        {checkingUsers ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">در حال بررسی...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {step === "email" && (
              <StepInput
                value={email}
                onChange={setEmail}
                placeholder={isInitialAdmin ? "ایمیل مدیر (هر ایمیل معتبر)" : "ایمیل خود را وارد کنید"}
                onNext={isInitialAdmin ? handleInitialAdminEmailNext : handleEmailNext}
                type={isInitialAdmin ? "text" : "email"}
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
                    type={isInitialAdmin ? "text" : "email"}
                    label="ایمیل"
                  />
                </div>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder={isInitialAdmin ? "رمز عبور اولیه (INIT_ADMIN_PASS)" : "رمز عبور خود را وارد کنید"}
                  onEnter={handlePasswordSubmit}
                  autoFocus
                />
                {isInitialAdmin && (
                  <p className="text-xs text-muted-foreground text-center">
                    رمز عبور اولیه را از فایل .env.local (INIT_ADMIN_PASS) وارد کنید
                  </p>
                )}
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={isLoading || !password.trim()}
                  className="w-full"
                >
                  {isLoading ? "در حال ورود..." : "ورود"}
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
        {!isInitialAdmin && (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              حساب کاربری ندارید؟{" "}
              <Link href="/signup" className="text-primary hover:underline">
                ثبت‌نام کنید
              </Link>
            </p>
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              بازگشت به صفحه اصلی
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


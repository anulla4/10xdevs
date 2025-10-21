import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  redirectTo?: string;
  error?: string;
}

interface FormData {
  email: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ redirectTo = "/panel", error }: LoginFormProps) {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(
    error === "unauthorized" ? "Musisz się zalogować, aby uzyskać dostęp do tej strony" : null
  );

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "E-mail jest wymagany";
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = "Podaj prawidłowy adres e-mail";
    }

    if (!formData.password) {
      newErrors.password = "Hasło jest wymagane";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          setApiError("Nieprawidłowy e-mail lub hasło");
        } else if (response.status === 500) {
          setApiError("Wystąpił błąd serwera. Spróbuj ponownie.");
        } else {
          setApiError(data.message || "Wystąpił błąd. Spróbuj ponownie.");
        }
        return;
      }

      // Success - redirect with full page reload to refresh session
      window.location.href = redirectTo;
    } catch {
      setApiError("Brak połączenia z serwerem. Sprawdź połączenie internetowe.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlur = (field: keyof FormData) => {
    const newErrors: FormErrors = { ...errors };

    if (field === "email") {
      if (!formData.email.trim()) {
        newErrors.email = "E-mail jest wymagany";
      } else if (!EMAIL_REGEX.test(formData.email)) {
        newErrors.email = "Podaj prawidłowy adres e-mail";
      } else {
        delete newErrors.email;
      }
    }

    if (field === "password") {
      if (!formData.password) {
        newErrors.password = "Hasło jest wymagane";
      } else {
        delete newErrors.password;
      }
    }

    setErrors(newErrors);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div
            data-test-id="login-error"
            className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm"
          >
            {apiError}
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            E-mail <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            data-test-id="login-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onBlur={() => handleBlur("email")}
            disabled={isLoading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">
            Hasło <span className="text-destructive">*</span>
          </Label>
          <Input
            id="password"
            data-test-id="login-password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onBlur={() => handleBlur("password")}
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading} data-test-id="login-submit">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Zaloguj się
        </Button>

        {/* Links */}
        <div className="space-y-2 text-center text-sm">
          <div>
            <a href="/auth/reset-password" className="text-primary hover:underline">
              Zapomniałeś hasła?
            </a>
          </div>
          <div>
            <span className="text-muted-foreground">Nie masz konta? </span>
            <a href="/auth/register" className="text-primary hover:underline">
              Zarejestruj się
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}

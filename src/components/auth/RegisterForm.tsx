import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface RegisterFormProps {
  redirectTo?: string;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function RegisterForm({ redirectTo = "/panel" }: RegisterFormProps) {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "E-mail jest wymagany";
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = "Podaj prawidłowy adres e-mail";
    }

    if (!formData.password) {
      newErrors.password = "Hasło jest wymagane";
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      newErrors.password = "Hasło musi mieć min. 8 znaków i zawierać wielką literę, małą literę oraz cyfrę";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Potwierdzenie hasła jest wymagane";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Hasła nie są zgodne";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
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

        if (response.status === 409) {
          setApiError("E-mail jest już zarejestrowany");
        } else if (response.status === 400) {
          setApiError("Nieprawidłowe dane. Sprawdź formularz.");
        } else if (response.status === 500) {
          setApiError("Wystąpił błąd serwera. Spróbuj ponownie.");
        } else {
          setApiError(data.message || "Wystąpił błąd. Spróbuj ponownie.");
        }
        return;
      }

      // Success - check if email confirmation is required
      const data = await response.json();

      if (data.requiresEmailConfirmation) {
        // Show success message and don't redirect
        setSuccessMessage(
          data.message || "Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail i kliknij link potwierdzający."
        );
        // Clear form
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        // Auto-login successful, redirect
        window.location.href = redirectTo;
      }
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
      } else if (!PASSWORD_REGEX.test(formData.password)) {
        newErrors.password = "Hasło musi mieć min. 8 znaków i zawierać wielką literę, małą literę oraz cyfrę";
      } else {
        delete newErrors.password;
      }
    }

    if (field === "confirmPassword") {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Potwierdzenie hasła jest wymagane";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Hasła nie są zgodne";
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMessage && (
          <div className="p-4 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-100 text-sm">
            <p className="font-semibold mb-1">Rejestracja zakończona pomyślnie!</p>
            <p>{successMessage}</p>
            <p className="mt-2">
              Po potwierdzeniu adresu e-mail będziesz mógł się{" "}
              <a href="/auth/login" className="underline font-medium">
                zalogować
              </a>
              .
            </p>
          </div>
        )}

        {apiError && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
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
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onBlur={() => handleBlur("email")}
            disabled={isLoading || !!successMessage}
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
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onBlur={() => handleBlur("password")}
            disabled={isLoading || !!successMessage}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Potwierdź hasło <span className="text-destructive">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            onBlur={() => handleBlur("confirmPassword")}
            disabled={isLoading || !!successMessage}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-destructive">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading || !!successMessage}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Zarejestruj się
        </Button>

        {/* Link to Login */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Masz już konto? </span>
          <a href="/auth/login" className="text-primary hover:underline">
            Zaloguj się
          </a>
        </div>
      </form>
    </div>
  );
}

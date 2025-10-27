import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface FormData {
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function UpdatePasswordForm() {
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane';
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      newErrors.password = 'Hasło musi mieć min. 8 znaków i zawierać wielką literę, małą literę oraz cyfrę';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Potwierdzenie hasła jest wymagane';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Hasła nie są zgodne';
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
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          setApiError('Link wygasł lub jest nieprawidłowy. Wygeneruj nowy link.');
        } else if (response.status === 500) {
          setApiError('Wystąpił błąd serwera. Spróbuj ponownie.');
        } else {
          setApiError(data.message || 'Wystąpił błąd. Spróbuj ponownie.');
        }
        return;
      }

      // Success - redirect to login with success message
      window.location.href = '/auth/login?success=password_changed';
    } catch (error) {
      setApiError('Brak połączenia z serwerem. Sprawdź połączenie internetowe.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlur = (field: keyof FormData) => {
    const newErrors: FormErrors = { ...errors };

    if (field === 'password') {
      if (!formData.password) {
        newErrors.password = 'Hasło jest wymagane';
      } else if (!PASSWORD_REGEX.test(formData.password)) {
        newErrors.password = 'Hasło musi mieć min. 8 znaków i zawierać wielką literę, małą literę oraz cyfrę';
      } else {
        delete newErrors.password;
      }
    }

    if (field === 'confirmPassword') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Potwierdzenie hasła jest wymagane';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Hasła nie są zgodne';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-900 dark:text-blue-100 mb-6">
          Link do resetowania hasła jest ważny przez 1 godzinę.
        </div>

        {apiError && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
            {apiError}
          </div>
        )}

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">
            Nowe hasło <span className="text-destructive">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onBlur={() => handleBlur('password')}
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
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
            onBlur={() => handleBlur('confirmPassword')}
            disabled={isLoading}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-destructive">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Zmień hasło
        </Button>

        {/* Link to Reset Password */}
        <div className="text-center text-sm">
          <a href="/auth/reset-password" className="text-primary hover:underline">
            Wygeneruj nowy link
          </a>
        </div>
      </form>
    </div>
  );
}

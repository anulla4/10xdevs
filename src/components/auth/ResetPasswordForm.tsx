import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('E-mail jest wymagany');
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Podaj prawidłowy adres e-mail');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError('Wystąpił błąd. Spróbuj ponownie.');
        return;
      }

      // Always show success (security best practice)
      setIsSuccess(true);
    } catch (error) {
      setError('Brak połączenia z serwerem. Sprawdź połączenie internetowe.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlur = () => {
    if (!email.trim()) {
      setError('E-mail jest wymagany');
    } else if (!EMAIL_REGEX.test(email)) {
      setError('Podaj prawidłowy adres e-mail');
    } else {
      setError(null);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="p-6 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-green-900 dark:text-green-100">Link został wysłany</h3>
              <p className="text-sm text-green-800 dark:text-green-200">
                Link resetujący został wysłany na podany adres e-mail. Sprawdź swoją skrzynkę odbiorczą.
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-2">Link będzie ważny przez 1 godzinę.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-sm text-primary hover:underline">
            Wróć do logowania
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2 mb-6">
          <p className="text-sm text-muted-foreground">
            Podaj adres e-mail powiązany z Twoim kontem. Wyślemy Ci link do zresetowania hasła.
          </p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            E-mail <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleBlur}
            disabled={isLoading}
            aria-invalid={!!error}
            aria-describedby={error ? 'email-error' : undefined}
          />
          {error && (
            <p id="email-error" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Wyślij link
        </Button>

        {/* Link to Login */}
        <div className="text-center text-sm">
          <a href="/auth/login" className="text-primary hover:underline">
            Wróć do logowania
          </a>
        </div>
      </form>
    </div>
  );
}

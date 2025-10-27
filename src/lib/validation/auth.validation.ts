import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'E-mail jest wymagany')
  .email('Podaj prawidłowy adres e-mail')
  .toLowerCase()
  .trim();

// Password validation - min 8 chars, uppercase, lowercase, digit
export const passwordSchema = z
  .string()
  .min(8, 'Hasło musi mieć minimum 8 znaków')
  .regex(/[a-z]/, 'Hasło musi zawierać małą literę')
  .regex(/[A-Z]/, 'Hasło musi zawierać wielką literę')
  .regex(/\d/, 'Hasło musi zawierać cyfrę');

// Login request schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Hasło jest wymagane'),
});

// Register request schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Reset password request schema
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Update password request schema
export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

// Delete account request schema
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Hasło jest wymagane'),
});

// Type exports
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordRequest = z.infer<typeof updatePasswordSchema>;
export type DeleteAccountRequest = z.infer<typeof deleteAccountSchema>;

// Validation helper
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => err.message);
  return { success: false, errors };
}

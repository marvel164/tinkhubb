import { z } from "zod";

export const registrationSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be 20 characters or less")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),

  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .refine(
      (value) => /^(?:\+234|0)(?:70|71|80|81|90|91)\d{8}$/.test(value),
      "Enter a valid Nigerian phone number",
    ),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function normalizePhone(phone: string) {
  const cleaned = phone.replace(/[\s-]/g, "");

  if (cleaned.startsWith("0")) {
    return `+234${cleaned.slice(1)}`;
  }

  return cleaned;
}

import { useState } from "react";
import { z, ZodSchema, ZodTypeAny } from "zod";

// Default schema for the main form
export const urlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2048, "URL is too long")
    .refine(
      (val) => {
        try {
          // Robust URL validation
          const url = new URL(val.startsWith("http") ? val : `https://${val}`);
          return ["http:", "https:"].includes(url.protocol);
        } catch {
          return false;
        }
      },
      { message: "Invalid URL format" }
    ),
  filterEnglish: z.boolean().optional(),
  removeHeadersFooters: z.boolean().optional(),
  cleanExport: z.boolean().optional(),
});

type FormValues = z.infer<typeof urlSchema>;

export function useFormValidation<T extends ZodTypeAny = typeof urlSchema>(
  schema: ZodSchema<T> = urlSchema as any,
  initialValues: Partial<z.infer<T>> = {}
) {
  const [values, setValues] = useState<Partial<z.infer<T>>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (field?: keyof z.infer<T>) => {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    } else {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
  };

  const setField = (field: keyof z.infer<T>, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    setField,
    errors,
    validate,
    reset,
    setValues,
  };
}
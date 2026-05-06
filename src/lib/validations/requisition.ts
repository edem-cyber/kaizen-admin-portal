import { z } from "zod";

export const requisitionCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description is too long")
    .optional(),
  justification: z
    .string()
    .min(10, "Justification must be at least 10 characters")
    .max(2000, "Justification is too long")
    .optional(),
  category: z
    .string()
    .min(1, "Category is required")
    .max(100, "Category is too long")
    .optional(),
  total_amount: z
    .number()
    .min(0.01, "Amount must be greater than 0")
    .max(999999999.99, "Amount is too large")
    .nullable()
    .optional(),
});


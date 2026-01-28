import { z } from "zod";

export const vaultItemSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  content: z
    .string()
    .min(1, "Content is required")
    .max(100000, "Content must be less than 100,000 characters"),
  type: z.enum(["snippet", "prompt", "component", "template", "note"]),
  language: z.string().optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional(),
  collection_id: z.string().uuid().optional().nullable(),
  is_public: z.boolean().optional(),
});

export const vaultCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  icon: z.string().max(50).optional(),
  is_public: z.boolean().optional(),
});

export type VaultItemInput = z.infer<typeof vaultItemSchema>;
export type VaultCollectionInput = z.infer<typeof vaultCollectionSchema>;

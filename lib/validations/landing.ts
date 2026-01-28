import { z } from "zod";

export const landingPageSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  template: z.string().optional(),
});

export const updateLandingPageSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  meta_title: z.string().max(70, "Meta title should be under 70 characters").optional(),
  meta_description: z.string().max(160, "Meta description should be under 160 characters").optional(),
  og_image: z.string().url().optional().or(z.literal("")),
  custom_css: z.string().max(50000, "CSS too long").optional(),
  custom_js: z.string().max(50000, "JS too long").optional(),
  password: z.string().max(100).optional().or(z.literal("")),
});

export const leadCaptureSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().max(100).optional(),
  data: z.record(z.unknown()).optional(),
});

export type LandingPageInput = z.infer<typeof landingPageSchema>;
export type UpdateLandingPageInput = z.infer<typeof updateLandingPageSchema>;
export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;

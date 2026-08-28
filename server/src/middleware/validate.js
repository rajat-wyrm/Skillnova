// ════════════════════════════════════════════════════════════
//  Validation helpers using Zod (lightweight, ergonomic)
// ════════════════════════════════════════════════════════════
import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const data =
      source === "query"
        ? req.query
        : source === "params"
          ? req.params
          : req.body;
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      console.log("Validation Error:", JSON.stringify(errors, null, 2));
      return next(ApiError.badRequest("Validation failed", errors));
    }
    // Replace data with parsed (typed) value
    if (source === "query") req.validatedQuery = result.data;
    else if (source === "params") req.validatedParams = result.data;
    else req.body = result.data;
    next();
  };
}

// ── Reusable schemas ──────────────────────────────────────
export const schemas = {
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one digit"),
  internCode: z
    .string()
    .trim()
    .min(6, "Intern code must be at least 6 characters")
    .max(32, "Intern code must be 32 characters or fewer")
    .regex(/^[A-Za-z0-9]+$/, "Intern code can contain only letters and numbers")
    .refine(
      (value) => /[A-Za-z]/.test(value),
      "Intern code must contain a letter",
    )
    .refine((value) => /[0-9]/.test(value), "Intern code must contain a number")
    .transform((value) => value.toUpperCase()),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(1000).default(20),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).default("desc"),
    search: z.string().max(200).optional(),
  }),
};

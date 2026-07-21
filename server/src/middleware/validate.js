// ════════════════════════════════════════════════════════════
//  Validation helpers using Zod (lightweight, ergonomic)
// ════════════════════════════════════════════════════════════
import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const data = source === 'query' ? req.query : source === 'params' ? req.params : req.body;
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      }));
      return next(ApiError.badRequest('Validation failed', errors));
    }
    // Replace data with parsed (typed) value
    if (source === 'query') req.validatedQuery = result.data;
    else if (source === 'params') req.validatedParams = result.data;
    else req.body = result.data;
    next();
  };
}

export const validateQuery = (schema) => validate(schema, 'query');
export const validateParams = (schema) => validate(schema, 'params');

// ── Reusable schemas ──────────────────────────────────────
export const schemas = {
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit'),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().max(200).optional(),
  }),
};

import { Request, Response, NextFunction } from 'express';

// Recursively remove keys starting with `$` or containing `.` from a value tree.
// This blocks NoSQL operator injection like `{ "email": { "$gt": "" } }` in JSON bodies.
const sanitizeValue = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      cleaned[key] = sanitizeValue(value[key]);
    }
    return cleaned;
  }
  return value;
};

// Sanitize req.body and req.params in place. We don't sanitize req.query because
// Express 5 exposes it as a read-only getter; query values are also limited to
// strings/arrays of strings by the parser, so the operator-injection surface
// there is effectively zero.
export const mongoSanitize = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      const v = (req.params as any)[key];
      if (typeof v === 'string' && (v.startsWith('$') || v.includes('$'))) {
        // Route params are typed strings; reject obvious operator payloads.
        (req.params as any)[key] = v.replace(/\$/g, '');
      }
    }
  }
  next();
};

export default mongoSanitize;

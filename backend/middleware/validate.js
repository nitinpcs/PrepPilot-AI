import { ZodError } from 'zod';

/**
 * Validation middleware factory.
 *
 * Accepts a Zod schema that may include any combination of:
 *   - schema.shape.body    → validated against req.body
 *   - schema.shape.params  → validated against req.params
 *   - schema.shape.query   → validated against req.query
 *
 * On success, the parsed (coerced + defaulted) values are written back
 * to req.body / req.params / req.query so controllers receive clean data.
 *
 * On failure, returns:
 *   HTTP 422 { success: false, message: 'Validation failed', errors: [{ field, message }] }
 *
 * @param {import('zod').ZodObject} schema
 */
const validate = (schema) => (req, res, next) => {
  const input = {};
  if (schema.shape?.body)   input.body   = req.body;
  if (schema.shape?.params) input.params = req.params;
  if (schema.shape?.query)  input.query  = req.query;

  const result = schema.safeParse(input);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Write parsed (coerced + defaulted) values back to the request
  if (result.data.body)   req.body   = result.data.body;
  if (result.data.params) req.params = result.data.params;
  if (result.data.query)  req.query  = result.data.query;

  next();
};

export default validate;

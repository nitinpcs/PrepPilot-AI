/**
 * Base application error.
 * All thrown errors should extend this class so the global error
 * handler can detect them and return the right HTTP status.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status code
   * @param {string} message     Human-readable message
   * @param {Array}  errors      Optional array of field-level errors (used by ValidationError)
   * @param {Object} meta        Optional extra fields to merge into the response body
   */
  constructor(statusCode, message, errors = [], meta = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    if (meta) this.meta = meta;
    this.name = this.constructor.name;
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/** 422 — request body / params / query failed schema validation */
export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', errors = []) {
    super(422, message, errors);
  }
}

/** 404 — requested resource does not exist */
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

/** 401 — missing or invalid authentication credentials */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Not authorized') {
    super(401, message);
  }
}

/** 403 — authenticated but not permitted to perform the action */
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

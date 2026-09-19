/**
 * Standardized API response helpers.
 * Ensures consistent JSON structure across all endpoints.
 */

/**
 * Send a success response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {any} data - Response payload
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Optional success message
 */
export function success(res, data = null, statusCode = 200, message = 'Success') {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 */
export function error(res, message = 'Internal Server Error', statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

/**
 * Create a custom API error that can be caught by the global error handler.
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

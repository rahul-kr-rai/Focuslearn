/**
 * Request sanitization middleware to prevent NoSQL operator injection.
 * Recursively removes any object keys starting with '$' or containing '.'
 * from req.body, req.query, and req.params.
 */
function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop keys starting with $ or containing .
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      cleaned[key] = cleanObject(value);
    } else if (typeof value === 'string') {
      cleaned[key] = value;
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

export default function sanitizeInput(req, _res, next) {
  if (req.body) req.body = cleanObject(req.body);
  if (req.query) req.query = cleanObject(req.query);
  if (req.params) req.params = cleanObject(req.params);
  next();
}

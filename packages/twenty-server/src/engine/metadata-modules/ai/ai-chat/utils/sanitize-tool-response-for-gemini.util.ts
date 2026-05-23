// Gemini rejects function_response payloads that contain JSON Schema $ref/$defs.
// learn_tools returns Zod-derived schemas with those keys, which breaks multi-step chat.
export const sanitizeToolResponseForGemini = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeToolResponseForGemini(item));
  }

  const record = value as Record<string, unknown>;

  if ('$ref' in record) {
    return {
      type: 'object',
      description:
        'Nested schema reference removed for Gemini tool response compatibility',
    };
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(record)) {
    if (key === '$defs' || key === '$schema') {
      continue;
    }

    sanitized[key] = sanitizeToolResponseForGemini(nestedValue);
  }

  return sanitized;
};

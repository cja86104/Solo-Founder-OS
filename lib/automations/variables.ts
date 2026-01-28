/**
 * Replace {{variable}} and {{nested.path}} placeholders in a string.
 */
export function replaceVariables(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const value = getNestedValue(data, path);
    return value !== undefined ? String(value) : match;
  });
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    return current && typeof current === 'object'
      ? (current as Record<string, unknown>)[key]
      : undefined;
  }, obj);
}

/**
 * Recursively replace {{variable}} placeholders in all string values of an object.
 */
export function replaceVariablesInObject<T extends Record<string, unknown>>(
  obj: T,
  data: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = replaceVariables(value, data);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string' ? replaceVariables(item, data) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = replaceVariablesInObject(
        value as Record<string, unknown>,
        data
      );
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

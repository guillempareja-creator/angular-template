type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function isNullish(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function isEmptyValue(value: unknown): boolean {
  return (
    isNullish(value) ||
    (Array.isArray(value) && value.length === 0) ||
    (isPlainObject(value) && Object.keys(value).length === 0)
  );
}

function clean(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(clean).filter((item) => !isNullish(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const result: PlainObject = {};
  for (const [key, entry] of Object.entries(value)) {
    const cleaned = clean(entry);
    if (!isEmptyValue(cleaned)) {
      result[key] = cleaned;
    }
  }

  return result;
}

/**
 * Recursively removes empty properties (null, undefined, '', empty arrays and
 * empty plain objects) from plain objects or arrays.
 * Leaves intact any non–plain-object instances (Date, RegExp, custom classes…).
 */
export function removeEmptyProperties<T>(obj: T): T | Partial<T> {
  return clean(obj) as T | Partial<T>;
}

/**
 * Retrieves the value from an object using a dot-separated path string.
 *
 * @param obj - The object to extract the value from.
 * @param path - The dot-separated string representing the path to the desired value.
 * @returns The value found at the given path, or `undefined` if not found.
 */
export function getValueByPath(
  obj: object | null | undefined,
  path: string,
): unknown {
  if (!obj) {
    return;
  }

  return path.split('.').reduce<unknown>((acc, part) => {
    if (!acc) {
      return;
    }

    return (acc as Record<string, unknown>)[part];
  }, obj);
}

/**
 * Checks if all properties of an object are null.
 *
 * @param obj - The object to check.
 * @returns True if all properties are null, false otherwise.
 */
export function areAllPropsNull(obj: Record<string, unknown>): boolean {
  return Object.values(obj).every((value) => value === null);
}

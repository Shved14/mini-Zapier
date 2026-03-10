export const getByPath = (obj: unknown, path: string): unknown => {
  if (obj === null || obj === undefined) return undefined;
  if (!path) return obj;

  const segments = path.split(".");
  let current: any = obj;

  for (const seg of segments) {
    if (current == null) return undefined;
    current = current[seg];
  }

  return current;
};

export const interpolateTemplate = (
  template: string,
  context: Record<string, unknown>
): string => {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_match, rawPath) => {
    const path = String(rawPath).trim();
    const value = getByPath(context, path);
    if (value === undefined || value === null) {
      return "";
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }
    return String(value);
  });
};


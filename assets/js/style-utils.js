function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}

export function buildStyleAttribute(propertyMap = {}) {
  const declarations = Object.entries(propertyMap)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");

  if (!declarations) {
    return "";
  }

  return `style="${escapeHtmlAttribute(declarations)}"`;
}

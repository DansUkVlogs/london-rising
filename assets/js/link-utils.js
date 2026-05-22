export function buildLinkAttributes(linkConfig = {}) {
  const href = linkConfig.href ?? "#";
  const target = linkConfig.newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `href="${href}"${target}`;
}

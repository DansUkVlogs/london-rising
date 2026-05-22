export function toCssImageUrl(assetPath) {
  if (!assetPath) {
    return "";
  }

  return `url("${new URL(assetPath, document.baseURI).href}")`;
}

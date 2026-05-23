export function toAssetUrl(assetPath) {
  if (!assetPath) {
    return "";
  }

  return new URL(assetPath, document.baseURI).href;
}

export function toCssImageUrl(assetPath) {
  if (!assetPath) {
    return "";
  }

  return `url("${toAssetUrl(assetPath)}")`;
}

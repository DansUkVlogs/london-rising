export class JsonLoader {
  constructor() {
    this.cache = new Map();
  }

  async load(path) {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load JSON config at ${path}`);
    }

    const data = await response.json();
    this.cache.set(path, data);
    return data;
  }

  async loadAll(paths) {
    return Promise.all(paths.map((path) => this.load(path)));
  }

  async loadNamed(pathMap) {
    const entries = Object.entries(pathMap);
    const data = await Promise.all(entries.map(([, path]) => this.load(path)));

    return Object.fromEntries(entries.map(([key], index) => [key, data[index]]));
  }
}

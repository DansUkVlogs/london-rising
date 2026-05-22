import { AppShell } from "./app-shell.js";
import { JsonLoader } from "./json-loader.js";

const dataLoader = new JsonLoader();
const [siteConfig, brandingConfig] = await dataLoader.loadAll([
  "assets/data/site/site-config.json",
  "assets/data/site/branding.json",
]);

const appShell = new AppShell({ siteConfig, brandingConfig, dataLoader });
appShell.init();

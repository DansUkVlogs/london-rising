import { AppShell } from "./app-shell.js?v=20260523ac";
import { JsonLoader } from "./json-loader.js?v=20260523ac";

const dataLoader = new JsonLoader();
const [siteConfig, brandingConfig] = await dataLoader.loadAll([
  "assets/data/site/site-config.json",
  "assets/data/site/branding.json",
]);

const appShell = new AppShell({ siteConfig, brandingConfig, dataLoader });
appShell.init();

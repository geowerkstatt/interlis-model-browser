import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import App from "./App";
import { I18nextProvider } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import i18next from "i18next";
import common_de from "./translations/de/common.json";
import common_fr from "./translations/fr/common.json";
import common_it from "./translations/it/common.json";
import impressum_de from "./translations/de/impressum.json";
import impressum_fr from "./translations/fr/impressum.json";
import impressum_it from "./translations/it/impressum.json";

i18next.use(LanguageDetector).init({
  fallbackLng: "de",
  resources: {
    de: {
      common: common_de,
      impressum: impressum_de,
    },
    fr: {
      common: common_fr,
      impressum: impressum_fr,
    },
    it: {
      common: common_it,
      impressum: impressum_it,
    },
  },
});
if (!["de", "fr", "it"].includes(i18next.language)) {
  i18next.changeLanguage("de");
}
const baseUrl = document.getElementsByTagName("base")[0].getAttribute("href");
const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <BrowserRouter basename={baseUrl}>
    <I18nextProvider i18n={i18next}>
      <App />
    </I18nextProvider>
  </BrowserRouter>,
);

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { TransifexI18next } from "@transifex/i18next";
import * as Localization from "expo-localization";

import * as en from "./translation/en.json";

const hasTransifex = !!process.env.EXPO_PUBLIC_TRANSIFEX_TOKEN;

const txBackend = new TransifexI18next({
  token: process.env.EXPO_PUBLIC_TRANSIFEX_TOKEN,
  // other options from @transifex/native init function
});
// Transifex only holds the website's strings, so the bundle sits behind every
// language as the last fallback instead of replacing Transifex English
const resources = {
  bundled: {
    translation: en,
  },
};

const { languageCode: userLanguage } = Localization.getLocales()[0];

export const finishedLanguages = [
  { short: "en", name: "English" },
  { short: "fr", name: "Français" },
  { short: "es", name: "Español" },
];

const defaultLanguage = userLanguage
  ? finishedLanguages.find((lang) => userLanguage.startsWith(lang.short))
  : { short: "en", name: "English" };

if (hasTransifex) {
  i18n.use(txBackend);
}

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    // Languages without a bundle still load from the backend
    partialBundledLanguages: true,
    lng: defaultLanguage?.short ?? "en", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option
    fallbackLng: ["en", "bundled"],
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;

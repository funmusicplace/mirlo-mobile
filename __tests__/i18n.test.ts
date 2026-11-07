import en from "../translation/en.json";
import type i18nInstance from "../i18n";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

// Stands in for Transifex, which only holds the website's strings
jest.mock("@transifex/i18next", () => ({
  TransifexI18next: class {
    type = "backend";
    init() {}
    read(
      language: string,
      namespace: string,
      callback: (error: null, data: Record<string, string>) => void,
    ) {
      const data: Record<string, string> =
        language === "en"
          ? { "home.exploreMusic": "Explore music from Transifex" }
          : {};
      Promise.resolve().then(() => callback(null, data));
    }
  },
}));

type I18n = typeof i18nInstance;

const tokenBefore = process.env.EXPO_PUBLIC_TRANSIFEX_TOKEN;

// A fresh registry per case, as the token is read when the module loads
const loadI18n = (token?: string): I18n => {
  if (token === undefined) delete process.env.EXPO_PUBLIC_TRANSIFEX_TOKEN;
  else process.env.EXPO_PUBLIC_TRANSIFEX_TOKEN = token;
  let loaded!: I18n;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require("../i18n").default;
  });
  return loaded;
};

const initialized = (i18n: I18n) =>
  i18n.isInitialized
    ? Promise.resolve()
    : new Promise<void>((resolve) => i18n.on("initialized", () => resolve()));

describe("i18n fallback", () => {
  afterEach(() => {
    if (tokenBefore === undefined)
      delete process.env.EXPO_PUBLIC_TRANSIFEX_TOKEN;
    else process.env.EXPO_PUBLIC_TRANSIFEX_TOKEN = tokenBefore;
  });

  test("Transifex English wins and the bundle fills the keys it lacks", async () => {
    const i18n = loadI18n("test-token");
    await initialized(i18n);

    expect(i18n.t("home.exploreMusic")).toBe("Explore music from Transifex");
    expect(i18n.t("logIn.description")).toBe(en.logIn.description);
  });

  test("without a token the bundle supplies every string", async () => {
    const i18n = loadI18n();
    await initialized(i18n);

    expect(i18n.t("home.exploreMusic")).toBe(en.home.exploreMusic);
    expect(i18n.t("logIn.description")).toBe(en.logIn.description);
  });
});

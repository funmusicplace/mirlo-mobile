type Cookie = { value: string };
type CookieMap = Record<string, Cookie>;

const jar: CookieMap = {};

const CookieManager = {
  get: async (_url: string): Promise<CookieMap> => ({ ...jar }),
  getAll: async (): Promise<CookieMap> => ({ ...jar }),
  clearAll: async (_useWebKit?: boolean): Promise<boolean> => {
    for (const key of Object.keys(jar)) delete jar[key];
    return true;
  },
};

export default CookieManager;

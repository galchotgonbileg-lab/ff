// expo-secure-store has no real implementation on web (its web module is an
// empty object), so calling it there throws and never resolves. Browsers
// have no OS keychain to fall back to either, so localStorage is the
// pragmatic choice for the web/PWA build — not encrypted, but that matches
// how most web apps store auth tokens.
export const secureStorage = {
  async getItem(key: string) {
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    localStorage.setItem(key, value);
  },
  async deleteItem(key: string) {
    localStorage.removeItem(key);
  },
};

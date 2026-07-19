import { describe, expect, it } from "vitest";

import { normalizeLocale, speechLocale } from "./locales";
import { translate } from "./messages";

describe("locale", () => {
  it("menggunakan Bahasa Melayu sebagai fallback yang selamat", () => {
    expect(normalizeLocale("fr")).toBe("ms-MY");
    expect(normalizeLocale(undefined)).toBe("ms-MY");
  });

  it("memilih locale pertuturan yang sepadan", () => {
    expect(speechLocale("ms-MY")).toBe("ms-MY");
    expect(speechLocale("en")).toBe("en-MY");
  });

  it("memulangkan salinan English untuk kunci yang sama", () => {
    expect(translate("en", "signIn")).toBe("Sign in");
  });
});

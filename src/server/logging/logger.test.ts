import { describe, expect, it } from "vitest";
import { redactLogMeta } from "./logger";

describe("logger redaction", () => {
  it("menapis transkrip dan token daripada metadata log", () => {
    expect(redactLogMeta({
      requestId: "req-1",
      transcript: "Nama murid dan refleksi penuh",
      headers: { authorization: "Bearer secret" },
      nested: [{ apiKey: "secret-key" }],
    })).toEqual({
      requestId: "req-1",
      transcript: "[REDACTED]",
      headers: { authorization: "[REDACTED]" },
      nested: [{ apiKey: "[REDACTED]" }],
    });
  });
});

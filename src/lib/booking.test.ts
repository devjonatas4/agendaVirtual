import { describe, expect, it } from "vitest";
import { findDateConflicts, normalizeBrPhone, whatsappLink, formatTime } from "./booking";

describe("normalizeBrPhone", () => {
  it("adds Brazil's 55 to a number typed with DDD", () => {
    expect(normalizeBrPhone("(11) 98765-4321")).toBe("5511987654321");
  });
  it("keeps a number that already has +55", () => {
    expect(normalizeBrPhone("+55 21 99876-5432")).toBe("5521998765432");
  });
});

describe("whatsappLink", () => {
  it("opens the contractor's chat with the message filled in", () => {
    expect(whatsappLink("11987654321", "Oi")).toBe("https://wa.me/5511987654321?text=Oi");
  });
  it("lets you choose the chat (band group) when there is no phone", () => {
    expect(whatsappLink("", "Oi")).toBe("https://wa.me/?text=Oi");
  });
});

describe("findDateConflicts", () => {
  const events = [
    { id: "a", event_date: "2026-12-05", status: "confirmado" as const },
    { id: "b", event_date: "2026-12-05", status: "cancelado" as const },
    { id: "c", event_date: "2026-12-06", status: "pre_reserva" as const },
  ];
  it("a cancelled booking does not block the date", () => {
    expect(findDateConflicts(events, "2026-12-05").map((e) => e.id)).toEqual(["a"]);
  });
  it("a pre-reservation blocks the date", () => {
    expect(findDateConflicts(events, "2026-12-06").map((e) => e.id)).toEqual(["c"]);
  });
  it("the event being edited does not conflict with itself", () => {
    expect(findDateConflicts(events, "2026-12-05", "a")).toEqual([]);
  });
});

describe("formatTime", () => {
  it("shows 19:30 as 19h30 and 20:00 as 20h", () => {
    expect(formatTime("19:30:00")).toBe("19h30");
    expect(formatTime("20:00:00")).toBe("20h");
  });
});

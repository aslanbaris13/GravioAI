import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, assistStream } from "./api";
import type { AssistStreamEvent } from "./api";

function sseStreamFromEvents(events: object[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("assistStream", () => {
  it("SSE çerçevelerini sırayla parse edip onEvent'e iletir", async () => {
    const events: AssistStreamEvent[] = [
      { type: "meta", profile: { goals: [] }, matches: [] },
      { type: "token", text: "Merhaba" },
      { type: "token", text: " dünya" },
      { type: "done" },
    ];
    const fetchMock = vi.fn().mockResolvedValue(new Response(sseStreamFromEvents(events), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const received: AssistStreamEvent[] = [];
    await assistStream("selam", [], "session-123", (e) => received.push(e));

    expect(received).toEqual(events);
  });

  it("session_id'yi istek gövdesine dahil eder", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(sseStreamFromEvents([{ type: "done" }]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await assistStream("selam", [], "session-123", () => {});

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.session_id).toBe("session-123");
    expect(body.message).toBe("selam");
  });

  it("yanıt başarısızsa ApiError fırlatır", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("sunucu hatası", { status: 500 })));

    await expect(assistStream("selam", [], undefined, () => {})).rejects.toThrow(ApiError);
  });

  it("fetch ağ hatası fırlatırsa ApiError'a çevirir", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(assistStream("selam", [], undefined, () => {})).rejects.toThrow(ApiError);
  });

  it("bozuk bir SSE çerçevesini sessizce atlar, akışı kesmez", async () => {
    const encoder = new TextEncoder();
    const raw = "data: {bozuk-json\n\ndata: " + JSON.stringify({ type: "done" }) + "\n\n";
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(raw));
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream, { status: 200 })));

    const received: AssistStreamEvent[] = [];
    await assistStream("selam", [], undefined, (e) => received.push(e));

    expect(received).toEqual([{ type: "done" }]);
  });
});

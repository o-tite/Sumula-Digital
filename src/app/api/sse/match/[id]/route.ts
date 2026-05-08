import { NextRequest } from "next/server";
import { bus, type BusEvent } from "@/infrastructure/sse-bus";
import { channels } from "@/application/sse-channels";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function format(event: BusEvent) {
  return (
    `id: ${event.id}\n` +
    `event: ${event.type}\n` +
    `data: ${JSON.stringify(event.payload)}\n\n`
  );
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const channel = channels.match(ctx.params.id);
  const lastEventIdHeader = req.headers.get("last-event-id");
  const lastEventId = lastEventIdHeader ? Number(lastEventIdHeader) : 0;

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Replay
      const missed = bus.replayAfter(channel, lastEventId);
      for (const m of missed) controller.enqueue(encoder.encode(format(m)));

      // Heartbeat para manter conexão (Arquitetura §2.2)
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 25_000);

      unsubscribe = bus.subscribe(channel, (event) => {
        controller.enqueue(encoder.encode(format(event)));
      });

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        if (unsubscribe) unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      if (unsubscribe) unsubscribe();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

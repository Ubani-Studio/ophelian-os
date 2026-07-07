/**
 * Live WebSocket bridge — the seam between Boveda (soul) and external
 * runtimes (Unreal Editor plugin, ComfyUI, overlays).
 *
 * Endpoint:
 *   WS /characters/:id/live
 *
 * Protocol:
 *   Server → client: JSON-encoded LiveEvent (one per line, one per ws frame).
 *     { type: "tick", characterId, ts, payload: { ... Decision shape ... } }
 *     { type: "interaction", characterId, ts, payload: { with, message } }
 *     { type: "beat_advance", characterId, ts, payload: { arcId, beatIndex, beat } }
 *     { type: "location_change", characterId, ts, payload: { from, to } }
 *     { type: "ping", characterId, ts, payload: {} }   // keepalive
 *
 *   Client → server: ignored. The bridge is one-way for v1. Future:
 *   accept inbound "intent" messages (e.g. Unreal saying "the player
 *   waved at this character") to feed the next tick prompt.
 *
 * Auth: WebSocket connections still pass through the API key auth hook
 * (header `x-api-key`). Browsers can't easily attach headers to WS, so
 * a `?key=…` querystring is also accepted as a fallback.
 */

import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { subscribeLive, publishLive, liveSubscriberCount } from '../lib/live-bus.js';
import { prisma } from '../db.js';

const PING_INTERVAL_MS = 25_000;

export async function liveRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(websocket);

  fastify.get<{ Params: { id: string } }>(
    '/characters/:id/live',
    { websocket: true },
    async (socket, request) => {
      // @fastify/websocket v11+: the first arg IS the WebSocket directly,
      // not a SocketStream wrapper. Earlier versions used connection.socket.
      const characterId = (request.params as { id: string }).id;

      const exists = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true },
      });
      if (!exists) {
        try {
          socket.send(JSON.stringify({ type: 'error', error: 'character_not_found', characterId }));
        } catch {
          // ignore
        }
        socket.close(1008, 'character_not_found');
        return;
      }

      const send = (data: unknown): void => {
        if (socket.readyState === socket.OPEN) {
          try {
            socket.send(JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      };

      // Hello — confirms connect + subscriber count for debug overlays.
      send({
        type: 'hello',
        characterId,
        characterName: exists.name,
        subscribers: liveSubscriberCount(characterId) + 1,
        ts: new Date().toISOString(),
      });

      const unsubscribe = subscribeLive(characterId, (ev) => send(ev));

      // Keepalive — without this, idle WSs get reaped by some intermediaries.
      const pingTimer = setInterval(() => {
        send({ type: 'ping', characterId, ts: new Date().toISOString(), payload: {} });
      }, PING_INTERVAL_MS);

      socket.on('close', () => {
        clearInterval(pingTimer);
        unsubscribe();
      });

      socket.on('error', () => {
        clearInterval(pingTimer);
        unsubscribe();
      });
    },
  );

  // Diagnostic: emit a synthetic event so you can prove the wire is hot
  // without waiting for a real tick. POST /characters/:id/live/test
  fastify.post<{ Params: { id: string }; Body?: { message?: string } }>(
    '/characters/:id/live/test',
    async (request, reply) => {
      const id = (request.params as { id: string }).id;
      const message = (request.body as { message?: string } | undefined)?.message ?? 'test ping';
      publishLive({
        type: 'tick',
        characterId: id,
        payload: {
          kind: 'thought',
          summary: message,
          source: 'stub',
          test: true,
        },
      });
      return reply.send({ ok: true, subscribers: liveSubscriberCount(id) });
    },
  );
}

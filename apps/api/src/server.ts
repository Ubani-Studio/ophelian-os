import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { authMiddleware } from './middleware/auth.js';
import { characterRoutes } from './routes/characters.js';
import { voiceProfileRoutes } from './routes/voice-profiles.js';
import { licenseRoutes } from './routes/licenses.js';
import { contentRoutes } from './routes/content.js';
import { ledgerRoutes } from './routes/ledger.js';
import { uploadRoutes } from './routes/uploads.js';
import { relationshipRoutes } from './routes/relationships.js';
import { ensembleRoutes } from './routes/ensembles.js';
import { positionRoutes } from './routes/positions.js';
import { sceneRoutes } from './routes/scenes.js';
import { worldRoutes } from './routes/worlds.js';
import { connectionRoutes } from './routes/connections.js';
import { snapshotRoutes } from './routes/snapshots.js';
import { genomeRoutes } from './routes/genomes.js';
import { consentRoutes } from './routes/consent.js';
import { inviteRoutes } from './routes/invites.js';
import { eventRoutes } from './routes/events.js';
import { starforgeImportRoutes } from './routes/starforge-import.js';
import { trailRoutes } from './routes/trail.js';
import { realignRoutes } from './routes/realign.js';
import { personaRoutes } from './routes/personas.js';
import { startScheduler, runScheduledTickPass } from './lib/scheduler.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './storage/uploads';

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    });

    // Register multipart for file uploads (500MB limit)
    await fastify.register(multipart, {
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
      },
    });

    // Serve uploaded files statically
    await fastify.register(fastifyStatic, {
      root: path.resolve(UPLOAD_DIR),
      prefix: '/uploads/',
      decorateReply: false,
    });

    // Health check (no auth required)
    fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    // Register auth middleware for all other routes
    fastify.addHook('onRequest', async (request, reply) => {
      // Skip auth for health check and static files
      if (request.url === '/health' || request.url.startsWith('/uploads/')) return;
      await authMiddleware(request, reply);
    });

    // Register routes
    await fastify.register(characterRoutes);
    await fastify.register(voiceProfileRoutes);
    await fastify.register(licenseRoutes);
    await fastify.register(contentRoutes);
    await fastify.register(ledgerRoutes);
    await fastify.register(uploadRoutes);
    await fastify.register(relationshipRoutes);
    await fastify.register(ensembleRoutes);
    await fastify.register(positionRoutes);
    await fastify.register(sceneRoutes);
    await fastify.register(worldRoutes);
    await fastify.register(connectionRoutes);
    await fastify.register(snapshotRoutes);
    await fastify.register(genomeRoutes);
    await fastify.register(consentRoutes);
    await fastify.register(inviteRoutes);
    await fastify.register(eventRoutes);
    await fastify.register(starforgeImportRoutes);
    await fastify.register(trailRoutes);
    await fastify.register(realignRoutes);
    await fastify.register(personaRoutes);

    // Manual tick-pass trigger. Lets the user fire the scheduler
    // immediately rather than waiting for the cron. Useful in beta:
    // make the world move now, come back to the trail.
    fastify.post('/scheduler/tick-pass', async (_request, reply) => {
      const outcomes = await runScheduledTickPass();
      const summary = outcomes.reduce<Record<string, number>>((acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      }, {});
      return reply.send({ outcomes, summary });
    });

    // Start server
    // Ecosystem port convention: Boveda 5130, Ibis 5140, Òrò 5150, Sankoré 5160.
    const port = parseInt(process.env.PORT || '5130', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`API server running at http://${host}:${port}`);

    // Start the living-world scheduler. Disabled with SCHEDULER_ENABLED=false.
    startScheduler({
      info: (...a) => fastify.log.info(...(a as [string])),
      warn: (...a) => fastify.log.warn(...(a as [string])),
      error: (...a) => fastify.log.error(...(a as [string])),
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

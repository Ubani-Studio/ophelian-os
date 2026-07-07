// Relic routes — the Vivarium discovery layer's CRUD + importers.
//
// One unit per captured ecological / biodiversity / phenomenon
// signal, shaped by the six-layer spec. Surfaces live in Ikenga
// (visual side) and Resonate (audio side); this is the canonical
// store.
//
// Importers convert a public URL (xeno-canto today, GBIF / iNat
// next) into a populated Relic so the writer doesn't retype the
// taxonomy + recording metadata by hand.
//
// Spec: /home/sphinxy/boveda/VIVARIUM_ARCHITECTURE.md

import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';

type RelicKind = 'location' | 'species' | 'phenomenon' | 'tech' | 'method' | 'recording';

interface CreateRelicBody {
  kind?: RelicKind;
  title: string;
  phenomenonKey?: string | null;
  fieldSite?: string | null;
  fieldLat?: number | null;
  fieldLng?: number | null;
  captureMethod?: string | null;
  captureGearNotes?: string | null;
  rawSampleUrl?: string | null;
  taxonPath?: string | null;
  ncbiTaxid?: string | null;
  gbifTaxonkey?: string | null;
  iucnStatus?: string | null;
  habitat?: string | null;
  strangeness?: number;
  saroIndex?: number;
  mythicPosture?: string | null;
  bodyMd?: string | null;
  audioSamples?: unknown;
  visualSamples?: unknown;
  cubeIds?: string[];
  zoneIds?: string[];
  sphereIds?: string[];
  stelaIds?: string[];
  cipherIds?: string[];
  characterIds?: string[];
  sourceProvenance?: string | null;
  sourceUrl?: string | null;
  tags?: string[];
}

type UpdateRelicBody = Partial<CreateRelicBody>;

interface ListRelicsQuery {
  kind?: RelicKind;
  phenomenonKey?: string;
  minStrangeness?: string;
  minSaro?: string;
  zoneId?: string;
  sphereId?: string;
  cubeId?: string;
  q?: string;
}

interface ImportRelicBody {
  url: string;
  // Optional binding hints — every importer respects these
  zoneId?: string;
  sphereId?: string;
  cubeId?: string;
}

// ----------------------------------------------------------------------
// xeno-canto importer
// ----------------------------------------------------------------------
//
// URL pattern: https://xeno-canto.org/{recording_id}
// API:         https://xeno-canto.org/api/2/recordings?query=nr:{id}
// Response fields used: gen (genus), sp (species), en (English name),
// loc (locality), cnt (country), lat, lng, rec (recordist), file
// (audio URL), file-name, lic (license), q (quality), date, time,
// length, smp (sample rate), bitrate, type, sex, stage, sono (spectro).

interface XenoCantoRecording {
  id: string;
  gen?: string;
  sp?: string;
  ssp?: string;
  en?: string;
  rec?: string;
  cnt?: string;
  loc?: string;
  lat?: string;
  lng?: string;
  file?: string;
  'file-name'?: string;
  lic?: string;
  q?: string;
  date?: string;
  length?: string;
  type?: string;
  smp?: string;
  bitrate?: string;
}

interface XenoCantoResponse {
  recordings: XenoCantoRecording[];
  numRecordings?: string;
}

function parseXenoCantoId(url: string): string | null {
  const match = url.match(/xeno-canto\.org\/(\d+)/i);
  return match ? match[1] : null;
}

async function fetchXenoCantoRecording(id: string): Promise<XenoCantoRecording | null> {
  const apiUrl = `https://xeno-canto.org/api/2/recordings?query=nr:${id}`;
  const resp = await fetch(apiUrl);
  if (!resp.ok) {
    throw new Error(`xeno-canto returned ${resp.status}`);
  }
  const body = (await resp.json()) as XenoCantoResponse;
  if (!body.recordings || body.recordings.length === 0) return null;
  return body.recordings[0];
}

function xenoCantoToRelicData(
  rec: XenoCantoRecording,
  url: string,
  bind: Pick<ImportRelicBody, 'zoneId' | 'sphereId' | 'cubeId'>,
): Prisma.RelicCreateInput {
  const sciName = [rec.gen, rec.sp, rec.ssp].filter(Boolean).join(' ');
  const englishName = rec.en?.trim() || sciName || `xeno-canto ${rec.id}`;
  const title = englishName
    + (sciName && englishName !== sciName ? ` (${sciName})` : '')
    + (rec.loc ? ` — ${rec.loc}` : '');

  const fileUrl = rec.file ? (rec.file.startsWith('//') ? `https:${rec.file}` : rec.file) : null;
  const lat = rec.lat ? parseFloat(rec.lat) : null;
  const lng = rec.lng ? parseFloat(rec.lng) : null;

  const audioSamples = fileUrl
    ? [{
      url: fileUrl,
      filename: rec['file-name'] ?? null,
      duration: rec.length ?? null,
      recordist: rec.rec ?? null,
      license: rec.lic ? `https:${rec.lic}` : null,
      quality: rec.q ?? null,
      type: rec.type ?? null,
      recorded_at: rec.date ?? null,
      sample_rate: rec.smp ?? null,
      bitrate: rec.bitrate ?? null,
      source: 'xeno-canto',
    }]
    : [];

  return {
    kind: 'recording',
    title,
    phenomenonKey: 'custom', // bird-call doesn't map cleanly to the seed catalogue keys
    fieldSite: [rec.loc, rec.cnt].filter(Boolean).join(', ') || null,
    fieldLat: Number.isFinite(lat) ? lat : null,
    fieldLng: Number.isFinite(lng) ? lng : null,
    captureMethod: 'field_recorder',
    taxonPath: sciName || null,
    audioSamples: audioSamples as Prisma.InputJsonValue,
    sourceProvenance: 'xeno-canto',
    sourceUrl: url,
    cubeIds: bind.cubeId ? [bind.cubeId] : [],
    zoneIds: bind.zoneId ? [bind.zoneId] : [],
    sphereIds: bind.sphereId ? [bind.sphereId] : [],
    tags: ['bird', 'xeno-canto'],
  };
}

// ----------------------------------------------------------------------
// Routes
// ----------------------------------------------------------------------

export async function relicRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /relics — create
  fastify.post('/relics', async (request, reply) => {
    const body = request.body as CreateRelicBody;
    if (!body.title) return reply.code(400).send({ error: 'title is required' });

    const relic = await prisma.relic.create({
      data: {
        kind: body.kind ?? 'recording',
        title: body.title,
        phenomenonKey: body.phenomenonKey ?? null,
        fieldSite: body.fieldSite ?? null,
        fieldLat: body.fieldLat ?? null,
        fieldLng: body.fieldLng ?? null,
        captureMethod: body.captureMethod ?? null,
        captureGearNotes: body.captureGearNotes ?? null,
        rawSampleUrl: body.rawSampleUrl ?? null,
        taxonPath: body.taxonPath ?? null,
        ncbiTaxid: body.ncbiTaxid ?? null,
        gbifTaxonkey: body.gbifTaxonkey ?? null,
        iucnStatus: body.iucnStatus ?? null,
        habitat: body.habitat ?? null,
        strangeness: body.strangeness ?? 0,
        saroIndex: body.saroIndex ?? 0,
        mythicPosture: body.mythicPosture ?? null,
        bodyMd: body.bodyMd ?? null,
        audioSamples: body.audioSamples as Prisma.InputJsonValue | undefined,
        visualSamples: body.visualSamples as Prisma.InputJsonValue | undefined,
        cubeIds: body.cubeIds ?? [],
        zoneIds: body.zoneIds ?? [],
        sphereIds: body.sphereIds ?? [],
        stelaIds: body.stelaIds ?? [],
        cipherIds: body.cipherIds ?? [],
        characterIds: body.characterIds ?? [],
        sourceProvenance: body.sourceProvenance ?? null,
        sourceUrl: body.sourceUrl ?? null,
        tags: body.tags ?? [],
      },
    });
    return reply.code(201).send(relic);
  });

  // GET /relics — list with filters
  fastify.get<{ Querystring: ListRelicsQuery }>('/relics', async (request, reply) => {
    const { kind, phenomenonKey, minStrangeness, minSaro, zoneId, sphereId, cubeId, q } =
      request.query;

    const where: Prisma.RelicWhereInput = {};
    if (kind) where.kind = kind;
    if (phenomenonKey) where.phenomenonKey = phenomenonKey;
    if (minStrangeness) where.strangeness = { gte: parseFloat(minStrangeness) };
    if (minSaro) where.saroIndex = { gte: parseFloat(minSaro) };
    if (zoneId) where.zoneIds = { has: zoneId };
    if (sphereId) where.sphereIds = { has: sphereId };
    if (cubeId) where.cubeIds = { has: cubeId };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { taxonPath: { contains: q, mode: 'insensitive' } },
        { mythicPosture: { contains: q, mode: 'insensitive' } },
        { bodyMd: { contains: q, mode: 'insensitive' } },
      ];
    }

    const relics = await prisma.relic.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return reply.send(relics);
  });

  // GET /relics/:id
  fastify.get<{ Params: { id: string } }>('/relics/:id', async (request, reply) => {
    const relic = await prisma.relic.findUnique({ where: { id: request.params.id } });
    if (!relic) return reply.code(404).send({ error: 'Relic not found' });
    return reply.send(relic);
  });

  // PATCH /relics/:id
  fastify.patch<{ Params: { id: string } }>('/relics/:id', async (request, reply) => {
    const body = request.body as UpdateRelicBody;
    const existing = await prisma.relic.findUnique({ where: { id: request.params.id } });
    if (!existing) return reply.code(404).send({ error: 'Relic not found' });

    const relic = await prisma.relic.update({
      where: { id: request.params.id },
      data: {
        kind: body.kind,
        title: body.title,
        phenomenonKey: body.phenomenonKey,
        fieldSite: body.fieldSite,
        fieldLat: body.fieldLat,
        fieldLng: body.fieldLng,
        captureMethod: body.captureMethod,
        captureGearNotes: body.captureGearNotes,
        rawSampleUrl: body.rawSampleUrl,
        taxonPath: body.taxonPath,
        ncbiTaxid: body.ncbiTaxid,
        gbifTaxonkey: body.gbifTaxonkey,
        iucnStatus: body.iucnStatus,
        habitat: body.habitat,
        strangeness: body.strangeness,
        saroIndex: body.saroIndex,
        mythicPosture: body.mythicPosture,
        bodyMd: body.bodyMd,
        audioSamples: body.audioSamples as Prisma.InputJsonValue | undefined,
        visualSamples: body.visualSamples as Prisma.InputJsonValue | undefined,
        cubeIds: body.cubeIds,
        zoneIds: body.zoneIds,
        sphereIds: body.sphereIds,
        stelaIds: body.stelaIds,
        cipherIds: body.cipherIds,
        characterIds: body.characterIds,
        sourceProvenance: body.sourceProvenance,
        sourceUrl: body.sourceUrl,
        tags: body.tags,
      },
    });
    return reply.send(relic);
  });

  // DELETE /relics/:id
  fastify.delete<{ Params: { id: string } }>('/relics/:id', async (request, reply) => {
    const existing = await prisma.relic.findUnique({ where: { id: request.params.id } });
    if (!existing) return reply.code(404).send({ error: 'Relic not found' });
    await prisma.relic.delete({ where: { id: request.params.id } });
    return reply.code(204).send();
  });

  // POST /relics/import_from_url — provider-detecting importer
  fastify.post('/relics/import_from_url', async (request, reply) => {
    const body = request.body as ImportRelicBody;
    if (!body.url) return reply.code(400).send({ error: 'url is required' });

    // Provider detection by URL pattern
    if (/xeno-canto\.org\/\d+/i.test(body.url)) {
      const xcId = parseXenoCantoId(body.url);
      if (!xcId) return reply.code(400).send({ error: 'Could not parse xeno-canto id from URL' });
      try {
        const rec = await fetchXenoCantoRecording(xcId);
        if (!rec) {
          return reply.code(404).send({ error: 'xeno-canto returned no recordings for that id' });
        }
        const data = xenoCantoToRelicData(rec, body.url, {
          zoneId: body.zoneId,
          sphereId: body.sphereId,
          cubeId: body.cubeId,
        });
        const relic = await prisma.relic.create({ data });
        return reply.code(201).send(relic);
      } catch (e) {
        return reply.code(502).send({ error: `xeno-canto import failed: ${(e as Error).message}` });
      }
    }

    return reply.code(400).send({
      error: 'No importer matched this URL. Supported today: xeno-canto.org. '
        + 'GBIF, iNaturalist, OBIS, Macaulay, IUCN coming next.',
    });
  });
}

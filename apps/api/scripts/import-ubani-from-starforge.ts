/**
 * Import Ubani's identity from Starforge in one shot.
 *
 * Run from apps/api:
 *   pnpm tsx scripts/import-ubani-from-starforge.ts [starforge_user_id]
 *
 * If starforge_user_id is not provided, defaults to "default" which
 * matches Starforge's single-tenant behaviour. Override via the
 * positional arg or STARFORGE_USER_ID env var.
 *
 * Locks identity fields after import so subsequent generator passes
 * cannot overwrite Ubani's bio.
 */

import { prisma } from '../src/db.js';

const API_URL = process.env.BOVEDA_API_URL || `http://localhost:${process.env.PORT || 5130}`;
const API_KEY = process.env.API_KEY || 'ophelian-dev-key-2026';
// Starforge's subtaste cache keys real quiz results under
// "default_user" (not "default"). Using "default" hits the
// auto-derived classification, which is shallow. Default to the
// quiz cache id.
const STARFORGE_USER_ID =
  process.argv[2] || process.env.STARFORGE_USER_ID || 'default_user';
const EMAIL = process.env.UBANI_EMAIL || 'bomac1193@gmail.com';

async function main() {
  const ubani = await prisma.character.findFirst({
    where: { name: { equals: 'Ubani', mode: 'insensitive' } },
  });

  if (!ubani) {
    console.error('No Ubani character found in Bóveda. Create one first.');
    process.exit(1);
  }

  console.log(`Found Ubani: ${ubani.id}`);
  console.log(`Importing from Starforge user "${STARFORGE_USER_ID}".`);

  const res = await fetch(`${API_URL}/characters/${ubani.id}/import-from-starforge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      starforgeUserId: STARFORGE_USER_ID,
      email: EMAIL,
      markAsUser: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Import failed (${res.status}): ${errText}`);
    process.exit(1);
  }

  const result = await res.json() as {
    name: string;
    isUser: boolean;
    bio: string;
    subtasteCode: string | null;
    identity: { locked: string[]; source: string };
  };

  console.log('');
  console.log(`Imported. ${result.name} is now isUser=${result.isUser}.`);
  console.log(`Subtaste designation: ${result.subtasteCode ?? '(none)'}`);
  console.log(`Locked fields: ${result.identity.locked.join(', ')}`);
  console.log(`Source: ${result.identity.source}`);
  console.log('');
  console.log('Bio:');
  console.log(`  ${result.bio}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

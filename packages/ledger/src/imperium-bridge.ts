// Ledger -> Imperium settlement bridge.
//
// Maps a computed MonthlySettlement into the on-chain payloads the
// Imperium VoicePayoutModule expects, one depositSynthesisRoyalty call
// per (voice asset, token) aggregate. The bridge prepares calldata-ready
// payloads and leaves transaction signing to the operator wallet layer;
// nothing here holds keys.
//
// Flow (per VOICE_PROTOCOL_INTEGRATION.md section 4):
//   1. computeMonthlySettlement(month) on the ledger
//   2. prepareImperiumBatch(settlement, resolver) here
//   3. operator signs + submits each payload to VoicePayoutModule
//   4. confirmSettlement(txHashes) marks the ledger events settled

import type { MonthlySettlement } from './index.js';

/** Mirrors VoicePayoutModule.depositSynthesisRoyalty's argument list. */
export interface VoiceRoyaltyPayload {
  assetId: number;            // Imperium VoiceRegistry asset id
  secondsUsed: number;        // Whole synthesized seconds in the batch
  amountCents: number;        // Settlement amount (converted to token units by the submitter)
  usageRef: string;           // keccak/sha256 hash over the included ledger event ids
  ownerId: string;            // Ledger owner this aggregate belongs to
  eventIds: string[];         // Ledger events covered, for confirm-back
}

export interface ImperiumBatch {
  month: string;
  payloads: VoiceRoyaltyPayload[];
  totalAmountCents: number;
  skipped: { ownerId: string; reason: string }[];
}

export interface ImperiumBridgeDeps {
  /**
   * Resolve a ledger owner (voice profile owner) to their Imperium
   * voice asset id. Returns null when the voice was never registered
   * on-chain; those owners settle off-chain and are reported in
   * `skipped`.
   */
  resolveVoiceAssetId: (ownerId: string) => Promise<number | null>;
  /** Stable hash for the usage reference; sha256 hex is fine. */
  hashUsageRef: (eventIds: string[]) => string;
}

export async function prepareImperiumBatch(
  settlement: MonthlySettlement,
  deps: ImperiumBridgeDeps
): Promise<ImperiumBatch> {
  const payloads: VoiceRoyaltyPayload[] = [];
  const skipped: ImperiumBatch['skipped'] = [];

  for (const owner of settlement.owners) {
    if (owner.totalRevenueCents <= 0) {
      skipped.push({ ownerId: owner.ownerId, reason: 'zero revenue' });
      continue;
    }

    const assetId = await deps.resolveVoiceAssetId(owner.ownerId);
    if (assetId === null) {
      skipped.push({ ownerId: owner.ownerId, reason: 'no on-chain voice asset' });
      continue;
    }

    const eventIds = owner.events.map((e: { eventId: string }) => e.eventId);
    payloads.push({
      assetId,
      // The ledger does not currently aggregate seconds per owner; the
      // contract treats secondsUsed as informational, so event count
      // stands in until the ledger carries seconds through settlement.
      secondsUsed: owner.eventCount,
      amountCents: owner.totalRevenueCents,
      usageRef: deps.hashUsageRef(eventIds),
      ownerId: owner.ownerId,
      eventIds,
    });
  }

  return {
    month: settlement.month,
    payloads,
    totalAmountCents: payloads.reduce((s, p) => s + p.amountCents, 0),
    skipped,
  };
}

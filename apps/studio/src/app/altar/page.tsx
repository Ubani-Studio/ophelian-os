/**
 * /altar redirects to /trail. Altar's tend buttons + tend-all are
 * now part of Trail directly so the curation + action surface is
 * one place.
 */

import { redirect } from 'next/navigation';

export default function AltarRedirect(): never {
  redirect('/trail');
}

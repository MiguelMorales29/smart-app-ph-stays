import { describe, expect, it } from 'vitest';

import { fixedClock } from '../time/index.js';
import { resolveDemoWorld, summarizeDemoWorld } from './index.js';

const GOLDEN_CLOCK_ISO = '2026-12-10T10:00:00+08:00';

describe('marketing pack snapshot at golden clock', () => {
  it('matches snapshot for summary and key records', () => {
    const clock = fixedClock(GOLDEN_CLOCK_ISO);
    const world = resolveDemoWorld({ pack: 'marketing', clock });
    const summary = summarizeDemoWorld(world, 'marketing', clock);

    expect({
      summary,
      accounts: world.accounts.map((a) => ({
        id: a.id,
        name: a.name,
        contact_email: a.contact_email,
        is_demo: a.is_demo,
      })),
      properties: world.properties.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        cancellation_preset: p.cancellation_preset,
      })),
      units: world.units.map((u) => ({
        id: u.id,
        slug: u.slug,
        name: u.name,
        mode: u.mode,
        unit_type: u.unit_type,
      })),
      bookings: world.bookings.map((b) => ({
        id: b.id,
        booking_no: b.booking_no,
        unit_id: b.unit_id,
        status: b.status,
        nights: b.nights,
        total_centavos: b.total_centavos,
        required_centavos: b.required_centavos,
      })),
    }).toMatchSnapshot();
  });
});

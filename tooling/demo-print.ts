import {
  addDays,
  demoPackSchema,
  eachNight,
  fixedClock,
  manilaToday,
  nightsBetween,
  resolveDemoWorld,
  summarizeDemoWorld,
  systemClock,
  type Clock,
  type DemoPack,
} from '@smartapp/core';

function parseArgs(argv: readonly string[]): { pack: DemoPack; clock: Clock } {
  let pack: DemoPack = 'marketing';
  let clock: Clock = systemClock;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--pack') {
      const parsed = demoPackSchema.safeParse(argv[i + 1]);
      if (!parsed.success) {
        throw new Error(
          `Invalid --pack value "${String(argv[i + 1])}". Expected one of: marketing, qa, empty, busy.`,
        );
      }
      pack = parsed.data;
      i += 1;
    } else if (arg === '--date') {
      const val = argv[i + 1];
      if (!val) {
        throw new Error('Missing YYYY-MM-DD value after --date.');
      }
      clock = fixedClock(`${val}T10:00:00+08:00`);
      i += 1;
    }
  }

  return { pack, clock };
}

function main(): void {
  const { pack, clock } = parseArgs(process.argv.slice(2));
  const world = resolveDemoWorld({ pack, clock });
  const summary = summarizeDemoWorld(world, pack, clock);
  const windowStart = manilaToday(clock);
  const windowEnd = addDays(windowStart, 30);
  const windowNights = eachNight(windowStart, windowEnd);

  console.log(`=== Smart App PH Stays — Demo World (${summary.pack}) ===`);
  console.log(`Manila today: ${summary.today} (30-day window: ${windowStart} .. ${windowEnd})\n`);

  console.log('--- Wave 1 Table Row Counts (48 tables) ---');
  let totalRows = 0;
  for (const [table, count] of Object.entries(summary.tableCounts)) {
    totalRows += count;
    console.log(`  ${table.padEnd(28, ' ')} ${String(count).padStart(5, ' ')}`);
  }
  console.log(`  ${'TOTAL'.padEnd(28, ' ')} ${String(totalRows).padStart(5, ' ')}\n`);

  console.log('--- Next 30 Days Occupancy per Unit ---');
  console.log('Legend: B = booking, H = hold, X = block, L = lease, . = open\n');

  let shortStayOccupiedTotal = 0;
  let shortStayCapacityTotal = 0;

  for (const prop of world.properties) {
    console.log(`${prop.name} (${prop.slug}, ${prop.city})`);
    const propUnits = world.units.filter((u) => u.property_id === prop.id);

    for (const unit of propUnits) {
      const activeOcc = world.unit_occupancy.filter((o) => o.unit_id === unit.id && o.active);
      let bookedNights = 0;
      let holdNights = 0;
      let blockedNights = 0;
      const barChars: string[] = [];

      for (const night of windowNights) {
        const hit = activeOcc.find(
          (occ) =>
            nightsBetween(occ.during.start, night) >= 0 &&
            (occ.during.end === null || nightsBetween(night, occ.during.end) > 0),
        );
        if (!hit) {
          barChars.push('.');
        } else if (hit.kind === 'booking') {
          bookedNights += 1;
          barChars.push('B');
        } else if (hit.kind === 'hold') {
          holdNights += 1;
          barChars.push('H');
        } else if (hit.kind === 'block') {
          blockedNights += 1;
          barChars.push('X');
        } else {
          barChars.push('L');
        }
      }

      const occupiedNights = bookedNights + holdNights + blockedNights;
      const occupiedPct = ((occupiedNights / windowNights.length) * 100).toFixed(1);

      if (unit.mode === 'short_stay') {
        shortStayOccupiedTotal += occupiedNights;
        shortStayCapacityTotal += windowNights.length;
      }

      const stats =
        unit.mode === 'short_stay'
          ? `${String(occupiedNights).padStart(2, ' ')}/30 nights (${occupiedPct.padStart(5, ' ')}%) [booked=${bookedNights}, hold=${holdNights}, blocked=${blockedNights}]`
          : `long_term (${unit.unit_type})`;

      console.log(`  - ${unit.name.padEnd(28, ' ')} [${barChars.join('')}] ${stats}`);
    }
    console.log('');
  }

  if (shortStayCapacityTotal > 0) {
    const totalOccPct = ((shortStayOccupiedTotal / shortStayCapacityTotal) * 100).toFixed(1);
    console.log(
      `Short-stay 30-day summary: ${shortStayOccupiedTotal}/${shortStayCapacityTotal} nights occupied (${totalOccPct}%).`,
    );
  }
}

main();

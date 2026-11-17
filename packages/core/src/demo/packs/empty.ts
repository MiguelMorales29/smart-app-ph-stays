import { manilaToday } from '../../time/index.js';
import type { Clock } from '../../time/index.js';
import { DEMO_IDS } from '../ids.js';
import { buildExtraStateOwners } from '../people.js';
import { createEmptyDemoWorld, seedPlatformBase } from './shared.js';
import type { DemoWorld } from './shared.js';

export function buildEmptyPack(clock: Clock): DemoWorld {
  const today = manilaToday(clock);
  const world = createEmptyDemoWorld();

  seedPlatformBase(world, today);

  const extra = buildExtraStateOwners(today);
  const emptyProfile = extra.profiles.find((p) => p.id === DEMO_IDS.people.owners.empty);
  const emptyAccount = extra.accounts.find(
    (a) => a.id === DEMO_IDS.people.extraAccounts.emptyAccount,
  );
  const emptyMember = extra.members.find((m) => m.id === DEMO_IDS.people.extraAccounts.emptyMember);
  const emptySubscription = extra.subscriptions.find(
    (s) => s.id === DEMO_IDS.people.extraAccounts.emptySubscription,
  );

  if (!emptyProfile || !emptyAccount || !emptyMember || !emptySubscription) {
    throw new Error('Missing empty owner records');
  }

  world.profiles.push(emptyProfile);
  world.accounts.push(emptyAccount);
  world.account_members.push(emptyMember);
  world.subscriptions.push(emptySubscription);
  world.account_counters.push(
    {
      account_id: emptyAccount.id,
      kind: 'booking',
      last_value: 0,
      updated_at: emptyAccount.updated_at,
    },
    {
      account_id: emptyAccount.id,
      kind: 'receipt',
      last_value: 0,
      updated_at: emptyAccount.updated_at,
    },
  );

  return world;
}

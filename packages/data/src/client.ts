import type { AppError, Clock, DemoPack, ErrorCode } from '@smartapp/core';

import type { DataSource } from './source.js';

export type DataClientConfig =
  | {
      readonly adapter: 'memory';
      readonly pack?: DemoPack;
      readonly clock?: Clock;
      readonly storefrontOrigin?: string;
      readonly latencyMs?: number;
      readonly failWith?: ErrorCode | AppError;
      readonly validateOutput?: boolean;
    }
  | {
      readonly adapter: 'http';
      readonly apiBaseUrl: string;
      readonly validateOutput?: boolean;
    };

/**
 * Picks the DataSource adapter from app-supplied configuration.
 * Reads no environment variables directly; memory adapter + demo world
 * are dynamically imported so builds using HTTP do not bundle mocks.
 */
export async function getDataSource(config: DataClientConfig): Promise<DataSource> {
  if (config.adapter === 'memory') {
    const { createMemorySource } = await import('./mocks/memory.js');
    return createMemorySource({
      pack: config.pack ?? 'marketing',
      ...(config.clock !== undefined ? { clock: config.clock } : {}),
      ...(config.storefrontOrigin !== undefined
        ? { storefrontOrigin: config.storefrontOrigin }
        : {}),
      ...(config.latencyMs !== undefined ? { latencyMs: config.latencyMs } : {}),
      ...(config.failWith !== undefined ? { failWith: config.failWith } : {}),
      ...(config.validateOutput !== undefined ? { validateOutput: config.validateOutput } : {}),
    });
  }

  throw new Error(
    `HTTP DataSource adapter (for ${config.apiBaseUrl}) is not implemented yet; it arrives in Phase 11.`,
  );
}

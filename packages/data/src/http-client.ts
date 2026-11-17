import type { DataSource } from './source.js';

export interface HttpClientConfig {
  readonly apiBaseUrl: string;
  readonly validateOutput?: boolean;
}

/**
 * Pure HTTP client loader for production builds.
 * Contains zero imports from demo data, memory mocks, or dev switches so
 * production tree-shaking removes mock/demo code completely.
 */
export async function getHttpDataSource(config: HttpClientConfig): Promise<DataSource> {
  throw new Error(`HTTP DataSource adapter (for ${config.apiBaseUrl}) is available from Phase 11.`);
}

import { appError, errorCodeSchema, type AppError, type Result } from '@smartapp/core';
import type { DataSource, Session } from '@smartapp/data';

import { useDashboard } from '@/app/dashboard-context';

export class DataSourceAppError extends Error {
  public readonly appError: AppError;

  public constructor(error: AppError) {
    super(error.message);
    this.name = 'DataSourceAppError';
    this.appError = error;
  }
}

export function isDataSourceAppError(value: unknown): value is DataSourceAppError {
  return value instanceof DataSourceAppError;
}

function isPlainAppError(value: unknown): value is AppError {
  if (typeof value !== 'object' || value === null) return false;
  if (!('code' in value) || !('message' in value)) return false;
  if (typeof value.code !== 'string' || typeof value.message !== 'string') return false;
  return errorCodeSchema.safeParse(value.code).success;
}

export function extractAppError(value: unknown): AppError {
  if (isDataSourceAppError(value)) {
    return value.appError;
  }
  if (isPlainAppError(value)) {
    return value;
  }
  if (value instanceof Error) {
    return appError('not_allowed', value.message);
  }
  return appError('not_allowed');
}

export function unwrapResult<T>(result: Result<T>): T {
  if (!result.ok) {
    throw new DataSourceAppError(result.error);
  }
  return result.data;
}

export function createIdempotencyKey(prefix: string): string {
  const id =
    typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${id}`;
}

export interface ActiveDataClient {
  readonly source: DataSource | null;
  readonly session: Session;
  readonly accountId: string | null;
  readonly isOwnerReady: boolean;
}

export function useActiveDataClient(): ActiveDataClient {
  const { client } = useDashboard();
  const source = client?.source ?? null;
  const session: Session = client?.session ?? { role: 'guest' };
  const accountId = client?.accountId ?? null;
  const isOwnerReady = source !== null && session.role === 'owner' && accountId !== null;

  return {
    source,
    session,
    accountId,
    isOwnerReady,
  };
}

export function requireOwnerClient(active: ActiveDataClient): {
  readonly source: DataSource;
  readonly session: Session;
  readonly accountId: string;
} {
  if (active.source === null || active.accountId === null || active.session.role !== 'owner') {
    throw new DataSourceAppError(appError('not_allowed', 'Sign in as an owner to continue.'));
  }
  return {
    source: active.source,
    session: active.session,
    accountId: active.accountId,
  };
}

export function requireSourceClient(active: ActiveDataClient): {
  readonly source: DataSource;
  readonly session: Session;
} {
  if (active.source === null) {
    throw new DataSourceAppError(appError('not_allowed', 'Data source is still loading.'));
  }
  return {
    source: active.source,
    session: active.session,
  };
}

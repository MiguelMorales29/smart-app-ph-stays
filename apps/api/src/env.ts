import { z } from 'zod';

export const NODE_ENVS = ['development', 'test', 'production'] as const;

export const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVS).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4100),
  CORS_ORIGINS: z.string().min(1).default('http://localhost:3100,http://localhost:5174'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}

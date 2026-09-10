const REQUIRED_ENV_VARS = [
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'JWT_SECRET',
  'DATABASE_URL',
] as const;

export type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

function loadEnv(): Record<RequiredEnvVar, string> {
  const env = {} as Record<RequiredEnvVar, string>;

  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    env[key] = value;
  }

  return env;
}

let cached: Record<RequiredEnvVar, string> | null = null;

function getEnv(): Record<RequiredEnvVar, string> {
  if (!cached) {
    cached = loadEnv();
  }
  return cached;
}

/**
 * Lazy env proxy: validation only runs when a value is actually read.
 * This keeps the admin secrets out of the build-time surface (next build
 * must not require ADMIN_USERNAME/ADMIN_PASSWORD/JWT_SECRET to be present)
 * while still failing loudly at request time with a precise error if a
 * required variable is missing.
 */
export const env = new Proxy({} as Record<RequiredEnvVar, string>, {
  get: (target, prop) => {
    if (typeof prop === 'string' && REQUIRED_ENV_VARS.includes(prop as RequiredEnvVar)) {
      return getEnv()[prop as RequiredEnvVar];
    }
    return target[prop as keyof typeof target];
  },
});
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

export const env = loadEnv();
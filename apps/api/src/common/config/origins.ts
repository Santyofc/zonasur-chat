const DEFAULT_DEV_ORIGINS = ["http://localhost:3000"];

export function getAllowedOrigins(): string[] {
  const configuredOrigins =
    process.env.ALLOWED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv !== "development" && configuredOrigins.length === 0) {
    throw new Error(
      "ALLOWED_ORIGINS must be set when NODE_ENV is not development",
    );
  }

  return configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_DEV_ORIGINS;
}

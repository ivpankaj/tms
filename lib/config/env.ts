/**
 * NexusCRM Centralized Environment Configuration
 * 
 * Provides type-safe access to all environment variables and sensitive credentials.
 * Reads directly from process.env with fallback mechanisms for safe local development.
 */

export const env = {
  // 1. Database
  database: {
    uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexuscrm",
    dbName: process.env.MONGODB_DB_NAME || "nexuscrm",
  },

  // 2. Authentication & Cryptography
  auth: {
    jwtSecret:
      process.env.JWT_SECRET || "nexus-crm-default-jwt-secret-key-replace-in-env-32-chars",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "",
    cookieName: process.env.SESSION_COOKIE_NAME || "nexus_token",
    encryptionKey: process.env.ENCRYPTION_KEY || "",
  },

  // 3. Application Core
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
    port: parseInt(process.env.PORT || "3000", 10),
  },

  // 4. Transactional Email (Resend & SMTP)
  email: {
    provider: (process.env.EMAIL_PROVIDER || "resend") as "resend" | "smtp" | "mock",
    from: process.env.EMAIL_FROM || "notifications@nexus.io",
    resendApiKey: process.env.RESEND_API_KEY || "",
    smtp: {
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      user: process.env.SMTP_USER || "",
      password: process.env.SMTP_PASSWORD || "",
      secure: process.env.SMTP_SECURE === "true",
    },
  },

  // 5. Cloud File Storage (S3 / Local Disk)
  storage: {
    driver: (process.env.STORAGE_DRIVER || "local") as "s3" | "local",
    awsRegion: process.env.AWS_REGION || "us-east-1",
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    s3Bucket: process.env.AWS_S3_BUCKET || "nexus-crm-attachments",
    endpoint: process.env.AWS_ENDPOINT || "",
    publicUrl: process.env.AWS_S3_PUBLIC_URL || "",
  },

  // 6. Real-time WebSockets
  realtime: {
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
    socketPort: parseInt(process.env.SOCKET_PORT || "3001", 10),
  },

  // 7. Webhooks & Internal Integrations
  webhooks: {
    secret: process.env.WEBHOOK_SECRET || "",
    internalApiKey: process.env.INTERNAL_API_KEY || "",
  },

  // 8. Billing & Payments (Stripe)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  },

  // 9. Observability
  logging: {
    level: process.env.LOG_LEVEL || "debug",
    sentryDsn: process.env.SENTRY_DSN || "",
  },
};

/**
 * Diagnostic helper to verify whether essential production secrets are configured.
 */
export function checkConfigHealth(): {
  healthy: boolean;
  missingKeys: string[];
  warnings: string[];
} {
  const missingKeys: string[] = [];
  const warnings: string[] = [];

  if (!process.env.MONGODB_URI) {
    missingKeys.push("MONGODB_URI");
  }

  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.includes("your_jwt_secret") ||
    process.env.JWT_SECRET.length < 32
  ) {
    warnings.push("JWT_SECRET is either using default placeholder or is under 32 characters.");
  }

  if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
    warnings.push("No email delivery provider key configured (RESEND_API_KEY or SMTP_HOST). Email dispatch will run in mock mode.");
  }

  if (process.env.STORAGE_DRIVER === "s3" && (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)) {
    warnings.push("STORAGE_DRIVER is set to 's3' but AWS credentials are empty. Local disk storage will be used.");
  }

  return {
    healthy: missingKeys.length === 0,
    missingKeys,
    warnings,
  };
}

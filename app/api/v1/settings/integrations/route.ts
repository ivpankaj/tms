import { NextRequest } from "next/server";
import { authenticateRequest, apiSuccess } from "@/lib/auth/api-auth";
import { env, checkConfigHealth } from "@/lib/config/env";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest(req, "settings:read");
  if (errorResponse) return errorResponse;

  const health = checkConfigHealth();

  const integrations = [
    {
      id: "mongodb",
      name: "MongoDB Database",
      configured: Boolean(process.env.MONGODB_URI),
      type: "database",
      status: "connected",
      details: env.database.uri.includes("mongodb+srv://") ? "MongoDB Atlas (Cloud)" : "Self-Hosted / Local MongoDB",
    },
    {
      id: "resend",
      name: "Resend Email Service",
      configured: Boolean(env.email.resendApiKey && env.email.resendApiKey.startsWith("re_") && !env.email.resendApiKey.includes("your_resend_api_key")),
      type: "email",
      status: (env.email.resendApiKey && env.email.resendApiKey.startsWith("re_") && !env.email.resendApiKey.includes("your_resend_api_key")) ? "active" : "mock_mode",
      details: `Sender: ${env.email.from}`,
    },
    {
      id: "s3",
      name: "AWS S3 / Object Storage",
      configured: Boolean(env.storage.awsAccessKeyId && !env.storage.awsAccessKeyId.includes("your_aws_access_key")),
      type: "storage",
      status: (env.storage.awsAccessKeyId && !env.storage.awsAccessKeyId.includes("your_aws_access_key")) ? "connected" : "local_disk",
      details: env.storage.driver === "s3" ? `Bucket: ${env.storage.s3Bucket} (${env.storage.awsRegion})` : "Local filesystem (public/uploads)",
    },
    {
      id: "stripe",
      name: "Stripe Payments & Billing",
      configured: Boolean(env.stripe.secretKey && !env.stripe.secretKey.includes("your_stripe_secret_key")),
      type: "payments",
      status: (env.stripe.secretKey && !env.stripe.secretKey.includes("your_stripe_secret_key")) ? "live" : "not_configured",
      details: env.stripe.secretKey ? "Configured in .env" : "Add STRIPE_SECRET_KEY in .env to activate",
    },
    {
      id: "webhooks",
      name: "Event Webhooks Relay",
      configured: Boolean(env.webhooks.secret && !env.webhooks.secret.includes("your_webhook_signing_secret")),
      type: "webhook",
      status: (env.webhooks.secret && !env.webhooks.secret.includes("your_webhook_signing_secret")) ? "secured" : "unsecured",
      details: env.webhooks.secret ? "Payload signing active" : "Using fallback open delivery",
    },
  ];

  return apiSuccess({
    integrations,
    systemHealth: health,
  });
}

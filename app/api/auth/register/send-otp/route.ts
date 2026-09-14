import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { User, OtpVerification } from "@/lib/db/models";
import { apiError, apiSuccess } from "@/lib/auth/api-auth";
import { sendOtpEmail } from "@/lib/services/email";
import { env } from "@/lib/config/env";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return apiError("Valid email is required", "VALIDATION_ERROR", 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return apiError("Please enter a valid email address", "INVALID_EMAIL", 400);
    }

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail, isDeleted: false });
    if (existing) {
      return apiError(
        "An account with this email already exists. Please sign in instead.",
        "USER_EXISTS",
        409
      );
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

    // Upsert OTP record
    await OtpVerification.deleteMany({ email: cleanEmail });
    await OtpVerification.create({
      email: cleanEmail,
      otp,
      expiresAt,
      verified: false,
      attempts: 0,
    });

    console.log(`[OTP Verification] Generated code for ${cleanEmail}: ${otp}`);

    // Send email via Resend
    const sendResult = await sendOtpEmail(cleanEmail, otp);

    if (!sendResult.success) {
      console.error("[OTP Verification] Email dispatch failed:", sendResult.error);
      return apiError(
        sendResult.error || "Failed to deliver verification code. Please check your email and try again.",
        "EMAIL_SEND_FAILED",
        500
      );
    }

    return apiSuccess({
      message: "Verification code sent to your email",
      email: cleanEmail,
      expiresInMinutes: 10,
    });
  } catch (err: any) {
    console.error("send-otp error:", err);
    return apiError(err.message || "Failed to process verification code", "INTERNAL_ERROR", 500);
  }
}

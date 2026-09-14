import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { OtpVerification } from "@/lib/db/models";
import { apiError, apiSuccess } from "@/lib/auth/api-auth";
import { signVerificationToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return apiError("Email and verification code are required", "VALIDATION_ERROR", 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // Find active OTP record
    const record = await OtpVerification.findOne({ email: cleanEmail });

    if (!record) {
      return apiError(
        "No verification request found for this email. Please request a new code.",
        "OTP_NOT_FOUND",
        400
      );
    }

    // Check expiration
    if (new Date() > record.expiresAt) {
      return apiError(
        "Verification code has expired. Please request a new one.",
        "OTP_EXPIRED",
        400
      );
    }

    // Rate limiting attempts
    if (record.attempts >= 5) {
      return apiError(
        "Too many failed attempts. Please request a new verification code.",
        "TOO_MANY_ATTEMPTS",
        429
      );
    }

    // Validate OTP
    if (record.otp !== cleanOtp) {
      record.attempts += 1;
      await record.save();
      const remaining = 5 - record.attempts;
      return apiError(
        `Invalid verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "Please request a new code."}`,
        "INVALID_OTP",
        400
      );
    }

    // Mark verified
    record.verified = true;
    await record.save();

    // Issue cryptographic verification token for safe registration completion
    const verificationToken = signVerificationToken(cleanEmail);

    return apiSuccess({
      verified: true,
      email: cleanEmail,
      verificationToken,
      message: "Email verified successfully",
    });
  } catch (err: any) {
    console.error("verify-otp error:", err);
    return apiError(err.message || "Failed to verify code", "INTERNAL_ERROR", 500);
  }
}

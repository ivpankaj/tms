import jwt from "jsonwebtoken";
import { env } from "@/lib/config/env";

const JWT_SECRET = env.auth.jwtSecret;
const JWT_EXPIRES_IN = (env.auth.jwtExpiresIn || "7d") as jwt.SignOptions["expiresIn"];

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
}

export function signJwt(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function signVerificationToken(email: string): string {
  return jwt.sign({ email, purpose: "register_otp_verified" }, JWT_SECRET, { expiresIn: "15m" });
}

export function verifyVerificationToken(token: string): { email: string; purpose: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload && payload.purpose === "register_otp_verified" && payload.email) {
      return { email: payload.email, purpose: payload.purpose };
    }
    return null;
  } catch {
    return null;
  }
}


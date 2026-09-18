"use server";

import {
  checkAuthRateLimit,
  recordFailedAuthAttempt,
  resetAuthRateLimit,
  getClientIp,
} from "@/lib/rate-limit";

// Official Cloudflare Turnstile test secret key (Always passes)
const CLOUDFLARE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

/**
 * Validates Cloudflare Turnstile token via Cloudflare API
 */
export async function verifyTurnstileCaptcha(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!token || typeof token !== "string") {
    return { success: false, error: "กรุณายืนยันความถูกต้องผ่านระบบตรวจสอบ (CAPTCHA)" };
  }

  const secretKey =
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || CLOUDFLARE_TEST_SECRET_KEY;
  const ip = await getClientIp();

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    formData.append("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const result = await res.json();

    if (result.success) {
      return { success: true };
    } else {
      console.warn("Cloudflare Turnstile verification failed:", result["error-codes"]);
      return {
        success: false,
        error: "การตรวจสอบความปลอดภัยไม่ผ่าน กรุณาลองยืนยันใหม่อีกครั้ง",
      };
    }
  } catch (error: any) {
    console.error("Error connecting to Cloudflare Turnstile:", error);
    // If Cloudflare service is temporarily unreachable, fallback safely or notify
    return {
      success: false,
      error: "ไม่สามารถเชื่อมต่อระบบตรวจสอบความปลอดภัยได้ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * Checks if the client IP is currently rate-limited from logging in
 */
export async function checkLoginRateLimit(): Promise<{
  allowed: boolean;
  remaining: number;
  cooldownSeconds: number;
  error?: string;
}> {
  return checkAuthRateLimit();
}

/**
 * Records a failed login attempt for the client IP
 */
export async function reportFailedLogin(): Promise<{
  blocked: boolean;
  remaining: number;
  cooldownSeconds: number;
}> {
  return recordFailedAuthAttempt();
}

/**
 * Resets rate limit attempts upon successful login
 */
export async function reportSuccessfulLogin(): Promise<void> {
  return resetAuthRateLimit();
}

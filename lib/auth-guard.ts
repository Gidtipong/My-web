import { createServerSupabaseClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { UserRole, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

/**
 * Retrieves the currently logged-in user from Supabase and syncs with PostgreSQL.
 * If user does not exist in DB:
 * - First user in the database becomes ADMIN + APPROVED automatically.
 * - Subsequent signups default to USER + PENDING.
 */
export async function getCurrentDbUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser || !authUser.email) {
      return null;
    }

    const email = authUser.email.toLowerCase().trim();
    let dbUser = await db.user.findUnique({
      where: { email },
    });

    if (!dbUser) {
      const existingUserCount = await db.user.count();
      const isFirstUser = existingUserCount === 0;

      const name =
        authUser.user_metadata?.name ||
        authUser.user_metadata?.full_name ||
        email.split("@")[0].toUpperCase();

      dbUser = await db.user.create({
        data: {
          email,
          name,
          role: isFirstUser ? UserRole.ADMIN : UserRole.USER,
          status: isFirstUser ? UserStatus.APPROVED : UserStatus.PENDING,
        },
      });
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      status: dbUser.status,
    };
  } catch (error) {
    console.error("getCurrentDbUser error:", error);
    return null;
  }
}

/**
 * Enforces that the caller is logged in AND has been APPROVED by an Admin.
 * Used to protect Server Actions and data layer.
 */
export async function requireApprovedUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentDbUser();

  if (!user) {
    throw new Error("UNAUTHORIZED: กรุณาเข้าสู่ระบบก่อนทำรายการ");
  }

  if (user.status !== UserStatus.APPROVED) {
    throw new Error("PENDING_APPROVAL: บัญชีของคุณอยู่ระหว่างรอการอนุมัติจาก Admin");
  }

  return user;
}

/**
 * Enforces that the caller is an APPROVED ADMIN.
 */
export async function requireAdminUser(): Promise<AuthenticatedUser> {
  const user = await requireApprovedUser();

  if (user.role !== UserRole.ADMIN) {
    throw new Error("FORBIDDEN: สิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น");
  }

  return user;
}

/**
 * Server-side page guard.
 * Call at the top of Server Component pages.
 * If user is not logged in, redirects to /login.
 * If user is not approved, redirects to /pending-approval.
 */
export async function guardApprovedPage(): Promise<AuthenticatedUser> {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect("/login");
  }

  if (user.status !== UserStatus.APPROVED) {
    redirect("/pending-approval");
  }

  return user;
}

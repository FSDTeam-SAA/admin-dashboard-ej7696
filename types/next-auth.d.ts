import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    accessToken: string;
    refreshToken: string;
    role: string;
    mustChangePassword: boolean;
    installationId: string;
    user: Record<string, unknown>;
  }

  interface Session {
    accessToken: string;
    refreshToken: string;
    role: string;
    userId: string;
    mustChangePassword: boolean;
    installationId: string;
    error?: string;
    user: DefaultSession["user"] & {
      role?: string;
      [key: string]: unknown;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    role: string;
    userId: string;
    mustChangePassword: boolean;
    installationId: string;
    user: Record<string, unknown>;
    accessTokenExpires: number;
    error?: string;
  }
}

export {};

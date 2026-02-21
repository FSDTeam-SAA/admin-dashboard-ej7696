import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
const trimmedBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const apiBaseUrl = trimmedBaseUrl.endsWith('/api/v1')
  ? trimmedBaseUrl.slice(0, -'/api/v1'.length)
  : trimmedBaseUrl;
const loginUrl = `${apiBaseUrl}/api/v1/auth/login`;
const refreshUrl = `${apiBaseUrl}/api/v1/auth/refresh-token`;

const decodeJwtPayload = (token: string) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, '=');
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
};

const getTokenExpiry = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
};

const refreshAccessToken = async (token: any) => {
  try {
    const response = await axios.post(refreshUrl, {
      refreshToken: token.refreshToken,
    });
    const payload = response.data?.data ?? response.data;

    if (!payload?.accessToken) {
      throw new Error('No access token in refresh response');
    }

    return {
      ...token,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken ?? token.refreshToken,
      accessTokenExpires: getTokenExpiry(payload.accessToken) ?? token.accessTokenExpires,
      error: undefined,
    };
  } catch (error) {
    console.error(' Refresh token error:', error);
    return {
      ...token,
      accessToken: undefined,
      accessTokenExpires: 0,
      refreshToken: undefined,
      error: 'RefreshAccessTokenError',
    };
  }
};

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password required');
          }

          const response = await axios.post(loginUrl, {
            email: credentials.email,
            password: credentials.password,
          });

          const payload = response.data?.data ?? response.data;

          if (payload?.accessToken) {
            return {
              id: payload._id || payload.user?._id,
              email: payload.user?.email ?? payload.email,
              name: payload.user?.name ?? payload.name,
              accessToken: payload.accessToken,
              refreshToken: payload.refreshToken,
              role: payload.role,
              user: payload.user ?? payload,
            };
          }

          throw new Error('Invalid credentials');
        } catch (error: any) {
          console.error('[v0] Auth error:', error.message);
          throw new Error(error.response?.data?.message || 'Authentication failed');
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.role = user.role;
        token.userId = user.id;
        token.user = user.user;
        token.accessTokenExpires = getTokenExpiry(user.accessToken);
        return token;
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires - 60 * 1000) {
        return token;
      }

      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.role = token.role as string;
        session.userId = token.userId as string;
        session.user = token.user as any;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
});

export const { GET, POST } = handlers;

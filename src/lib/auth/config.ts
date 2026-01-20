import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getOne } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'CRM Access',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'admin' },
        password: { label: 'Password', type: 'password', placeholder: 'admin123' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.error('Missing credentials');
          return null;
        }

        try {
          const user = await getOne<{ id: number; username: string; password: string }>(
            'SELECT id, username, password FROM users WHERE username = ?',
            [credentials.username]
          );

          if (!user) {
            console.error(`User not found: ${credentials.username}`);
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          if (!isValidPassword) {
            console.error('Invalid password for user:', credentials.username);
            return null;
          }

          console.log('User authenticated successfully:', user.username);
          return { id: user.id.toString(), name: user.username, email: user.username };
        } catch (error) {
          console.error('Database error during authentication:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: unknown; name: unknown; email: unknown }).id = token.id;
        (session.user as { id: unknown; name: unknown; email: unknown }).name = token.name;
        (session.user as { id: unknown; name: unknown; email: unknown }).email = token.email;
      }
      return session;
    },
  },
};

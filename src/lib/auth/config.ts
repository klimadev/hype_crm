import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getOne } from '@/lib/db';

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

          if (user.password !== credentials.password) {
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
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};

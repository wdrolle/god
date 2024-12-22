// app/api/auth/[...nextauth].ts

import NextAuth from 'next-auth';

type CustomUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  accessToken?: string;
  id?: string;
};

export default NextAuth({
  providers: [
    // Add your providers here
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as CustomUser).accessToken = token.accessToken as string;
        (session.user as CustomUser).id = token.id as string;
      }
      return session;
    },
  },
});
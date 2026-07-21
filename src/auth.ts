import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      if (account && profile && trigger === "signIn") {
        const { prisma } = await import("@/lib/prisma")
        const sub = profile.sub as string
        const email = profile.email as string
        const name = (profile as { name?: string }).name ?? email

        const user = await prisma.user.upsert({
          where: { entraidSub: sub },
          update: { email, name },
          create: { entraidSub: sub, email, name },
        })

        token.entraidSub = sub
        token.userId = user.id
        token.rol = user.rol
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.entraidSub as string
        ;(session.user as any).rol = token.rol as string
      }
      return session
    },
  },
})

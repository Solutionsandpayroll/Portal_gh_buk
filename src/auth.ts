import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
    Credentials({
      id: "admin",
      name: "Administrador",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const adminUser = process.env.ADMIN_USER
        const adminPassword = process.env.ADMIN_PASSWORD
        const adminName = process.env.ADMIN_NAME || "Administrador"
        const adminEmail = process.env.ADMIN_EMAIL || "administrador@solutionsandpayroll.com"

        if (!adminUser || !adminPassword) return null

        const username = credentials?.username as string | undefined
        const password = credentials?.password as string | undefined

        if (username !== adminUser || password !== adminPassword) return null

        const { prisma } = await import("@/lib/prisma")

        const user = await prisma.user.upsert({
          where: { entraidSub: adminEmail },
          update: { rol: "admin", name: adminName, email: adminEmail },
          create: {
            entraidSub: adminEmail,
            email: adminEmail,
            name: adminName,
            rol: "admin",
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          entraidSub: user.entraidSub,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile, user, trigger }) {
      // Login con credenciales de administrador
      if (account?.provider === "admin" && user) {
        token.entraidSub = (user as any).entraidSub as string
        token.userId = (user as any).id as string
        token.rol = "admin"
        return token
      }

      // Login con Microsoft Entra ID
      if (account && profile && trigger === "signIn") {
        const { prisma } = await import("@/lib/prisma")
        const sub = profile.sub as string
        const email = profile.email as string
        const name = (profile as { name?: string }).name ?? email

        const dbUser = await prisma.user.upsert({
          where: { entraidSub: sub },
          update: { email, name },
          create: { entraidSub: sub, email, name },
        })

        token.entraidSub = sub
        token.userId = dbUser.id
        token.rol = dbUser.rol
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

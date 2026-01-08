import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { createClient } from '../../lib/supabase/server'
import bcrypt from 'bcryptjs'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')
      const isOnLogin = nextUrl.pathname === '/admin/login'

      // Si está en login y ya está logueado, redirigir a dashboard
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL('/admin/dashboard', nextUrl))
      }

      // Si está en admin (NO login) y NO está logueado, denegar
      if (isOnAdmin && !isOnLogin && !isLoggedIn) {
        return false
      }

      return true
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const supabase = await createClient()

        const { data: admin, error } = await supabase
          .from('administradores')
          .select('*')
          .eq('email', credentials.email)
          .eq('activo', true)
          .single()

        if (error || !admin) {
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          admin.password_hash
        )

        if (!passwordMatch) {
          return null
        }

        return {
          id: admin.id.toString(),
          email: admin.email,
          name: `${admin.nombres} ${admin.apellidos}`,
        }
      },
    }),
  ],
}
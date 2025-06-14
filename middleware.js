import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()

  const publicPaths = ['/login', '/signup', '/reset-password']
  const path = req.nextUrl.pathname

  if (publicPaths.includes(path)) {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  } catch (err) {
    console.error('Middleware error:', err)
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/(.*)'],
}

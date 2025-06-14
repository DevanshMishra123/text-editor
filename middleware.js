import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  try {
    const supabase = createMiddlewareClient({ req, res })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && req.nextUrl.pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  } catch (err) {
    console.error('Middleware invocation failed:', err)
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/(.*)'],
}

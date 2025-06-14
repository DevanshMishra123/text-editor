import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error) console.error("Supabase getUser error:", error)

    if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return res
  } catch (err) {
    console.error("Middleware failed:", err)
    return NextResponse.next() 
  }
}

export const config = {
  matcher: ['/dashboard']
}
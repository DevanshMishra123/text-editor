import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  try {
    const protectedPaths = ['/dashboard', '/instruments']
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    console.log("session is:", session)

  
    if (!session && protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    return res
  } catch (err) {
    console.error("Middleware failed:", err)
    return NextResponse.next() 
  }
}

export const config = {
  matcher: ['/dashboard/:path*','/instruments/:path*']
}
/*
const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error) console.error("Supabase getUser error:", error)

    if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/', req.url))
    }
*/

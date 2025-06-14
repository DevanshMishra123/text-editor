"use client"
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const router = useRouter()

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else { 
      router.push('/dashboard') 
    }
  }

  return (
    <div className='w-screen h-screen bg-black flex justify-center items-center'>
      <div className='flex flex-col gap-2 bg-gray-600 text-white border border-gray-800 shadow-md'>
        <h2>Login</h2>
        <input 
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className='bg-gray-400 p-4 rounded-2xl'
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className='bg-gray-400 p-4 rounded-2xl'
        />
        <button className="bg-black" onClick={signIn}>Login</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p>Don&apos;t have an accout{' '}<Link href="signup">Create Account</Link></p>
      </div>
    </div> 
  )
}
/*
const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return <p>Unauthorized</p>
*/
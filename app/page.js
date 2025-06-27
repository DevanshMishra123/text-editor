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
      console.error("Login failed:", error.message);
      setError(error.message)
    } else { 
      router.push('/dashboard') 
    }
  }

  return (
      <div className='w-[20vw] h-[15vh] overflow-hidden border-[10px] border-gray-800 hover:scale-y-100'>
        <div className='h-[30vh] [flex flex-col gap-4 p-4'>
          <h1 className='text-emerald-500 font-bold '>Login</h1>
          <input className='bg-white p-2 bg-opacity-50 placeholder-gray-300 focus:outline-none rounded-full' placeholder="Enter your email" type="email" />
          <input className='bg-white p-2 bg-opacity-50 placeholder-gray-300 focus:outline-none rounded-full' placeholder="Enter your password" type="password" />
        </div>
      </div>
  )
}
/*
const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return <p>Unauthorized</p>
*/



{/* <div className='w-screen h-screen bg-black flex justify-center items-center'>
      <div className='flex flex-col items-center gap-4 bg-gray-600 text-white border border-gray-800 p-8 bg-opacity-60 backdrop-blur-md transform transition-transform duration-500 hover:scale-105 hover:shadow-3xl shadow-md rounded-xl w-2/5'>
        <h2 className="text-2xl font-semibold">Login</h2>
        <input 
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className='bg-gray-400 p-2 bg-opacity-50 placeholder-gray-300 focus:outline-none rounded-full w-10/12'
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className='bg-gray-400 p-2 bg-opacity-50 placeholder-gray-300 focus:outline-none rounded-full w-10/12'
        />
        <button className="bg-gray-900 hover:bg-gray-950 transform hover:scale-105 transition duration-200 w-1/3 font-medium rounded-full py-2 px-4" onClick={signIn}>Login</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p className="text-sm mt-4">Don&apos;t have an accout{' '}<Link href="signup" className="underline text-blue-300">Create Account</Link></p>
      </div>
    </div>  */}
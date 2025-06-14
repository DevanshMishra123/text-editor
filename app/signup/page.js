"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/client'

console.log('supabase:', supabase)
console.log('supabase.auth:', supabase.auth)

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const router = useRouter()

  const signUp = async () => {
    if (!supabase || !supabase.auth || typeof supabase.auth.signUp !== 'function') {
        console.error("Supabase or supabase.auth.signUp is not defined")
        return
    }

    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: 'https://text-editor-bay-zeta.vercel.app/dashboard' } })
    if (error) {
        setError(error.message)
    } else {
        router.push('/')
    }
  }

  return (
    <div className='w-screen h-screen bg-black flex justify-center items-center'>
      <div className='flex flex-col items-center gap-4 bg-gray-600 text-white border border-gray-800 p-8 bg-opacity-60 backdrop-blur-md transform transition-transform duration-500 hover:scale-105 hover:shadow-3xl shadow-md rounded-xl w-2/5'>
        <h2 className="text-2xl font-semibold">Sign Up</h2>
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
        <button className="bg-gray-900 hover:bg-gray-950 transform hover:scale-105 transition duration-200 w-1/3 font-medium rounded-full py-2 px-4" onClick={signUp}>Sign Up</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div> 
  )
}

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
    <div>
      <h2>Sign Up</h2>
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={signUp}>Sign Up</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

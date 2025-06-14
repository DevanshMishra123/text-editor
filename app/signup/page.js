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
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/login')
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

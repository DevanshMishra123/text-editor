"use client"
import React from "react"
import { useState } from "react"
import supabase from "@/utils/supabase/client"

export default function Instruments() {
  const [message, setMessage] = useState('')
  const showData = async () => {
    try {
      const res = await fetch('/api/text')
      const data = await res.json()
      setMessage(data.message) 
      console.log(data.message)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if(error)
      console.log("Error signing out", error.message)
    else {
      console.log("logged out successfully")
      window.location.href = '/'
    }
  }
  
  return (
    <div>
      <button onClick={showData}>click me</button>
      <button onClick={signOut}>sign out</button>
    </div>
  )
}
/*

  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return <p>Unauthorized</p>
  return <pre>{JSON.stringify(instruments, null, 2)}</pre>
*/
"use client"
import React from "react"
import { useState } from "react"

export default function Instruments() {
  const [message, setMessage] = useState('')
  const showData = async () => {
    try {
      const res = await fetch('/api/text')
      const data = await res.json()
      setMessage(data.message) 
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }
  
  return (
    <div>
      <button onClick={showData}></button>
      (message && <p>{message}</p>)
    </div>
  )
}
/*

  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return <p>Unauthorized</p>
  return <pre>{JSON.stringify(instruments, null, 2)}</pre>
*/
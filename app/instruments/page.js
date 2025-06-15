"use client"
import React from "react"
import { useState } from "react"

export default function Instruments() {
  const [value, setValue] = useState(false)
  const showData = async () => {
    const res = await fetch('/api/text')
    const data = await res.json()
  }
  
  return (
    <div>
      <button onClick={showData}></button>
      (value && {data.message})
    </div>
  )
}
/*

  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return <p>Unauthorized</p>
  return <pre>{JSON.stringify(instruments, null, 2)}</pre>
*/
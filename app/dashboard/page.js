"use client"
import supabase from "@/utils/supabase/client";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useAuth,useRef } from "../ContextProvider";

const Edit = dynamic(() => import("../components/Edit"), { ssr: false });

const initialValue = [
  {
    type: "heading",
    children: [{text: " "}],
  },
  {
    type: "paragraph",
    children: [{text: " "}],
  },
]

export default function Dashboard() {
  const { session } = useAuth()
  const [hasLoaded, setHasLoaded] = useState(false);
  const [inValue, setInValue] = useState(initialValue)
  console.log("session is:", session)
 
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if(error)
      console.log("Error signing out", error.message)
    else {
      console.log("logged out successfully")
      window.location.href = '/'
    }
  }

  useEffect(() => {
    if(inValue!= initialValue)
      setHasLoaded(true)
  },[inValue])

  useEffect(() => {
    const getData = async () => {
      const res = await fetch("/api/getText")
      const { error, message, data } = await res.json()
      if(!error) {
        console.log(message, "Text content is:", data.content)
        let content = data.content;
        if (typeof data.content === "string") {
          console.log("type is:", typeof data.content)
          content = JSON.parse(data.content);
        }
        setInValue(content)
      }
      else 
        console.log("Error occured while fetching the data", error)
    }
    getData()
  },[])

  if(!session)
    return <p>Unauthorised</p>

  return (
    <div className="flex min-h-screen justify-between bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544894079-e81a9eb1da8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')` }}>
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm shadow-lg p-8">
        <Edit inValue={inValue} hasLoaded={hasLoaded} />
      </div>
      <button className="flex items-center gap-2 px-4 py-2 text-white absolute top-0 left-0" onClick={signOut}>
        <FontAwesomeIcon icon={faSignOutAlt} />
        Logout
      </button>
    </div>
  );
}
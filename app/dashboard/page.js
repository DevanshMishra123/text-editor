"use client"
import supabase from "@/utils/supabase/client";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import supabase from "@/utils/supabase/client";

const Edit = dynamic(() => import("../components/Edit"), { ssr: false });

export default async function Dashboard() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: {session} }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  },[session])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if(error)
      console.log("Error signing out", error.message)
    else {
      console.log("logged out successfully")
      window.location.href = '/'
    }
  }

  if(!session)
    return <p>Unauthorised</p>

  return (
    <div className="flex min-h-screen justify-between bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544894079-e81a9eb1da8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')` }}>
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm shadow-lg p-8">
        <Edit />
      </div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
"use client"
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/server";

const Edit = dynamic(() => import("./components/Edit"), { ssr: false });

export default async function Page() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return <p>Unauthorized</p>
  return (
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544894079-e81a9eb1da8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')` }}>
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm shadow-lg p-8">
        <Edit />
      </div>
    </div>
  );
}

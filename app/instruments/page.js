import { createClient } from "@/utils/supabase/server";

export default async function Instruments() {
  const supabase = await createClient();
  console.log("supabase is:", supabase)
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return <p>Unauthorized</p>

  const { data: instruments } = await supabase.from("instruments").select(); 

  return <pre>{JSON.stringify(instruments, null, 2)}</pre>
}
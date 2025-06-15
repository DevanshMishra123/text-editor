import { createClient } from "@/utils/supabase/server";

export default async function Instruments() {

  const { data: instruments } = await supabase.from("instruments").select(); 

  return <pre>{JSON.stringify(instruments, null, 2)}</pre>
}
/*
const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return <p>Unauthorized</p>
*/
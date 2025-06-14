import Dashboard from "./dashboard/page";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return <p>Unauthorized</p>
  return (
    <div>
      <Dashboard />
    </div>
  );
}
/*
const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return <p>Unauthorized</p>
*/
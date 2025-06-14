import Dashboard from "./dashboard/page";

export default async function Page() {
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


export default async function Instruments() {
  const res = await fetch('/api/text')
  const data = await res.json()
  return <div>{data.message}</div>
}
/*

  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return <p>Unauthorized</p>
  return <pre>{JSON.stringify(instruments, null, 2)}</pre>
*/
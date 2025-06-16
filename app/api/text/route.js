import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req) {
  try{
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: instruments, error } = await supabase.from("instruments").select();
    if (error) 
      return NextResponse.json({ message: "Failed to fetch instruments", error: error.message }, { status: 500 });
    return NextResponse.json({message: instruments})
  } catch(error){
    return NextResponse.json({ message: "Server error", error: String(error) },{status: 500})
  }
}
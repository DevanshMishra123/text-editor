import { NextResponse } from "next/server";
import supabase from "@/utils/supabase/client";

export async function GET(req) {
  try{   
    const { data, error } = await supabase.from("text-content").eq("id", 1).single()

    if (error) 
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: "Fetched content successfully", data }, { status: 200 });
    
  } catch(error){
    return NextResponse.json({ message: "Server error", error: String(error) },{status: 500})
  }
}
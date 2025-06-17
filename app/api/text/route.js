import { NextResponse } from "next/server";
import supabase from "@/utils/supabase/client";

export async function POST(req) {
  try{
    const { content } = await req.json();

    if (!content) 
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    
    const { data, error } = await supabase.from("text-content").update({ content }).eq("id", 1).select()

    if (!data || data.length === 0) {
      console.log("Row not found with that ID");
    } else {
      console.log("Row exists, proceed to update");
    }

    if (error) 
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: "Content saved", data }, { status: 200 });
    
  } catch(error){
    return NextResponse.json({ message: "Server error", error: String(error) },{status: 500})
  }
}
/*
const { data: instruments, error } = await supabase.from("instruments").select();
    if (error) 
      return NextResponse.json({ message: "Failed to fetch instruments", error: error.message }, { status: 500 });
    return NextResponse.json({message: instruments})
*/
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔄 Keep-alive ping to Supabase...")
    
    // Query sederhana untuk menjaga koneksi tetap aktif
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1)

    if (error) {
      console.error("Keep-alive error:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    console.log("✅ Keep-alive successful")
    
    return NextResponse.json({ 
      success: true, 
      message: "Database is active",
      timestamp: new Date().toISOString(),
      queryResult: data
    })

  } catch (error) {
    console.error("Keep-alive catch error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}
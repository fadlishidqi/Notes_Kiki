import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { sendWhatsAppReminder, formatReminderMessage } from "@/lib/fontee"

export async function GET() {
  try {
    console.log("=== Starting deadline check ===")
    
    // Waktu sekarang
    const now = new Date()
    console.log("Current time (UTC):", now.toISOString())
    
    // 24 jam dari sekarang
    const next24Hours = new Date(now.getTime() + (24 * 60 * 60 * 1000))
    console.log("Next 24 hours (UTC):", next24Hours.toISOString())

    // Query notes dengan deadline dalam 24 jam ke depan
    const { data: notesWithUsers, error } = await supabase
      .from("notes")
      .select(`
        id, 
        title, 
        deadline,
        user_id,
        users!inner(
          username,
          phone_number
        )
      `)
      .gte("deadline", now.toISOString())
      .lte("deadline", next24Hours.toISOString())
      .eq("is_completed", false)
      .not("deadline", "is", null)

    if (error) {
      console.error("Database query error:", error)
      throw error
    }

    console.log(`Found ${notesWithUsers?.length || 0} notes with approaching deadlines:`)
    console.log(notesWithUsers)

    // Send reminders untuk setiap note
    const results = []
    for (const note of notesWithUsers || []) {
      try {
        const phoneNumber = note.users.phone_number
        const username = note.users.username
        
        console.log(`Processing note: "${note.title}" for user: ${username} (${phoneNumber})`)
        
        if (!phoneNumber) {
          console.log(`Skipping note ${note.id}: No phone number`)
          results.push({ 
            noteId: note.id, 
            status: "skipped", 
            reason: "No phone number" 
          })
          continue
        }

        const message = formatReminderMessage(note.title, note.deadline)
        console.log(`Sending message: ${message.substring(0, 100)}...`)

        const waResult = await sendWhatsAppReminder(phoneNumber, message)
        console.log(`WhatsApp result:`, waResult)
        
        results.push({ 
          noteId: note.id, 
          status: "sent", 
          phoneNumber,
          waResult 
        })
      } catch (error) {
        console.error(`Failed to send reminder for note ${note.id}:`, error)
        results.push({ 
          noteId: note.id, 
          status: "failed", 
          error: error.message 
        })
      }
    }

    console.log("=== Deadline check completed ===")

    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      next24Hours: next24Hours.toISOString(),
      processed: notesWithUsers?.length || 0,
      results,
    })
  } catch (error) {
    console.error("Deadline check error:", error)
    return NextResponse.json({ 
      error: "Failed to check deadlines", 
      details: error.message 
    }, { status: 500 })
  }
}
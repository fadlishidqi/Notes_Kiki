import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { sendWhatsAppReminder, formatReminderMessage } from "@/lib/fontee"

export async function GET() {
  try {
    // Get notes with deadlines in the next 24 hours
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    const today = new Date()
    today.setDate(today.getDate() + 1)
    today.setHours(0, 0, 0, 0)

    // Join notes with users to get phone numbers
    const { data: notesWithUsers, error } = await supabase
      .from("notes")
      .select(`
        id, 
        title, 
        deadline,
        user_id,
        users!inner(
          phone_number
        )
      `)
      .gte("deadline", today.toISOString())
      .lte("deadline", tomorrow.toISOString())
      .eq("is_completed", false)

    if (error) {
      throw error
    }

    // Send reminders for each note
    const results = []
    for (const note of notesWithUsers || []) {
      try {
        const phoneNumber = note.users.phone_number
        const message = formatReminderMessage(note.title, note.deadline)

        await sendWhatsAppReminder(phoneNumber, message)
        results.push({ noteId: note.id, status: "sent" })
      } catch (error) {
        results.push({ noteId: note.id, status: "failed", error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      processed: notesWithUsers?.length || 0,
      results,
    })
  } catch (error) {
    console.error("Deadline check error:", error)
    return NextResponse.json({ error: "Failed to check deadlines" }, { status: 500 })
  }
}

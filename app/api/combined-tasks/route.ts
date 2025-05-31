import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("=== Running Combined Tasks ===")
    
    const results = {
      keepAlive: null,
      deadlineCheck: null,
      timestamp: new Date().toISOString()
    }

    // Task 1: Keep-Alive (setiap jam)
    try {
      console.log("🔄 Running keep-alive...")
      const { data: keepAliveData, error: keepAliveError } = await supabase
        .from("users")
        .select("count")
        .limit(1)

      if (keepAliveError) {
        throw keepAliveError
      }

      results.keepAlive = {
        success: true,
        message: "Database is active",
        queryResult: keepAliveData
      }
      console.log("✅ Keep-alive successful")

    } catch (error) {
      results.keepAlive = {
        success: false,
        error: error.message
      }
      console.error("❌ Keep-alive failed:", error)
    }

    // Task 2: Deadline Check (setiap jam)
    try {
      console.log("🔄 Running deadline check...")
      
      const FONTTE_TOKEN = process.env.FONTEE_API_KEY
      if (!FONTTE_TOKEN) {
        throw new Error("Fontte token not configured")
      }

      // Waktu sekarang
      const now = new Date()
      const next24Hours = new Date(now.getTime() + (24 * 60 * 60 * 1000))

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
        throw error
      }

      console.log(`Found ${notesWithUsers?.length || 0} notes with approaching deadlines`)

      // Send reminders
      const reminderResults = []
      for (const note of notesWithUsers || []) {
        try {
          const phoneNumber = note.users.phone_number
          
          if (!phoneNumber) {
            reminderResults.push({ 
              noteId: note.id, 
              status: "skipped", 
              reason: "No phone number" 
            })
            continue
          }

          // Format message
          const deadlineDate = new Date(note.deadline)
          const formattedDeadline = deadlineDate.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long", 
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta"
          })

          const timeDiff = deadlineDate.getTime() - now.getTime()
          const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60))

          const message = `🚨 *Reminder Notes*\n\n📝 *${note.title}*\n⏰ Deadline: ${formattedDeadline} WIB\n\n⚠️ Deadline tinggal ${hoursDiff} jam lagi!\n\nJangan lupa selesaikan tugasmu ya! 💪`

          // Format phone number
          let formattedPhone = phoneNumber.toString().replace(/[^\d+]/g, '')
          if (formattedPhone.startsWith('0')) {
            formattedPhone = formattedPhone.substring(1)
          } else if (formattedPhone.startsWith('+62')) {
            formattedPhone = formattedPhone.substring(3)
          } else if (formattedPhone.startsWith('62')) {
            formattedPhone = formattedPhone.substring(2)
          }

          // Send via Fontte
          const formData = new FormData()
          formData.append('target', formattedPhone)
          formData.append('message', message)
          formData.append('countryCode', '62')

          const fonteResponse = await fetch("https://api.fonnte.com/send", {
            method: "POST",
            headers: {
              "Authorization": FONTTE_TOKEN,
            },
            body: formData
          })

          const fonteResult = await fonteResponse.json()

          if (!fonteResponse.ok || !fonteResult.status) {
            throw new Error(fonteResult.reason || "Fontte API failed")
          }
          
          reminderResults.push({ 
            noteId: note.id, 
            status: "sent", 
            phoneNumber: `62${formattedPhone}`,
            hoursDiff
          })

        } catch (error) {
          reminderResults.push({ 
            noteId: note.id, 
            status: "failed", 
            error: error.message 
          })
        }
      }

      results.deadlineCheck = {
        success: true,
        processed: notesWithUsers?.length || 0,
        results: reminderResults
      }

    } catch (error) {
      results.deadlineCheck = {
        success: false,
        error: error.message
      }
      console.error("❌ Deadline check failed:", error)
    }

    console.log("=== Combined Tasks Completed ===")
    return NextResponse.json(results)

  } catch (error) {
    console.error("=== Combined Tasks Error ===", error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
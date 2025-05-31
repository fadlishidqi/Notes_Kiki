import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { noteId, deadline, userId } = await request.json()
    
    console.log("Auto checking deadline for note:", noteId)
    
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const timeDiff = deadlineDate.getTime() - now.getTime()
    const hoursDiff = timeDiff / (1000 * 60 * 60)
    
    console.log(`Time until deadline: ${hoursDiff.toFixed(2)} hours`)
    
    // Jika deadline kurang dari 24 jam, kirim reminder
    if (hoursDiff <= 24 && hoursDiff > 0) {
      console.log("Deadline < 24 hours, sending reminder...")
      
      // Ambil data user dan note
      const { data: noteWithUser, error } = await supabase
        .from("notes")
        .select(`
          id, 
          title, 
          deadline,
          users!inner(
            username,
            phone_number
          )
        `)
        .eq("id", noteId)
        .eq("user_id", userId)
        .single()

      if (error || !noteWithUser) {
        console.error("Error fetching note data:", error)
        return NextResponse.json({ 
          success: false, 
          error: "Note not found" 
        }, { status: 404 })
      }

      const phoneNumber = noteWithUser.users.phone_number
      if (!phoneNumber) {
        console.log("No phone number found for user")
        return NextResponse.json({ 
          success: false, 
          error: "No phone number" 
        })
      }

      // Send WhatsApp
      const waResult = await sendWhatsAppFromServer(phoneNumber, noteWithUser.title, deadline)
      
      return NextResponse.json({ 
        success: true, 
        hoursDiff: Math.ceil(hoursDiff),
        whatsappSent: true,
        waResult 
      })
      
    } else if (hoursDiff <= 0) {
      console.log("Deadline sudah lewat")
      return NextResponse.json({ 
        success: true, 
        message: "Deadline sudah lewat",
        hoursDiff: Math.ceil(hoursDiff)
      })
    } else {
      console.log(`Deadline masih ${Math.ceil(hoursDiff)} jam lagi, belum perlu reminder`)
      return NextResponse.json({ 
        success: true, 
        message: `Deadline masih ${Math.ceil(hoursDiff)} jam lagi`,
        hoursDiff: Math.ceil(hoursDiff)
      })
    }
    
  } catch (error) {
    console.error("Error in auto-check-deadline:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// Fungsi send WhatsApp di server-side
async function sendWhatsAppFromServer(phoneNumber: string, noteTitle: string, deadline: string) {
  try {
    const FONTTE_TOKEN = process.env.FONTEE_API_KEY
    if (!FONTTE_TOKEN) {
      throw new Error("Fontte token not configured")
    }

    // Format deadline
    const deadlineDate = new Date(deadline)
    const formattedDeadline = deadlineDate.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta"
    })

    const timeDiff = deadlineDate.getTime() - new Date().getTime()
    const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60))

    const message = `🚨 *Reminder Notes*\n\n📝 *${noteTitle}*\n⏰ Deadline: ${formattedDeadline} WIB\n\n⚠️ Deadline tinggal ${hoursDiff} jam lagi!\n\nJangan lupa selesaikan tugasmu ya! 💪`

    // Format phone number
    let formattedPhone = phoneNumber.toString().replace(/[^\d+]/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1)
    } else if (formattedPhone.startsWith('+62')) {
      formattedPhone = formattedPhone.substring(3)
    } else if (formattedPhone.startsWith('62')) {
      formattedPhone = formattedPhone.substring(2)
    }

    console.log(`Sending WhatsApp to: 62${formattedPhone}`)

    const formData = new FormData()
    formData.append('target', formattedPhone)
    formData.append('message', message)
    formData.append('countryCode', '62')

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": FONTTE_TOKEN,
      },
      body: formData
    })

    const result = await response.json()
    console.log("WhatsApp sent result:", result)

    if (!response.ok || !result.status) {
      throw new Error(result.reason || "Failed to send WhatsApp")
    }

    console.log("✅ WhatsApp reminder sent successfully!")
    return result

  } catch (error) {
    console.error("Error sending WhatsApp:", error)
    throw error
  }
}
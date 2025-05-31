import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    const FONNTE_TOKEN = process.env.FONTEE_API_KEY

    console.log("=== WhatsApp API Request ===")
    console.log("Token available:", !!FONNTE_TOKEN)
    console.log("Original phone number:", phoneNumber)
    console.log("Message:", message)

    if (!FONNTE_TOKEN) {
      return NextResponse.json({ error: "Fonnte token not configured" }, { status: 500 })
    }

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 })
    }

    // Format nomor telepon - hapus karakter non-digit kecuali +
    let formattedPhone = phoneNumber.toString().replace(/[^\d+]/g, '')
    
    // Handle format Indonesia
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1) // Hapus 0 di depan, biar countryCode 62 yang handle
    } else if (formattedPhone.startsWith('+62')) {
      formattedPhone = formattedPhone.substring(3) // Hapus +62
    } else if (formattedPhone.startsWith('62')) {
      formattedPhone = formattedPhone.substring(2) // Hapus 62
    }

    console.log("Formatted phone (akan ditambah countryCode 62):", formattedPhone)

    // Buat FormData seperti contoh HTML Anda
    const formData = new FormData()
    formData.append('target', formattedPhone)
    formData.append('message', message)
    formData.append('countryCode', '62') // Indonesia
    formData.append('delay', '0')

    console.log("Sending to Fonnte API...")

    // Kirim request ke Fonnte API
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": FONNTE_TOKEN, // Langsung token tanpa Bearer
      },
      body: formData
    })

    const result = await response.json()
    
    console.log("Fonnte response status:", response.status)
    console.log("Fonnte response body:", result)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`)
    }

    // Cek status dari Fonnte
    if (result.status === false) {
      throw new Error(result.reason || "Fonnte returned false status")
    }

    console.log("=== WhatsApp sent successfully ===")

    return NextResponse.json({ 
      success: true, 
      data: result,
      finalPhoneNumber: `62${formattedPhone}`
    })

  } catch (error) {
    console.error("=== WhatsApp API Error ===")
    console.error(error)
    
    return NextResponse.json({ 
      error: "Failed to send WhatsApp message", 
      details: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error)
    }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    // Replace with your Fontee.com API credentials
    const FONTEE_API_KEY = process.env.FONTEE_API_KEY
    const FONTEE_DEVICE_ID = process.env.FONTEE_DEVICE_ID

    if (!FONTEE_API_KEY || !FONTEE_DEVICE_ID) {
      return NextResponse.json({ error: "Fontee API credentials not configured" }, { status: 500 })
    }

    const response = await fetch("https://api.fontee.com/v1/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FONTEE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_id: FONTEE_DEVICE_ID,
        number: phoneNumber,
        message: message,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Failed to send WhatsApp message")
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("WhatsApp API Error:", error)
    return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 500 })
  }
}

export async function sendWhatsAppReminder(phoneNumber: string, message: string) {
  try {
    console.log("Sending reminder to:", phoneNumber)
    
    // PERBAIKAN: Gunakan absolute URL atau base URL yang benar
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    
    const apiUrl = `${baseUrl}/api/send-whatsapp`
    console.log("API URL:", apiUrl)
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        message,
      }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}: ${result.details || 'Unknown error'}`)
    }

    console.log("WhatsApp sent successfully:", result)
    return result
  } catch (error) {
    console.error("Error sending WhatsApp reminder:", error)
    throw error
  }
}

export function formatReminderMessage(noteTitle: string, deadline: string) {
  try {
    // Format deadline untuk tampilan
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

    return `🚨 *Reminder Notes*\n\n📝 *${noteTitle}*\n⏰ Deadline: ${formattedDeadline} WIB\n\n⚠️ Deadline tinggal kurang dari 24 jam lagi!\n\nJangan lupa selesaikan tugasmu ya! 💪`
  } catch (error) {
    console.error("Error formatting reminder message:", error)
    return `🚨 *Reminder Notes*\n\n📝 *${noteTitle}*\n⏰ Deadline: ${deadline}\n\n⚠️ Deadline tinggal kurang dari 24 jam lagi!`
  }
}
export async function sendWhatsAppReminder(phoneNumber: string, message: string) {
  try {
    const response = await fetch("/api/send-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        message,
      }),
    })

    return await response.json()
  } catch (error) {
    console.error("Error sending WhatsApp reminder:", error)
    throw error
  }
}

export function formatReminderMessage(noteTitle: string, deadline: string) {
  return `🚨 *Reminder Notes*\n\n📝 *${noteTitle}*\n⏰ Deadline: ${new Date(deadline).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}\n\n⚠️ Deadline tinggal 1 hari lagi!`
}

import { createClient } from "@supabase/supabase-js"
import type { User, NoteHistory } from "./types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Timezone Jakarta helpers
export const getJakartaTime = () => {
  const now = new Date()
  const jakartaTimeString = now.toLocaleString("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit", 
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
  return new Date(jakartaTimeString.replace(", ", "T"))
}

export const convertToJakartaTime = (utcDate: string | Date) => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  const jakartaTimeString = date.toLocaleString("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit", 
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
  return new Date(jakartaTimeString.replace(", ", "T"))
}

export const convertJakartaToUTC = (jakartaDate: Date) => {
  const offset = 7 * 60 * 60 * 1000 // GMT+7
  return new Date(jakartaDate.getTime() - offset)
}

export type Note = {
  id: string
  title: string
  content: string | null
  deadline: string | null
  created_at: string
  updated_at: string
  is_completed: boolean
  user_id: string
}

// FUNGSI BARU: Call API auto-check (client-side safe)
async function callAutoCheckDeadline(noteId: string, deadline: string, userId: string) {
  try {
    console.log("🔄 Calling auto-check deadline API...")
    
    const response = await fetch('/api/auto-check-deadline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        noteId,
        deadline,
        userId
      })
    })

    const result = await response.json()
    console.log("Auto-check result:", result)

    if (result.whatsappSent) {
      console.log("🎉 WhatsApp reminder sent!")
    }

    return result
  } catch (error) {
    console.error("Error calling auto-check:", error)
  }
}

// UPDATE: createNote dengan API call
export async function createNote(
  noteData: Partial<Note>,
  userId: string,
): Promise<{ note: Note | null; error: Error | null }> {
  try {
    console.log("Creating note with data:", noteData)

    const { data: userExists, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (userError || !userExists) {
      throw new Error("User not found")
    }

    const now = new Date()

    const insertData = {
      title: noteData.title || "",
      content: noteData.content || null,
      deadline: noteData.deadline || null,
      user_id: userId,
      is_completed: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }

    console.log("Insert data:", insertData)

    const { data: newNote, error: noteError } = await supabase
      .from("notes")
      .insert([insertData])
      .select()

    if (noteError) {
      console.error("Note insert error:", noteError)
      throw noteError
    }

    console.log("Note created successfully:", newNote[0])

    // AUTO CHECK DEADLINE - Call API endpoint
    if (newNote[0].deadline) {
      console.log("🔄 Auto-checking deadline for new note...")
      // Delay sedikit untuk memastikan database sudah terupdate
      setTimeout(() => {
        callAutoCheckDeadline(newNote[0].id, newNote[0].deadline, userId)
      }, 2000) // Delay 2 detik
    }

    // Record history
    try {
      const { error: historyError } = await supabase.from("note_history").insert([
        {
          note_id: newNote[0].id,
          user_id: userId,
          action: "created",
          action_details: `Note "${noteData.title}" created`,
        },
      ])

      if (historyError) {
        console.warn("Failed to record history:", historyError)
      }
    } catch (historyError) {
      console.warn("History error (non-critical):", historyError)
    }

    return { note: newNote[0] as Note, error: null }
  } catch (error) {
    console.error("Create note error:", error)
    return { note: null, error: error as Error }
  }
}

// UPDATE: updateNote dengan API call
export async function updateNote(
  id: string,
  noteData: Partial<Note>,
  userId: string,
): Promise<{ note: Note | null; error: Error | null }> {
  try {
    console.log("Updating note:", id, "with data:", noteData)

    const now = new Date()

    const updateData = {
      ...noteData,
      updated_at: now.toISOString(),
    }

    console.log("Update data:", updateData)

    const { data: updatedNote, error: noteError } = await supabase
      .from("notes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()

    if (noteError) {
      console.error("Note update error:", noteError)
      throw noteError
    }

    if (!updatedNote || updatedNote.length === 0) {
      throw new Error("Note not found or access denied")
    }

    console.log("Note updated successfully:", updatedNote[0])

    // AUTO CHECK DEADLINE - Call API endpoint
    if (updatedNote[0].deadline) {
      console.log("🔄 Auto-checking deadline for updated note...")
      setTimeout(() => {
        callAutoCheckDeadline(updatedNote[0].id, updatedNote[0].deadline, userId)
      }, 2000) // Delay 2 detik
    }

    // Record history
    try {
      const { error: historyError } = await supabase.from("note_history").insert([
        {
          note_id: id,
          user_id: userId,
          action: "updated",
          action_details: `Note "${noteData.title || updatedNote[0].title}" updated`,
        },
      ])

      if (historyError) {
        console.warn("Failed to record history:", historyError)
      }
    } catch (historyError) {
      console.warn("History error (non-critical):", historyError)
    }

    return { note: updatedNote[0] as Note, error: null }
  } catch (error) {
    console.error("Update note error:", error)
    return { note: null, error: error as Error }
  }
}

// Rest of functions remain the same...
export async function toggleNoteCompletion(
  id: string,
  completed: boolean,
  userId: string,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: noteData } = await supabase.from("notes").select("title").eq("id", id).single()

    const { error: noteError } = await supabase
      .from("notes")
      .update({ 
        is_completed: completed, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", id)
      .eq("user_id", userId)

    if (noteError) throw noteError

    const { error: historyError } = await supabase.from("note_history").insert([
      {
        note_id: id,
        user_id: userId,
        action: "completed",
        action_details: `Note "${noteData?.title}" marked as ${completed ? "completed" : "incomplete"}`,
      },
    ])

    if (historyError) console.warn("Failed to record history:", historyError)

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

export async function deleteNote(
  id: string,
  userId: string,
  noteTitle: string,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error: historyError } = await supabase.from("note_history").insert([
      {
        note_id: id,
        user_id: userId,
        action: "deleted",
        action_details: `Note "${noteTitle}" deleted`,
      },
    ])

    if (historyError) console.warn("Failed to record history:", historyError)

    const { error: noteError } = await supabase
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (noteError) throw noteError

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

export async function fetchNoteHistory(userId: string): Promise<{
  history: NoteHistory[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabase
      .from("note_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return { history: data as NoteHistory[], error: null }
  } catch (error) {
    return { history: [], error: error as Error }
  }
}

// Auth functions remain the same...
export async function loginWithUsername(username: string): Promise<{
  user: User | null
  error: Error | null
}> {
  try {
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .limit(1)

    if (fetchError) throw fetchError

    if (users && users.length > 0) {
      return { user: users[0] as User, error: null }
    } else {
      return { user: null, error: new Error("User not found") }
    }
  } catch (error) {
    return { user: null, error: error as Error }
  }
}

export async function registerUser(
  username: string,
  phoneNumber: string,
): Promise<{
  user: User | null
  error: Error | null
}> {
  try {
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .limit(1)

    if (checkError) throw checkError

    if (existingUsers && existingUsers.length > 0) {
      return { user: null, error: new Error("Username already taken") }
    }

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{ username, phone_number: phoneNumber }])
      .select()

    if (insertError) throw insertError

    return { user: newUser[0] as User, error: null }
  } catch (error) {
    return { user: null, error: error as Error }
  }
}
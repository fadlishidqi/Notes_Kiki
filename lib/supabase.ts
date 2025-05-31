import { createClient } from "@supabase/supabase-js"
import type { User, NoteHistory } from "./types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

// Custom auth functions
export async function loginWithUsername(username: string): Promise<{
  user: User | null
  error: Error | null
}> {
  try {
    // Check if user exists
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .limit(1)

    if (fetchError) throw fetchError

    if (users && users.length > 0) {
      // User exists, return the user
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
    // Check if username already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .limit(1)

    if (checkError) throw checkError

    if (existingUsers && existingUsers.length > 0) {
      return { user: null, error: new Error("Username already taken") }
    }

    // Create new user
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

// Note functions with history tracking
export async function createNote(
  noteData: Partial<Note>,
  userId: string,
): Promise<{ note: Note | null; error: Error | null }> {
  try {
    // First verify the user exists
    const { data: userExists, error: userError } = await supabase.from("users").select("id").eq("id", userId).single()

    if (userError || !userExists) {
      throw new Error("User not found")
    }

    // Insert note without foreign key constraint issues
    const { data: newNote, error: noteError } = await supabase
      .from("notes")
      .insert([
        {
          ...noteData,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (noteError) throw noteError

    // Record history
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
      // Don't throw error for history, just log it
    }

    return { note: newNote[0] as Note, error: null }
  } catch (error) {
    return { note: null, error: error as Error }
  }
}

export async function updateNote(
  id: string,
  noteData: Partial<Note>,
  userId: string,
): Promise<{ note: Note | null; error: Error | null }> {
  try {
    // Update note
    const { data: updatedNote, error: noteError } = await supabase
      .from("notes")
      .update({ ...noteData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()

    if (noteError) throw noteError

    // Record history
    const { error: historyError } = await supabase.from("note_history").insert([
      {
        note_id: id,
        user_id: userId,
        action: "updated",
        action_details: `Note "${noteData.title || updatedNote[0].title}" updated`,
      },
    ])

    if (historyError) throw historyError

    return { note: updatedNote[0] as Note, error: null }
  } catch (error) {
    return { note: null, error: error as Error }
  }
}

export async function toggleNoteCompletion(
  id: string,
  completed: boolean,
  userId: string,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Get note title first
    const { data: noteData } = await supabase.from("notes").select("title").eq("id", id).single()

    // Update note
    const { error: noteError } = await supabase
      .from("notes")
      .update({ is_completed: completed, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (noteError) throw noteError

    // Record history
    const { error: historyError } = await supabase.from("note_history").insert([
      {
        note_id: id,
        user_id: userId,
        action: "completed",
        action_details: `Note "${noteData?.title}" marked as ${completed ? "completed" : "incomplete"}`,
      },
    ])

    if (historyError) throw historyError

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
    // Record history before deletion
    const { error: historyError } = await supabase.from("note_history").insert([
      {
        note_id: id,
        user_id: userId,
        action: "deleted",
        action_details: `Note "${noteTitle}" deleted`,
      },
    ])

    if (historyError) throw historyError

    // Delete note
    const { error: noteError } = await supabase.from("notes").delete().eq("id", id)

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

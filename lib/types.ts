export type User = {
  id: string
  username: string
  phone_number: string
  created_at: string
  updated_at: string
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

export type NoteHistory = {
  id: string
  note_id: string
  user_id: string
  action: "created" | "updated" | "completed" | "deleted"
  action_details: string | null
  created_at: string
}

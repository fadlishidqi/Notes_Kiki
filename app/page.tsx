"use client"

import { useEffect, useState } from "react"
import { AuthForm } from "@/components/auth-form"
import { NotesDashboard } from "@/components/notes-dashboard"
import type { User } from "@/lib/types"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for user in localStorage
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      fetchUser(storedUserId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error || !data) {
        throw error
      }

      setUser(data as User)
    } catch (error) {
      console.error("Error fetching user:", error)
      localStorage.removeItem("userId")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userId: string) => {
    localStorage.setItem("userId", userId)
    fetchUser(userId)
  }

  const handleLogout = () => {
    localStorage.removeItem("userId")
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return user ? <NotesDashboard user={user} onLogout={handleLogout} /> : <AuthForm onLogin={handleLogin} />
}

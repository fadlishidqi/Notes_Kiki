"use client"

import { useState, useEffect } from "react"
import { supabase, createNote, updateNote, deleteNote, toggleNoteCompletion } from "@/lib/supabase"
import type { Note, User } from "@/lib/types"
import { NoteCard } from "./note-card"
import { NoteForm } from "./note-form"
import { HistoryPanel } from "./history-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, LogOut, History, Calendar, Home, Settings, UserIcon } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface NotesDashboardProps {
  user: User
  onLogout: () => void
}

export function NotesDashboard({ user, onLogout }: NotesDashboardProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "completed">("all")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    fetchNotes()
    setMounted(true)
  }, [])

  useEffect(() => {
    let filtered = notes

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Apply completion filter
    if (activeFilter === "active") {
      filtered = filtered.filter((note) => !note.is_completed)
    } else if (activeFilter === "completed") {
      filtered = filtered.filter((note) => note.is_completed)
    }

    setFilteredNotes(filtered)
  }, [notes, searchQuery, activeFilter])

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNote = async (noteData: Partial<Note>) => {
    setIsSaving(true)
    try {
      if (editingNote) {
        const { error } = await updateNote(editingNote.id, noteData, user.id)
        if (error) throw error
      } else {
        const { error } = await createNote(noteData, user.id)
        if (error) throw error
      }

      await fetchNotes()
      setShowForm(false)
      setEditingNote(null)
    } catch (error) {
      console.error("Error saving note:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNote = async (id: string, title: string) => {
    try {
      const { error } = await deleteNote(id, user.id, title)
      if (error) throw error
      await fetchNotes()
    } catch (error) {
      console.error("Error deleting note:", error)
      alert(`Error: ${error.message}`)
    }
  }

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      const { error } = await toggleNoteCompletion(id, completed, user.id)
      if (error) throw error
      await fetchNotes()
    } catch (error) {
      console.error("Error updating note:", error)
      alert(`Error: ${error.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-emerald-500" />
            <span className="text-sm text-gray-300">{format(new Date(), "MMMM yyyy", { locale: id })}</span>
          </div>
          <motion.div
            className="w-8 h-8 rounded-full bg-black border border-emerald-500/50 flex items-center justify-center shadow-lg"
            whileTap={{ scale: 0.95 }}
          >
            <UserIcon className="h-4 w-4 text-emerald-500" />
          </motion.div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Welcome Section with Animation */}
        <AnimatePresence>
          {mounted && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="mb-6"
            >
              <motion.h1
                className="text-3xl font-bold mb-1 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Hi, {user.username}{" "}
                <motion.span
                  className="ml-1 inline-block"
                  animate={{ rotate: [0, -10, 20, -10, 0] }}
                  transition={{ duration: 1.5, delay: 0.6, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                >
                  ✏️
                </motion.span>
              </motion.h1>
              <motion.p
                className="text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                What are you thinking?
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 overflow-x-auto pb-2"
        >
          <div className="flex space-x-2 min-w-max">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date()
              date.setDate(date.getDate() + i)
              const isToday = i === 0

              return (
                <motion.div
                  key={i}
                  className={`flex flex-col items-center justify-center rounded-lg p-2 min-w-[3rem] ${
                    isToday ? "bg-black text-white border border-emerald-500" : "bg-gray-900 text-gray-300"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                >
                  <span className="text-xs font-medium">{format(date, "EEE", { locale: id })}</span>
                  <span className="text-lg font-bold">{format(date, "d")}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-6"
        >
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-4 w-4" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder-gray-400 focus:border-emerald-500"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className={
                activeFilter === "all"
                  ? "bg-black border border-emerald-500 text-white"
                  : "border-gray-800 text-gray-300 hover:text-white hover:border-emerald-500"
              }
            >
              All
            </Button>
            <Button
              variant={activeFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("active")}
              className={
                activeFilter === "active"
                  ? "bg-black border border-emerald-500 text-white"
                  : "border-gray-800 text-gray-300 hover:text-white hover:border-emerald-500"
              }
            >
              Active
            </Button>
            <Button
              variant={activeFilter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("completed")}
              className={
                activeFilter === "completed"
                  ? "bg-black border border-emerald-500 text-white"
                  : "border-gray-800 text-gray-300 hover:text-white hover:border-emerald-500"
              }
            >
              Completed
            </Button>
          </div>
        </motion.div>

        {/* Notes Grid */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredNotes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <p className="text-gray-400 text-lg">
                  {searchQuery ? "No notes found" : "No notes yet. Create your first note!"}
                </p>
              </motion.div>
            ) : (
              filteredNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NoteCard
                    note={note}
                    onEdit={(note) => {
                      setEditingNote(note)
                      setShowForm(true)
                    }}
                    onDelete={handleDeleteNote}
                    onToggleComplete={handleToggleComplete}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-gray-900 p-3 flex items-center justify-around">
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-900/20">
          <Home className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowHistory(true)}
          className="text-gray-400 hover:text-white hover:bg-gray-900/20"
        >
          <History className="h-5 w-5" />
        </Button>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative">
          <Button
            onClick={() => {
              setEditingNote(null)
              setShowForm(true)
            }}
            size="icon"
            className="h-14 w-14 rounded-full bg-black border border-emerald-500 hover:bg-gray-900 text-emerald-500 shadow-lg -mt-6"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-900/20">
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className="text-gray-400 hover:text-white hover:bg-gray-900/20"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Note Form Modal */}
      <AnimatePresence>
        {showForm && (
          <NoteForm
            note={editingNote}
            onSave={handleSaveNote}
            onCancel={() => {
              setShowForm(false)
              setEditingNote(null)
            }}
            isLoading={isSaving}
          />
        )}
      </AnimatePresence>

      {/* History Panel */}
      <HistoryPanel userId={user.id} isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  )
}

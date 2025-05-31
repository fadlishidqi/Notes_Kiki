"use client"

import { useState } from "react"
import type { Note } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Edit, Trash2, Check } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string, title: string) => void
  onToggleComplete: (id: string, completed: boolean) => void
}

export function NoteCard({ note, onEdit, onDelete, onToggleComplete }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(note.id, note.title)
    setIsDeleting(false)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM yyyy • HH:mm", { locale: id })
  }

  const isDeadlineSoon = () => {
    if (!note.deadline) return false
    const deadline = new Date(note.deadline)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 1 && diffDays >= 0
  }

  const isOverdue = () => {
    if (!note.deadline) return false
    return new Date(note.deadline) < new Date()
  }

  const getPreviewContent = () => {
    if (!note.content) return ""
    return isExpanded ? note.content : note.content.substring(0, 100) + (note.content.length > 100 ? "..." : "")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      layout
      whileHover={{ scale: 1.01 }}
    >
      <Card
        className={`bg-gray-900 border-gray-800 hover:border-emerald-500/30 transition-all overflow-hidden shadow-md ${
          note.is_completed ? "opacity-60" : ""
        }`}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <h3
              className={`font-semibold text-white text-lg ${note.is_completed ? "line-through" : ""}`}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {note.title}
            </h3>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleComplete(note.id, !note.is_completed)}
                className="h-8 w-8 p-0 text-emerald-500 hover:text-white hover:bg-gray-800 rounded-full"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(note)}
                className="h-8 w-8 p-0 text-emerald-500 hover:text-white hover:bg-gray-800 rounded-full"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-emerald-500 hover:text-red-400 hover:bg-red-600/20 rounded-full"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {note.content && (
            <div
              className={`text-gray-300 text-sm mb-3 ${note.is_completed ? "line-through" : ""}`}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {getPreviewContent()}
              {note.content.length > 100 && !isExpanded && (
                <button className="text-emerald-500 hover:text-emerald-400 text-xs ml-1">Read more</button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-gray-400">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatDate(note.updated_at)}</span>
            </div>

            {note.deadline && (
              <div className="flex items-center">
                {isDeadlineSoon() && !note.is_completed && (
                  <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Segera!
                  </Badge>
                )}
                {isOverdue() && !note.is_completed && (
                  <Badge variant="destructive" className="text-xs">
                    Terlambat
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

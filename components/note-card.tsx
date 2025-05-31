"use client"

import { useState } from "react"
import type { Note } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Edit, Trash2, Check, FileText } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { convertToJakartaTime, getJakartaTime } from "@/lib/supabase"

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
    try {
      const jakartaTime = convertToJakartaTime(dateString)
      return format(jakartaTime, "d MMM yyyy • HH:mm", { locale: id }) + " WIB"
    } catch (error) {
      return "Invalid date"
    }
  }

  const formatDeadlineDate = (dateString: string) => {
    try {
      const jakartaTime = convertToJakartaTime(dateString)
      return format(jakartaTime, "EEEE, d MMM yyyy • HH:mm", { locale: id }) + " WIB"
    } catch (error) {
      return "Invalid date"
    }
  }

  const isDeadlineSoon = () => {
    if (!note.deadline) return false
    
    try {
      const deadlineJakarta = convertToJakartaTime(note.deadline)
      const nowJakarta = getJakartaTime()
      
      const diffTime = deadlineJakarta.getTime() - nowJakarta.getTime()
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
      
      return diffHours <= 24 && diffHours >= 0
    } catch (error) {
      return false
    }
  }

  const isOverdue = () => {
    if (!note.deadline) return false
    
    try {
      const deadlineJakarta = convertToJakartaTime(note.deadline)
      const nowJakarta = getJakartaTime()
      
      return deadlineJakarta < nowJakarta
    } catch (error) {
      return false
    }
  }

  const getTimeRemaining = () => {
    if (!note.deadline) return null
    
    try {
      const deadlineJakarta = convertToJakartaTime(note.deadline)
      const nowJakarta = getJakartaTime()
      
      const diffTime = deadlineJakarta.getTime() - nowJakarta.getTime()
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)
      const remainingHours = diffHours % 24
      
      if (diffTime < 0) {
        const overdueDays = Math.abs(diffDays)
        const overdueHours = Math.abs(remainingHours)
        if (overdueDays > 0) {
          return `Terlambat ${overdueDays} hari`
        } else {
          return `Terlambat ${overdueHours} jam`
        }
      }
      
      if (diffDays > 0) {
        return `${diffDays} hari ${remainingHours} jam lagi`
      } else {
        return `${diffHours} jam lagi`
      }
    } catch (error) {
      return "Error calculating time"
    }
  }

  const getPreviewContent = () => {
    if (!note.content) return ""
    return isExpanded ? note.content : note.content.substring(0, 100) + (note.content.length > 100 ? "..." : "")
  }

  const getDeadlineStatusColor = () => {
    if (!note.deadline || note.is_completed) return ""
    
    if (isOverdue()) {
      return "border-red-500/50 bg-red-500/10"
    } else if (isDeadlineSoon()) {
      return "border-yellow-500/50 bg-yellow-500/10"
    }
    return ""
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
        } ${getDeadlineStatusColor()}`}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
              <h3
                className={`font-semibold text-white text-lg mb-1 ${
                  note.is_completed ? "line-through" : ""
                }`}
              >
                {note.title}
              </h3>
              
              {/* Empty Content Indicator */}
              {!note.content && !note.deadline && (
                <Badge variant="outline" className="text-gray-500 border-gray-600 text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Note kosong
                </Badge>
              )}
              
              {/* Status Badge */}
              {note.is_completed && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs mr-2">
                  ✓ Selesai
                </Badge>
              )}
              
              {/* Deadline Badge */}
              {note.deadline && !note.is_completed && (
                <div className="mt-2">
                  {isOverdue() ? (
                    <Badge variant="destructive" className="text-xs">
                      🚨 {getTimeRemaining()}
                    </Badge>
                  ) : isDeadlineSoon() ? (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                      ⏰ {getTimeRemaining()}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs">
                      📅 {getTimeRemaining()}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleComplete(note.id, !note.is_completed)}
                className={`h-8 w-8 p-0 rounded-full transition-all ${
                  note.is_completed 
                    ? "text-green-400 hover:text-green-300 hover:bg-green-600/20" 
                    : "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-600/20"
                }`}
                title={note.is_completed ? "Tandai belum selesai" : "Tandai selesai"}
              >
                <Check className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(note)}
                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-400 hover:bg-blue-600/20 rounded-full transition-all"
                title="Edit note"
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-600/20 rounded-full transition-all"
                title="Hapus note"
              >
                <Trash2 className={`h-4 w-4 ${isDeleting ? "animate-pulse" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {/* Content */}
          {note.content ? (
            <div
              className={`text-gray-300 text-sm mb-3 cursor-pointer transition-all ${
                note.is_completed ? "line-through opacity-70" : ""
              }`}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {getPreviewContent()}
              {note.content.length > 100 && (
                <button className="text-emerald-500 hover:text-emerald-400 text-xs ml-1 font-medium">
                  {isExpanded ? "Lebih sedikit" : "Selengkapnya"}
                </button>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm mb-3 italic">
              Tidak ada deskripsi
            </div>
          )}

          {/* Deadline Info */}
          {note.deadline && (
            <div className="mb-3 p-2 bg-gray-800/50 rounded-md border border-gray-700">
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>Deadline</span>
              </div>
              <div className={`text-sm font-medium ${
                isOverdue() && !note.is_completed 
                  ? "text-red-400" 
                  : isDeadlineSoon() && !note.is_completed
                    ? "text-yellow-400"
                    : "text-gray-300"
              }`}>
                {formatDeadlineDate(note.deadline)}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-gray-400">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Diubah: {formatDate(note.updated_at)}</span>
            </div>

            {/* Creation Date if different from updated */}
            {note.created_at !== note.updated_at && (
              <div className="flex items-center text-gray-500">
                <span>Dibuat: {formatDate(note.created_at)}</span>
              </div>
            )}
          </div>

          {/* Progress Indicator for Completed Notes */}
          {note.is_completed && (
            <div className="mt-3 flex items-center text-xs text-green-400">
              <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <span className="ml-2 font-medium">Selesai</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
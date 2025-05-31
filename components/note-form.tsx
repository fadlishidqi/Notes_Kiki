"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Note } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { X, Calendar, Clock, Save, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface NoteFormProps {
  note?: Note | null
  onSave: (noteData: Partial<Note>) => void
  onCancel: () => void
  isLoading?: boolean
}

export function NoteForm({ note, onSave, onCancel, isLoading }: NoteFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [activeTab, setActiveTab] = useState("content")
  const [hasDeadline, setHasDeadline] = useState(false)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content || "")

      if (note.deadline) {
        setHasDeadline(true)
        const deadlineDate = new Date(note.deadline)
        setDate(format(deadlineDate, "yyyy-MM-dd"))
        setTime(format(deadlineDate, "HH:mm"))
      } else {
        setHasDeadline(false)
        setDate("")
        setTime("")
      }
    } else {
      setTitle("")
      setContent("")
      setHasDeadline(false)
      setDate("")
      setTime("")
    }
  }, [note])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // DEBUG LOG
    console.log("Form submission data:", {
      title: title.trim(),
      content: content.trim(),
      hasDeadline,
      date,
      time
    })

    let deadlineValue = null
    
    // PERBAIKAN: Tambah default date jika hasDeadline true tapi date kosong
    if (hasDeadline) {
      let finalDate = date
      let finalTime = time || "09:00"
      
      // Jika date kosong, gunakan hari ini
      if (!finalDate) {
        finalDate = format(new Date(), "yyyy-MM-dd")
        console.log("Date was empty, using today:", finalDate)
      }
      
      const deadlineDateTime = `${finalDate}T${finalTime}:00`
      deadlineValue = new Date(deadlineDateTime).toISOString()
      
      console.log("Deadline processing:", {
        originalDate: date,
        finalDate,
        finalTime,
        deadlineDateTime,
        deadlineValue
      })
    }

    const noteData = {
      title: title.trim(),
      content: content.trim() || null,
      deadline: deadlineValue,
    }

    console.log("Final note data being sent:", noteData)
    onSave(noteData)
  }

  // Generate calendar days for the UI
  const generateCalendarDays = () => {
    const today = new Date()
    const days = []

    for (let i = 0; i <= 10; i++) {
      const day = new Date(today)
      day.setDate(today.getDate() + i)
      days.push({
        date: day,
        dayName: format(day, "EEE", { locale: id }),
        dayNumber: format(day, "d"),
        dateString: format(day, "yyyy-MM-dd"),
        isToday: i === 0,
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-black border-gray-800 overflow-hidden shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-xl">{note ? "Edit Note" : "New Note"}</CardTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={onCancel}
              className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSubmit}>
              <div className="p-4">
                <Input
                  placeholder="Judul note..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-gray-900 border-gray-800 text-white placeholder-gray-400 text-lg font-medium mb-2 focus:border-emerald-500"
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none bg-gray-900">
                  <TabsTrigger
                    value="content"
                    className="py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                  >
                    Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="deadline"
                    className="py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                  >
                    Deadline
                  </TabsTrigger>
                </TabsList>

                <div className="p-4">
                  <TabsContent value="content" className="mt-0">
                    <Textarea
                      placeholder="Isi note..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      className="bg-gray-900 border-gray-800 text-white placeholder-gray-400 resize-none focus:border-emerald-500"
                    />
                  </TabsContent>

                  <TabsContent value="deadline" className="mt-0 space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="has-deadline"
                        checked={hasDeadline}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setHasDeadline(checked)
                          console.log("Deadline checkbox changed:", checked)
                          
                          // PERBAIKAN: Set default date dan time jika checkbox dicentang
                          if (checked && !date) {
                            const today = format(new Date(), "yyyy-MM-dd")
                            setDate(today)
                            console.log("Auto-setting date to today:", today)
                          }
                          if (checked && !time) {
                            setTime("09:00")
                            console.log("Auto-setting time to 09:00")
                          }
                        }}
                        className="w-4 h-4 text-emerald-500 bg-gray-900 border-emerald-500 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="has-deadline" className="text-white">
                        Set deadline untuk reminder
                      </label>
                    </div>

                    {hasDeadline && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm text-gray-300 flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Pilih Tanggal
                          </label>

                          <div className="overflow-x-auto pb-2">
                            <div className="flex space-x-2 min-w-max">
                              {calendarDays.map((day, index) => (
                                <motion.button
                                  key={day.dateString}
                                  type="button"
                                  onClick={() => {
                                    setDate(day.dateString)
                                    console.log("Date selected:", day.dateString)
                                  }}
                                  className={cn(
                                    "flex flex-col items-center justify-center rounded-lg p-2 min-w-[3rem] border",
                                    date === day.dateString
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : day.isToday
                                        ? "bg-gray-900 border-gray-700 text-white"
                                        : "bg-gray-900 text-gray-300 hover:bg-gray-800 border-gray-700",
                                  )}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                >
                                  <span className="text-xs font-medium">{day.dayName}</span>
                                  <span className="text-lg font-bold">{day.dayNumber}</span>
                                </motion.button>
                              ))}
                            </div>
                          </div>

                          {/* Alternative Date Input */}
                          <div className="mt-4">
                            <label className="text-sm text-gray-300 flex items-center mb-2">
                              <Calendar className="h-4 w-4 mr-2" />
                              Atau pilih tanggal manual
                            </label>
                            <Input
                              type="date"
                              value={date}
                              onChange={(e) => {
                                setDate(e.target.value)
                                console.log("Manual date input:", e.target.value)
                              }}
                              className="bg-gray-900 border-gray-800 text-white focus:border-emerald-500"
                            />
                          </div>

                          <div className="mt-4">
                            <label className="text-sm text-gray-300 flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Pilih Waktu
                            </label>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              {["09:00", "12:00", "15:00", "18:00"].map((timeOption, index) => (
                                <motion.button
                                  key={timeOption}
                                  type="button"
                                  onClick={() => {
                                    setTime(timeOption)
                                    console.log("Time selected:", timeOption)
                                  }}
                                  className={cn(
                                    "py-2 px-3 rounded-md text-center text-sm border",
                                    time === timeOption
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : "bg-gray-900 text-gray-300 hover:bg-gray-800 border-gray-700",
                                  )}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2 + index * 0.05 }}
                                >
                                  {timeOption}
                                </motion.button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 mt-4">
                            <div className="relative flex-1">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-4 w-4" />
                              <Input
                                type="time"
                                value={time}
                                onChange={(e) => {
                                  setTime(e.target.value)
                                  console.log("Manual time input:", e.target.value)
                                }}
                                className="bg-gray-900 border-gray-800 text-white pl-10 focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          {/* Preview */}
                          {hasDeadline && (
                            <motion.div
                              className="mt-4 p-3 bg-gray-900 rounded-md border border-gray-800"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <p className="text-sm text-gray-400">Reminder akan dikirim pada:</p>
                              <p className="text-white font-medium">
                                {date && time ? (
                                  format(new Date(`${date}T${time}`), "EEEE, d MMMM yyyy - HH:mm", {
                                    locale: id,
                                  }) + " WIB"
                                ) : date ? (
                                  `${format(new Date(date), "EEEE, d MMMM yyyy", { locale: id })} - ${time || "Waktu belum dipilih"}`
                                ) : (
                                  "Tanggal dan waktu belum dipilih"
                                )}
                              </p>
                              
                              {/* Debug Info */}
                              <div className="mt-2 text-xs text-gray-500">
                                Debug: date="{date}", time="{time}", hasDeadline={hasDeadline.toString()}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </>
                    )}
                  </TabsContent>
                </div>
              </Tabs>

              <div className="p-4 bg-black border-t border-gray-900 flex space-x-2">
                <Button
                  type="submit"
                  disabled={isLoading || !title.trim()}
                  className="flex-1 bg-black hover:bg-gray-900 text-white border border-emerald-500"
                >
                  {isLoading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="border-gray-800 text-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
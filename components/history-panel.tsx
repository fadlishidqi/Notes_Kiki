"use client"

import { useState, useEffect } from "react"
import { fetchNoteHistory } from "@/lib/supabase"
import type { NoteHistory } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle, Edit, Trash, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface HistoryPanelProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function HistoryPanel({ userId, isOpen, onClose }: HistoryPanelProps) {
  const [history, setHistory] = useState<NoteHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen, userId])

  const loadHistory = async () => {
    setIsLoading(true)
    const { history, error } = await fetchNoteHistory(userId)
    if (!error) {
      setHistory(history)
    }
    setIsLoading(false)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE, d MMMM yyyy • HH:mm", { locale: id })
  }

  const getFilteredHistory = () => {
    if (activeTab === "all") return history
    return history.filter((item) => item.action === activeTab)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Clock className="h-4 w-4 text-blue-400" />
      case "updated":
        return <Edit className="h-4 w-4 text-yellow-400" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "deleted":
        return <Trash className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-blue-500/10 border-blue-500/20"
      case "updated":
        return "bg-yellow-500/10 border-yellow-500/20"
      case "completed":
        return "bg-green-500/10 border-green-500/20"
      case "deleted":
        return "bg-red-500/10 border-red-500/20"
      default:
        return "bg-gray-500/10 border-gray-500/20"
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-black border-gray-800 overflow-hidden shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-white text-xl">Riwayat Aktivitas</CardTitle>
                <motion.button
                  onClick={onClose}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 rounded-none bg-gray-900">
                    <TabsTrigger
                      value="all"
                      className="py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    >
                      Semua
                    </TabsTrigger>
                    <TabsTrigger
                      value="created"
                      className="py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    >
                      Dibuat
                    </TabsTrigger>
                    <TabsTrigger
                      value="updated"
                      className="py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    >
                      Diubah
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    >
                      Selesai
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-4">
                    <TabsContent value={activeTab} className="mt-0">
                      {isLoading ? (
                        <div className="text-center py-8">
                          <p className="text-gray-400">Loading...</p>
                        </div>
                      ) : getFilteredHistory().length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-400">Belum ada riwayat aktivitas</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-3">
                            {getFilteredHistory().map((item, index) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-3 rounded-md border ${getActionColor(item.action)}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 p-2 bg-gray-900 rounded-full">{getActionIcon(item.action)}</div>
                                  <div className="flex-1">
                                    <p className="text-white">{item.action_details}</p>
                                    <p className="text-xs text-gray-400 mt-1">{formatDate(item.created_at)}</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

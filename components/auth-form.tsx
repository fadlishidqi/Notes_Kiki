"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { loginWithUsername, registerUser } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { LucideNotebook, User, Phone, ArrowRight, Loader2 } from "lucide-react"
import { NetworkAnimation } from "./network-animation"

interface AuthFormProps {
  onLogin: (userId: string) => void
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [username, setUsername] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("login")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const { user, error } = await loginWithUsername(username)

      if (error) throw error
      if (!user) throw new Error("User not found")

      onLogin(user.id)
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      // Validate phone number format
      if (!phoneNumber.match(/^\+?[0-9]{10,15}$/)) {
        throw new Error("Nomor telepon tidak valid. Gunakan format: +628123456789")
      }

      const { user, error } = await registerUser(username, phoneNumber)

      if (error) throw error
      if (!user) throw new Error("Gagal mendaftarkan pengguna")

      setMessage("Registrasi berhasil! Silakan login.")
      setActiveTab("login")
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-black">
      {/* Network Animation Background */}
      <NetworkAnimation />

      <div className="absolute inset-0 bg-black/50 z-0"></div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mb-8 text-center z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2,
          }}
          className="inline-block p-4 rounded-full bg-black border border-emerald-500/30 mb-4 shadow-lg floating"
        >
          <LucideNotebook className="h-10 w-10 text-emerald-500" />
        </motion.div>
        <motion.h1
          className="text-4xl font-bold text-white mb-2 drop-shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Notes Kiki
        </motion.h1>
        <motion.p
          className="text-gray-300 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Catat ide dan jadwal dengan mudah
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-black/90 backdrop-blur-md border-emerald-500/20 overflow-hidden shadow-xl">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Fixed Tab Headers */}
              <TabsList className="grid w-full grid-cols-2 rounded-none bg-gray-900/80 h-12">
                <TabsTrigger
                  value="login"
                  className="h-10 text-base font-medium data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="h-10 text-base font-medium data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all"
                >
                  Register
                </TabsTrigger>
              </TabsList>

              {/* Form Content */}
              <div className="p-6">
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300 font-medium">Username</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-4 w-4" />
                        <Input
                          placeholder="Masukkan username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          disabled={isLoading}
                          className="bg-gray-900 border-gray-800 text-white placeholder-gray-400 pl-10 h-12 text-base focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    {/* Fixed Size Login Button */}
                    <Button
                      type="submit"
                      disabled={isLoading || !username.trim()}
                      className="w-full h-12 bg-black hover:bg-gray-900 text-white border border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium transition-all"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Login</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="mt-0">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300 font-medium">Username</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-4 w-4" />
                        <Input
                          placeholder="Pilih username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          disabled={isLoading}
                          className="bg-gray-900 border-gray-800 text-white placeholder-gray-400 pl-10 h-12 text-base focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300 font-medium">Nomor WhatsApp</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-4 w-4" />
                        <Input
                          placeholder="+628123456789"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          disabled={isLoading}
                          className="bg-gray-900 border-gray-800 text-white placeholder-gray-400 pl-10 h-12 text-base focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </div>
                      <p className="text-xs text-gray-400">Format: +628123456789 (dengan kode negara)</p>
                    </div>
                    
                    {/* Fixed Size Register Button */}
                    <Button
                      type="submit"
                      disabled={isLoading || !username.trim() || !phoneNumber.trim()}
                      className="w-full h-12 bg-black hover:bg-gray-900 text-white border border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium transition-all"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Register</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </div>
            </Tabs>

            {/* Fixed Message Area */}
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={`px-6 py-4 text-sm text-center border-t border-gray-800 ${
                  message.includes("berhasil") ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
                }`}
              >
                {message}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center text-gray-400 text-sm"
        >
          <p>Buat dan kelola notes dengan reminder WhatsApp otomatis</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
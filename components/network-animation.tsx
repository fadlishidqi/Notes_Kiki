"use client"

import { useEffect, useRef } from "react"

interface Point {
  x: number
  y: number
  vx: number
  vy: number
  connections: number[]
}

export function NetworkAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let points: Point[] = []
    const numPoints = 30
    const connectionDistance = 150
    const pointSize = 2
    const pointColor = "rgba(16, 185, 129, 0.7)"
    const lineColor = "rgba(16, 185, 129, 0.2)"

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initPoints()
    }

    const initPoints = () => {
      points = []
      for (let i = 0; i < numPoints; i++) {
        points.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          connections: [],
        })
      }
    }

    const updatePoints = () => {
      for (let i = 0; i < points.length; i++) {
        const point = points[i]

        // Update position
        point.x += point.vx
        point.y += point.vy

        // Bounce off edges
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1

        // Reset connections
        point.connections = []

        // Find connections
        for (let j = 0; j < points.length; j++) {
          if (i === j) continue

          const otherPoint = points[j]
          const dx = point.x - otherPoint.x
          const dy = point.y - otherPoint.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            point.connections.push(j)
          }
        }
      }
    }

    const drawPoints = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections first
      for (let i = 0; i < points.length; i++) {
        const point = points[i]

        for (const connectionIndex of point.connections) {
          const connectedPoint = points[connectionIndex]
          const dx = point.x - connectedPoint.x
          const dy = point.y - connectedPoint.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const opacity = 1 - distance / connectionDistance

          ctx.beginPath()
          ctx.moveTo(point.x, point.y)
          ctx.lineTo(connectedPoint.x, connectedPoint.y)
          ctx.strokeStyle = lineColor
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // Draw points
      for (const point of points) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2)
        ctx.fillStyle = pointColor
        ctx.fill()
      }
    }

    const animate = () => {
      updatePoints()
      drawPoints()
      animationFrameId = requestAnimationFrame(animate)
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />
}

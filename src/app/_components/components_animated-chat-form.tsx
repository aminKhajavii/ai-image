'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Plus, ArrowUp } from 'lucide-react'
import { cn } from "@/lib/utils"

export default function AnimatedChatForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const particles: { x: number; y: number; dx: number; dy: number; length: number; speed: number; hue: number }[] = []

    // Create trails from each side
    const createTrail = (x: number, y: number, dx: number, dy: number, hue: number) => {
      particles.push({ x, y, dx, dy, length: 20, speed: 2, hue })
    }

    // Initialize particles
    for (let i = 0; i < 10; i++) {
      // Top and bottom
      createTrail(canvas.width * (i / 10), 0, 0, 1, i * 36)
      createTrail(canvas.width * (i / 10), canvas.height, 0, -1, i * 36 + 180)
      // Left and right
      createTrail(0, canvas.height * (i / 10), 1, 0, i * 36 + 90)
      createTrail(canvas.width, canvas.height * (i / 10), -1, 0, i * 36 + 270)
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      particles.forEach(particle => {
        // Draw trail
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        const endX = particle.x - particle.dx * particle.length
        const endY = particle.y - particle.dy * particle.length
        ctx.lineTo(endX, endY)
        
        const gradient = ctx.createLinearGradient(particle.x, particle.y, endX, endY)
        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 50%, 1)`)
        gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 50%, 0.1)`)
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = 3
        ctx.stroke()

        // Update position
        particle.x += particle.dx * particle.speed
        particle.y += particle.dy * particle.speed

        // Calculate distance to center
        const dx = centerX - particle.x
        const dy = centerY - particle.y
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy)
        particle.speed = 2 + (1 - distanceToCenter / (Math.max(canvas.width, canvas.height) / 2)) * 3

        // Reset particle if it reaches center or goes off-screen
        if (distanceToCenter < 5 || 
            particle.x < 0 || particle.x > canvas.width || 
            particle.y < 0 || particle.y > canvas.height) {
          if (particle.dx !== 0) { // Horizontal movement
            particle.x = particle.dx > 0 ? 0 : canvas.width
            particle.y = Math.random() * canvas.height
          } else { // Vertical movement
            particle.x = Math.random() * canvas.width
            particle.y = particle.dy > 0 ? 0 : canvas.height
          }
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      console.log('Submitted:', message)
      setMessage('')
    }
  }

  return (
    <div className="relative min-h-screen bg-black flex flex-col">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-white mb-8">What can I help you ship?</h1>
        <form 
          onSubmit={handleSubmit}
          className="w-full max-w-3xl"
        >
          <div className="relative flex items-center">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask v0 a question..."
              className="w-full bg-white/10 border-0 focus-visible:ring-0 text-white placeholder:text-gray-400 text-lg py-6"
            />
            <div className="absolute left-3 flex items-center gap-2">
              <Button 
                type="button" 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button 
                type="button" 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Plus className="h-5 w-5" />
                <span className="sr-only">Add Project</span>
              </Button>
            </div>
            <Button 
              type="submit"
              size="icon"
              className={cn(
                "absolute right-3 h-9 w-9 bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white",
                message.trim() && "bg-white text-black hover:bg-white hover:text-black"
              )}
            >
              <ArrowUp className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </div>
      <footer className="relative p-4 flex justify-center gap-4 text-sm text-gray-400">
        <a href="#" className="hover:text-white">Pricing</a>
        <a href="#" className="hover:text-white">Enterprise</a>
        <a href="#" className="hover:text-white">FAQ</a>
        <a href="#" className="hover:text-white">Legal</a>
        <a href="#" className="hover:text-white">Privacy</a>
      </footer>
    </div>
  )
}


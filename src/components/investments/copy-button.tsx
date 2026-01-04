'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CopyButtonProps = {
  text: string
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      
      // Force reflow to ensure animation triggers on mobile
      requestAnimationFrame(() => {
        setIsAnimating(true)
        setCopied(true)
      })
      
      // Reset animation state after animation completes
      setTimeout(() => {
        setIsAnimating(false)
      }, 400)
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={cn(
        "h-8 w-8 relative overflow-hidden transition-all duration-200",
        "hover:bg-primary/10 hover:scale-110",
        "active:scale-95 touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        copied && "bg-green-50 dark:bg-green-950/20"
      )}
      title={copied ? 'Copied!' : 'Copy address'}
      aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
    >
      {/* Ripple effect on click */}
      {isAnimating && (
        <span
          className="absolute inset-0 rounded-full bg-green-500/30"
          style={{
            animation: 'ping 0.6s cubic-bezier(0, 0, 0.2, 1)',
            WebkitAnimation: 'ping 0.6s cubic-bezier(0, 0, 0.2, 1)',
          }}
        />
      )}
      
      {/* Icon container - properly centered */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <div className="relative w-4 h-4 flex items-center justify-center">
          {/* Copy icon - fades out when copied */}
          <Copy 
            className={cn(
              "h-4 w-4 transition-all duration-300 absolute",
              "will-change-transform",
              copied ? "opacity-0 scale-0 rotate-90" : "opacity-100 scale-100 rotate-0",
              "hover:rotate-12"
            )}
          />
          {/* Check icon - fades in when copied */}
          <Check 
            className={cn(
              "h-4 w-4 text-green-600 dark:text-green-400 transition-all duration-300 absolute",
              "will-change-transform",
              copied ? "opacity-100 scale-100" : "opacity-0 scale-0"
            )}
            style={isAnimating ? {
              animation: 'zoom-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              WebkitAnimation: 'zoom-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              willChange: 'transform',
            } : undefined}
          />
        </div>
      </div>
      
      {/* Success glow effect */}
      {copied && !isAnimating && (
        <div
          className="absolute inset-0 rounded-full bg-green-500/20 blur-sm"
          style={{
            animation: 'pulse 1.5s ease-in-out infinite',
            WebkitAnimation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}
    </Button>
  )
}


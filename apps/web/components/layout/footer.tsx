'use client'

import Link from 'next/link'
import { Logo } from '../ui/logo'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Simple one-line footer like Vercel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo on the left */}
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="AWE - Awesome Workspace Engineering Home">
              <Logo size="sm" variant="default" />
            </Link>
            <span className="text-sm text-muted-foreground">
              © {currentYear} AWE
            </span>
          </div>

          {/* Links in the middle/right */}
          <nav className="flex items-center gap-6 text-sm">
            <Link 
              href="/docs" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link 
              href="/pricing" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/about" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link 
              href="/privacy-policy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/terms-of-service" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <a 
              href="https://github.com/awehq/awe" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
"use client"

import * as React from "react"
import { Monitor, Moon, Palette, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { themes } from "../../lib/themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <Palette className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const currentTheme = themes.find(t => t.value === theme) || themes[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {theme === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color Themes</DropdownMenuLabel>
        
        {themes.slice(2).map((t) => (
          <DropdownMenuItem 
            key={t.value} 
            onClick={() => setTheme(t.value)}
          >
            <div className="flex items-center gap-2 w-full">
              <div 
                className="w-4 h-4 rounded-full border"
                style={{
                  background: `hsl(${t.colors.primary})`,
                  borderColor: `hsl(${t.colors.border})`
                }}
              />
              <span className="flex-1">{t.name}</span>
              {theme === t.value && <span>✓</span>}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
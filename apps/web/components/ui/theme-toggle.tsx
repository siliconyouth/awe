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
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="gap-2">
        <Palette className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  // Get the current theme display info
  const getThemeIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-4 w-4" />
    }
    if (resolvedTheme === "dark") {
      return <Moon className="h-4 w-4" />
    }
    return <Sun className="h-4 w-4" />
  }

  const getThemeName = () => {
    if (theme === "system") return "System"
    if (theme === "dark") return "Dark"
    if (theme === "light") return "Light"
    const customTheme = themes.find(t => t.value === theme)
    return customTheme?.name || "Light"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {getThemeIcon()}
          <span className="hidden sm:inline-block text-sm">{getThemeName()}</span>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Basic Themes */}
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="flex items-center justify-between p-2 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Sun className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Light</span>
              {/* Mini preview */}
              <div className="flex gap-0.5 p-1 rounded border bg-white">
                <div className="w-2 h-2 rounded-sm bg-gray-100" />
                <div className="w-2 h-2 rounded-sm bg-gray-900" />
                <div className="w-2 h-2 rounded-sm bg-blue-500" />
              </div>
            </div>
          </div>
          {theme === "light" && <span className="text-primary">✓</span>}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between p-2 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Moon className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Dark</span>
              {/* Mini preview */}
              <div className="flex gap-0.5 p-1 rounded border bg-gray-950">
                <div className="w-2 h-2 rounded-sm bg-gray-800" />
                <div className="w-2 h-2 rounded-sm bg-gray-100" />
                <div className="w-2 h-2 rounded-sm bg-blue-600" />
              </div>
            </div>
          </div>
          {theme === "dark" && <span className="text-primary">✓</span>}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="flex items-center justify-between p-2 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Monitor className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">System</span>
              {/* Mini preview split */}
              <div className="flex gap-0 p-1 rounded border overflow-hidden">
                <div className="flex gap-0.5 bg-white pr-0.5">
                  <div className="w-1.5 h-2 bg-gray-900" />
                </div>
                <div className="flex gap-0.5 bg-gray-950 pl-0.5 pr-0.5">
                  <div className="w-1.5 h-2 bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
          {theme === "system" && <span className="text-primary">✓</span>}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Color Themes</DropdownMenuLabel>
        
        {themes.slice(2).map((t) => (
          <DropdownMenuItem 
            key={t.value} 
            onClick={() => setTheme(t.value)}
            className="flex items-center justify-between p-2 cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t.name}</span>
                {/* Theme preview with multiple color swatches */}
                <div className="flex gap-0.5 p-1 rounded border" 
                  style={{
                    backgroundColor: `hsl(${t.colors.background})`,
                    borderColor: `hsl(${t.colors.border})`
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-sm"
                    style={{ backgroundColor: `hsl(${t.colors.primary})` }}
                  />
                  <div 
                    className="w-2 h-2 rounded-sm"
                    style={{ backgroundColor: `hsl(${t.colors.foreground})` }}
                  />
                  <div 
                    className="w-2 h-2 rounded-sm"
                    style={{ backgroundColor: `hsl(${t.colors.muted})` }}
                  />
                </div>
              </div>
            </div>
            {theme === t.value && <span className="text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
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
import { cn } from "../../lib/utils"

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
      <DropdownMenuContent align="end" className="w-80 p-3">
        <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Choose Theme
        </DropdownMenuLabel>
        
        {/* Light Theme */}
        <div 
          onClick={() => setTheme("light")}
          className={cn(
            "relative mb-2 cursor-pointer rounded-lg border-2 transition-all hover:shadow-md",
            theme === "light" ? "border-primary shadow-md" : "border-transparent"
          )}
        >
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <span className="text-sm font-medium">Light</span>
              </div>
              {theme === "light" && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </div>
            {/* Mini window preview */}
            <div className="rounded-md border bg-white overflow-hidden">
              <div className="h-5 bg-gray-100 border-b flex items-center px-1.5 gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <div className="p-2 space-y-1">
                <div className="h-2 bg-gray-900 rounded w-3/4" />
                <div className="h-2 bg-gray-300 rounded w-full" />
                <div className="h-2 bg-gray-300 rounded w-5/6" />
                <div className="h-3 bg-blue-500 rounded w-1/3 mt-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Dark Theme */}
        <div 
          onClick={() => setTheme("dark")}
          className={cn(
            "relative mb-2 cursor-pointer rounded-lg border-2 transition-all hover:shadow-md",
            theme === "dark" ? "border-primary shadow-md" : "border-transparent"
          )}
        >
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <span className="text-sm font-medium">Dark</span>
              </div>
              {theme === "dark" && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </div>
            {/* Mini window preview */}
            <div className="rounded-md border border-gray-700 bg-gray-950 overflow-hidden">
              <div className="h-5 bg-gray-900 border-b border-gray-800 flex items-center px-1.5 gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <div className="p-2 space-y-1">
                <div className="h-2 bg-gray-100 rounded w-3/4" />
                <div className="h-2 bg-gray-700 rounded w-full" />
                <div className="h-2 bg-gray-700 rounded w-5/6" />
                <div className="h-3 bg-blue-600 rounded w-1/3 mt-2" />
              </div>
            </div>
          </div>
        </div>

        {/* System Theme */}
        <div 
          onClick={() => setTheme("system")}
          className={cn(
            "relative mb-3 cursor-pointer rounded-lg border-2 transition-all hover:shadow-md",
            theme === "system" ? "border-primary shadow-md" : "border-transparent"
          )}
        >
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="text-sm font-medium">System</span>
              </div>
              {theme === "system" && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </div>
            {/* Split preview */}
            <div className="rounded-md border overflow-hidden flex">
              <div className="w-1/2 bg-white border-r">
                <div className="h-5 bg-gray-100 border-b flex items-center px-1.5 gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </div>
                <div className="p-1.5 space-y-0.5">
                  <div className="h-1.5 bg-gray-900 rounded w-3/4" />
                  <div className="h-1.5 bg-gray-300 rounded w-full" />
                  <div className="h-2 bg-blue-500 rounded w-1/3 mt-1" />
                </div>
              </div>
              <div className="w-1/2 bg-gray-950">
                <div className="h-5 bg-gray-900 border-b border-gray-800 flex items-center px-1.5 gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </div>
                <div className="p-1.5 space-y-0.5">
                  <div className="h-1.5 bg-gray-100 rounded w-3/4" />
                  <div className="h-1.5 bg-gray-700 rounded w-full" />
                  <div className="h-2 bg-blue-600 rounded w-1/3 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Color Themes
        </DropdownMenuLabel>
        
        <div className="grid grid-cols-2 gap-2">
          {themes.slice(2).map((t) => (
            <div
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-md",
                theme === t.value ? "border-primary shadow-md" : "border-transparent"
              )}
            >
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">{t.name}</span>
                  {theme === t.value && (
                    <div className="h-4 w-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `hsl(${t.colors.primary})` }}
                    >
                      <span className="text-xs" style={{ color: `hsl(${t.colors.primary-foreground || t.colors.background})` }}>✓</span>
                    </div>
                  )}
                </div>
                {/* Mini window preview with theme colors */}
                <div 
                  className="rounded border overflow-hidden"
                  style={{ 
                    backgroundColor: `hsl(${t.colors.background})`,
                    borderColor: `hsl(${t.colors.border})`
                  }}
                >
                  <div 
                    className="h-4 border-b flex items-center px-1 gap-0.5"
                    style={{ 
                      backgroundColor: `hsl(${t.colors.muted})`,
                      borderColor: `hsl(${t.colors.border})`
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <div 
                      className="h-1.5 rounded w-3/4"
                      style={{ backgroundColor: `hsl(${t.colors.foreground})` }}
                    />
                    <div 
                      className="h-1.5 rounded w-full"
                      style={{ backgroundColor: `hsl(${t.colors.muted})` }}
                    />
                    <div 
                      className="h-2 rounded w-1/3 mt-1"
                      style={{ backgroundColor: `hsl(${t.colors.primary})` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
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
      <DropdownMenuContent align="end" className="w-96 p-4 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 max-h-[80vh] overflow-y-auto">
        <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Choose Theme
        </DropdownMenuLabel>
        
        {/* Light Theme */}
        <div 
          onClick={() => setTheme("light")}
          className={cn(
            "relative mb-3 cursor-pointer rounded-xl border-2 transition-all hover:shadow-lg overflow-hidden group",
            theme === "light" ? "border-primary shadow-lg" : "border-muted hover:border-muted-foreground/20"
          )}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold">Light</span>
              </div>
              {theme === "light" && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </div>
              )}
            </div>
            {/* Enhanced preview */}
            <div className="rounded-lg overflow-hidden border shadow-sm bg-gradient-to-br from-white to-gray-50">
              {/* Browser header */}
              <div className="h-6 bg-gray-100 border-b flex items-center px-2 gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-80" />
                <div className="ml-2 flex-1 h-3 bg-white rounded-sm" />
              </div>
              {/* Content area */}
              <div className="p-3 space-y-2 bg-white">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-400 to-blue-500" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 bg-gray-800 rounded w-2/3" />
                    <div className="h-2 bg-gray-400 rounded w-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 bg-gray-200 rounded" />
                  <div className="h-2 bg-gray-200 rounded w-5/6" />
                  <div className="h-2 bg-gray-200 rounded w-4/6" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-blue-500 rounded flex-1" />
                  <div className="h-6 bg-gray-200 rounded flex-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dark Theme */}
        <div 
          onClick={() => setTheme("dark")}
          className={cn(
            "relative mb-3 cursor-pointer rounded-xl border-2 transition-all hover:shadow-lg overflow-hidden group",
            theme === "dark" ? "border-primary shadow-lg" : "border-muted hover:border-muted-foreground/20"
          )}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold">Dark</span>
              </div>
              {theme === "dark" && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </div>
              )}
            </div>
            {/* Enhanced preview */}
            <div className="rounded-lg overflow-hidden border border-gray-800 shadow-sm bg-gradient-to-br from-gray-950 to-gray-900">
              {/* Browser header */}
              <div className="h-6 bg-gray-900 border-b border-gray-800 flex items-center px-2 gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-80" />
                <div className="ml-2 flex-1 h-3 bg-gray-800 rounded-sm" />
              </div>
              {/* Content area */}
              <div className="p-3 space-y-2 bg-gray-950">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-500 to-blue-600" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 bg-gray-100 rounded w-2/3" />
                    <div className="h-2 bg-gray-500 rounded w-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 bg-gray-800 rounded" />
                  <div className="h-2 bg-gray-800 rounded w-5/6" />
                  <div className="h-2 bg-gray-800 rounded w-4/6" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-blue-600 rounded flex-1" />
                  <div className="h-6 bg-gray-800 rounded flex-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Theme */}
        <div 
          onClick={() => setTheme("system")}
          className={cn(
            "relative mb-4 cursor-pointer rounded-xl border-2 transition-all hover:shadow-lg overflow-hidden group",
            theme === "system" ? "border-primary shadow-lg" : "border-muted hover:border-muted-foreground/20"
          )}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold">System</span>
                <span className="text-xs text-muted-foreground">(Auto)</span>
              </div>
              {theme === "system" && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </div>
              )}
            </div>
            {/* Split preview showing both themes */}
            <div className="rounded-lg overflow-hidden border shadow-sm flex">
              {/* Light half */}
              <div className="w-1/2 bg-gradient-to-br from-white to-gray-50 border-r">
                <div className="h-6 bg-gray-100 border-b flex items-center px-2 gap-0.5">
                  <div className="w-2 h-2 rounded-full bg-red-400 opacity-80" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400 opacity-80" />
                  <div className="w-2 h-2 rounded-full bg-green-400 opacity-80" />
                </div>
                <div className="p-2 space-y-1.5 bg-white">
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded bg-gradient-to-br from-yellow-400 to-orange-500" />
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 bg-gray-800 rounded w-3/4" />
                      <div className="h-1.5 bg-gray-400 rounded w-full" />
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded" />
                  <div className="h-4 bg-blue-500 rounded w-2/5 mt-1" />
                </div>
              </div>
              {/* Dark half */}
              <div className="w-1/2 bg-gradient-to-br from-gray-950 to-gray-900">
                <div className="h-6 bg-gray-900 border-b border-gray-800 flex items-center px-2 gap-0.5">
                  <div className="w-2 h-2 rounded-full bg-red-400 opacity-80" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400 opacity-80" />
                  <div className="w-2 h-2 rounded-full bg-green-400 opacity-80" />
                </div>
                <div className="p-2 space-y-1.5 bg-gray-950">
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-400 to-indigo-600" />
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 bg-gray-100 rounded w-3/4" />
                      <div className="h-1.5 bg-gray-500 rounded w-full" />
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded" />
                  <div className="h-4 bg-blue-600 rounded w-2/5 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Color Themes
        </DropdownMenuLabel>
        
        <div className="grid grid-cols-2 gap-3">
          {themes.slice(2).map((t) => (
            <div
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "relative cursor-pointer rounded-xl border-2 transition-all hover:shadow-lg overflow-hidden group",
                theme === t.value ? "border-primary shadow-lg" : "border-muted hover:border-muted-foreground/20"
              )}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold">{t.name}</span>
                  {theme === t.value && (
                    <div className="h-4 w-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `hsl(${t.colors.primary})` }}
                    >
                      <span className="text-xs font-bold" style={{ color: `hsl(${t.colors.primaryForeground || t.colors.background})` }}>✓</span>
                    </div>
                  )}
                </div>
                {/* Enhanced mini preview with theme colors */}
                <div 
                  className="rounded-lg overflow-hidden border shadow-sm"
                  style={{ 
                    background: `linear-gradient(135deg, hsl(${t.colors.background}) 0%, hsl(${t.colors.card || t.colors.background}) 100%)`,
                    borderColor: `hsl(${t.colors.border})`
                  }}
                >
                  {/* Browser header */}
                  <div 
                    className="h-5 border-b flex items-center px-1.5 gap-0.5"
                    style={{ 
                      backgroundColor: `hsl(${t.colors.muted})`,
                      borderColor: `hsl(${t.colors.border})`
                    }}
                  >
                    <div className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: '#ef4444' }} />
                    <div className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: '#eab308' }} />
                    <div className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: '#22c55e' }} />
                  </div>
                  {/* Content preview */}
                  <div className="p-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="h-5 w-5 rounded"
                        style={{ 
                          background: `linear-gradient(135deg, hsl(${t.colors.primary}) 0%, hsl(${t.colors.secondary || t.colors.primary}) 100%)`
                        }}
                      />
                      <div className="flex-1 space-y-1">
                        <div 
                          className="h-1.5 rounded w-3/4"
                          style={{ backgroundColor: `hsl(${t.colors.foreground})` }}
                        />
                        <div 
                          className="h-1.5 rounded w-full opacity-60"
                          style={{ backgroundColor: `hsl(${t.colors.mutedForeground || t.colors.foreground})` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div 
                        className="h-3 rounded flex-1"
                        style={{ backgroundColor: `hsl(${t.colors.primary})` }}
                      />
                      <div 
                        className="h-3 rounded flex-1 opacity-40"
                        style={{ backgroundColor: `hsl(${t.colors.secondary || t.colors.muted})` }}
                      />
                    </div>
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
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { themes } from "../../lib/themes"

export function ThemeProvider({ 
  children, 
  ...props 
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider 
      themes={themes.map(t => t.value)}
      defaultTheme="system"
      attribute="class"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeColorApplier />
      {children}
    </NextThemesProvider>
  )
}

function ThemeColorApplier() {
  const { theme } = useNextTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return

    const selectedTheme = themes.find(t => t.value === theme)
    if (!selectedTheme || theme === "system") return

    // Apply theme colors as CSS variables
    const root = document.documentElement
    Object.entries(selectedTheme.colors).forEach(([key, value]) => {
      const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      root.style.setProperty(cssVarName, value)
    })

    // Add theme class for specific styling
    document.documentElement.className = theme === "light" || theme === "dark" 
      ? theme 
      : `${theme} dark`
  }, [theme, mounted])

  return null
}
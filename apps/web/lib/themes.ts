export interface Theme {
  name: string
  value: string
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
  }
}

export const themes: Theme[] = [
  {
    name: "Light",
    value: "light",
    colors: {
      background: "0 0% 100%",
      foreground: "240 10% 3.9%",
      card: "0 0% 100%",
      cardForeground: "240 10% 3.9%",
      popover: "0 0% 100%",
      popoverForeground: "240 10% 3.9%",
      primary: "240 5.9% 10%",
      primaryForeground: "0 0% 98%",
      secondary: "240 4.8% 95.9%",
      secondaryForeground: "240 5.9% 10%",
      muted: "240 4.8% 95.9%",
      mutedForeground: "240 3.8% 46.1%",
      accent: "240 4.8% 95.9%",
      accentForeground: "240 5.9% 10%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "240 5.9% 90%",
      input: "240 5.9% 90%",
      ring: "240 5.9% 10%",
    }
  },
  {
    name: "Dark",
    value: "dark",
    colors: {
      background: "240 10% 3.9%",
      foreground: "0 0% 98%",
      card: "240 10% 3.9%",
      cardForeground: "0 0% 98%",
      popover: "240 10% 3.9%",
      popoverForeground: "0 0% 98%",
      primary: "0 0% 98%",
      primaryForeground: "240 5.9% 10%",
      secondary: "240 3.7% 15.9%",
      secondaryForeground: "0 0% 98%",
      muted: "240 3.7% 15.9%",
      mutedForeground: "240 5% 64.9%",
      accent: "240 3.7% 15.9%",
      accentForeground: "0 0% 98%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "0 0% 98%",
      border: "240 3.7% 15.9%",
      input: "240 3.7% 15.9%",
      ring: "240 4.9% 83.9%",
    }
  },
  {
    name: "Dracula",
    value: "dracula",
    colors: {
      background: "231 15% 18%", // #282a36
      foreground: "60 30% 96%", // #f8f8f2
      card: "231 15% 18%",
      cardForeground: "60 30% 96%",
      popover: "231 15% 18%",
      popoverForeground: "60 30% 96%",
      primary: "265 89% 78%", // #bd93f9 (purple)
      primaryForeground: "231 15% 18%",
      secondary: "326 100% 74%", // #50fa7b (green)
      secondaryForeground: "231 15% 18%",
      muted: "232 14% 31%", // #44475a
      mutedForeground: "225 27% 51%", // #6272a4
      accent: "135 94% 65%", // #8be9fd (cyan)
      accentForeground: "231 15% 18%",
      destructive: "0 100% 67%", // #ff5555 (red)
      destructiveForeground: "231 15% 18%",
      border: "232 14% 31%",
      input: "232 14% 31%",
      ring: "265 89% 78%",
    }
  },
  {
    name: "Monokai Pro",
    value: "monokai-pro",
    colors: {
      background: "70 8% 15%", // #2d2a2e
      foreground: "60 30% 96%", // #fcfcfa
      card: "70 8% 15%",
      cardForeground: "60 30% 96%",
      popover: "70 8% 15%",
      popoverForeground: "60 30% 96%",
      primary: "355 65% 65%", // #ff6188 (red/pink)
      primaryForeground: "70 8% 15%",
      secondary: "95 38% 62%", // #a9dc76 (green)
      secondaryForeground: "70 8% 15%",
      muted: "270 9% 25%", // #403e41
      mutedForeground: "270 5% 56%", // #939293
      accent: "186 57% 60%", // #78dce8 (cyan)
      accentForeground: "70 8% 15%",
      destructive: "5 48% 51%", // #ab6141 (orange)
      destructiveForeground: "60 30% 96%",
      border: "270 9% 25%",
      input: "270 9% 25%",
      ring: "355 65% 65%",
    }
  },
  {
    name: "GitHub Dark",
    value: "github-dark",
    colors: {
      background: "215 28% 7%", // #0d1117
      foreground: "210 12% 82%", // #c9d1d9
      card: "215 21% 11%", // #161b22
      cardForeground: "210 12% 82%",
      popover: "215 21% 11%",
      popoverForeground: "210 12% 82%",
      primary: "212 92% 45%", // #58a6ff
      primaryForeground: "0 0% 100%",
      secondary: "157 56% 37%", // #3fb950
      secondaryForeground: "0 0% 100%",
      muted: "215 14% 22%", // #30363d
      mutedForeground: "215 8% 47%", // #8b949e
      accent: "28 100% 54%", // #f78166
      accentForeground: "215 28% 7%",
      destructive: "0 72% 51%", // #da3633
      destructiveForeground: "0 0% 100%",
      border: "215 14% 22%",
      input: "215 14% 22%",
      ring: "212 92% 45%",
    }
  },
  {
    name: "Tokyo Night",
    value: "tokyo-night",
    colors: {
      background: "235 22% 11%", // #1a1b26
      foreground: "233 10% 82%", // #c0caf5
      card: "235 22% 11%",
      cardForeground: "233 10% 82%",
      popover: "235 22% 11%",
      popoverForeground: "233 10% 82%",
      primary: "216 87% 65%", // #7aa2f7
      primaryForeground: "235 22% 11%",
      secondary: "158 64% 52%", // #9ece6a
      secondaryForeground: "235 22% 11%",
      muted: "234 19% 18%", // #24283b
      mutedForeground: "235 10% 55%", // #828bb8
      accent: "259 54% 59%", // #bb9af7
      accentForeground: "235 22% 11%",
      destructive: "353 86% 65%", // #f7768e
      destructiveForeground: "235 22% 11%",
      border: "234 19% 18%",
      input: "234 19% 18%",
      ring: "216 87% 65%",
    }
  },
  {
    name: "One Dark Pro",
    value: "one-dark-pro",
    colors: {
      background: "220 13% 18%", // #282c34
      foreground: "219 14% 71%", // #abb2bf
      card: "220 13% 18%",
      cardForeground: "219 14% 71%",
      popover: "220 13% 18%",
      popoverForeground: "219 14% 71%",
      primary: "207 82% 66%", // #61afef (blue)
      primaryForeground: "220 13% 18%",
      secondary: "95 38% 62%", // #98c379 (green)
      secondaryForeground: "220 13% 18%",
      muted: "220 12% 22%", // #31353f
      mutedForeground: "218 11% 40%", // #5c6370
      accent: "286 60% 67%", // #c678dd (purple)
      accentForeground: "220 13% 18%",
      destructive: "353 86% 65%", // #e06c75 (red)
      destructiveForeground: "220 13% 18%",
      border: "220 12% 22%",
      input: "220 12% 22%",
      ring: "207 82% 66%",
    }
  },
  {
    name: "Solarized Dark",
    value: "solarized-dark",
    colors: {
      background: "192 100% 5%", // #002b36
      foreground: "186 8% 55%", // #839496
      card: "194 100% 7%", // #073642
      cardForeground: "186 8% 55%",
      popover: "194 100% 7%",
      popoverForeground: "186 8% 55%",
      primary: "205 82% 47%", // #268bd2 (blue)
      primaryForeground: "192 100% 5%",
      secondary: "68 100% 30%", // #859900 (green)
      secondaryForeground: "192 100% 5%",
      muted: "195 61% 11%", // #073642
      mutedForeground: "194 14% 40%", // #586e75
      accent: "237 43% 52%", // #6c71c4 (violet)
      accentForeground: "192 100% 5%",
      destructive: "1 71% 52%", // #dc322f (red)
      destructiveForeground: "192 100% 5%",
      border: "195 61% 11%",
      input: "195 61% 11%",
      ring: "205 82% 47%",
    }
  },
  {
    name: "Nord",
    value: "nord",
    colors: {
      background: "220 16% 22%", // #2e3440
      foreground: "218 27% 94%", // #eceff4
      card: "222 16% 28%", // #3b4252
      cardForeground: "218 27% 94%",
      popover: "222 16% 28%",
      popoverForeground: "218 27% 94%",
      primary: "213 32% 52%", // #5e81ac
      primaryForeground: "218 27% 94%",
      secondary: "92 28% 65%", // #a3be8c
      secondaryForeground: "220 16% 22%",
      muted: "220 16% 36%", // #4c566a
      mutedForeground: "219 28% 88%", // #d8dee9
      accent: "193 43% 67%", // #88c0d0
      accentForeground: "220 16% 22%",
      destructive: "354 42% 56%", // #bf616a
      destructiveForeground: "218 27% 94%",
      border: "220 16% 36%",
      input: "220 16% 36%",
      ring: "213 32% 52%",
    }
  },
  {
    name: "Catppuccin Mocha",
    value: "catppuccin-mocha",
    colors: {
      background: "240 21% 12%", // #1e1e2e
      foreground: "226 64% 88%", // #cdd6f4
      card: "240 21% 15%", // #181825
      cardForeground: "226 64% 88%",
      popover: "240 21% 15%",
      popoverForeground: "226 64% 88%",
      primary: "217 92% 76%", // #89b4fa (blue)
      primaryForeground: "240 21% 12%",
      secondary: "115 54% 76%", // #a6e3a1 (green)
      secondaryForeground: "240 21% 12%",
      muted: "237 16% 23%", // #313244
      mutedForeground: "233 12% 39%", // #585b70
      accent: "267 84% 81%", // #cba6f7 (mauve)
      accentForeground: "240 21% 12%",
      destructive: "343 81% 75%", // #f38ba8 (red)
      destructiveForeground: "240 21% 12%",
      border: "237 16% 23%",
      input: "237 16% 23%",
      ring: "217 92% 76%",
    }
  }
]
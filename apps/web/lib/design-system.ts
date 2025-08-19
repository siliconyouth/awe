// Vercel-inspired Design System for AWE
// Clean, modern, minimalist design with subtle gradients and animations

export const designSystem = {
  // Typography scale based on Vercel's design
  typography: {
    // Display - for hero sections
    display: {
      1: 'text-6xl font-bold tracking-tight lg:text-7xl',
      2: 'text-5xl font-bold tracking-tight lg:text-6xl',
      3: 'text-4xl font-bold tracking-tight lg:text-5xl',
    },
    // Headings
    heading: {
      1: 'text-3xl font-semibold tracking-tight lg:text-4xl',
      2: 'text-2xl font-semibold tracking-tight lg:text-3xl',
      3: 'text-xl font-semibold tracking-tight lg:text-2xl',
      4: 'text-lg font-semibold tracking-tight',
    },
    // Body text
    body: {
      large: 'text-base leading-relaxed',
      default: 'text-sm leading-relaxed',
      small: 'text-xs leading-relaxed',
    },
    // Subtle text
    muted: 'text-muted-foreground',
    // Code
    code: 'font-mono text-sm',
  },

  // Spacing system
  spacing: {
    page: 'px-4 sm:px-6 lg:px-8',
    section: 'py-16 sm:py-24 lg:py-32',
    container: 'mx-auto max-w-7xl',
    card: 'p-6 sm:p-8',
  },

  // Border radius
  radius: {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  },

  // Shadows (subtle like Vercel)
  shadows: {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
    border: 'shadow-[0_0_0_1px_rgba(0,0,0,0.08)]',
    glow: 'shadow-[0_0_40px_rgba(0,0,0,0.08)]',
  },

  // Animations
  animations: {
    // Fade animations
    fadeIn: 'animate-in fade-in duration-500',
    fadeOut: 'animate-out fade-out duration-300',
    
    // Slide animations
    slideUp: 'animate-in slide-in-from-bottom-4 duration-500',
    slideDown: 'animate-in slide-in-from-top-4 duration-500',
    slideLeft: 'animate-in slide-in-from-right-4 duration-500',
    slideRight: 'animate-in slide-in-from-left-4 duration-500',
    
    // Scale animations
    scaleIn: 'animate-in zoom-in-95 duration-300',
    scaleOut: 'animate-out zoom-out-95 duration-300',
    
    // Hover effects
    hover: {
      lift: 'transition-all hover:-translate-y-0.5 hover:shadow-lg',
      scale: 'transition-transform hover:scale-105',
      glow: 'transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.1)]',
      border: 'transition-colors hover:border-foreground/20',
    },
  },

  // Gradients (subtle, Vercel-style)
  gradients: {
    // Text gradients
    text: {
      primary: 'bg-gradient-to-r from-black to-black/70 dark:from-white dark:to-white/70 bg-clip-text text-transparent',
      accent: 'bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent',
      brand: 'bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent',
    },
    // Background gradients
    background: {
      subtle: 'bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-black',
      radial: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white dark:from-neutral-900 dark:via-black dark:to-black',
      mesh: 'bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-neutral-100 via-neutral-50 to-white dark:from-neutral-900 dark:via-neutral-950 dark:to-black',
    },
    // Border gradients
    border: {
      subtle: 'bg-gradient-to-r from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900',
      accent: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    },
  },

  // Grid patterns (like Vercel's dot pattern)
  patterns: {
    dots: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px]',
    grid: 'bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] [background-size:24px_24px]',
  },

  // Component styles
  components: {
    // Cards
    card: {
      default: 'rounded-xl border bg-card shadow-sm',
      hover: 'rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5',
      gradient: 'rounded-xl border bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900',
    },
    // Buttons
    button: {
      primary: 'bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90',
      secondary: 'bg-white text-black border border-neutral-200 hover:bg-neutral-50 dark:bg-black dark:text-white dark:border-neutral-800 dark:hover:bg-neutral-900',
      ghost: 'hover:bg-neutral-100 dark:hover:bg-neutral-900',
    },
    // Badges
    badge: {
      default: 'rounded-full px-2 py-0.5 text-xs font-medium',
      outline: 'rounded-full px-2 py-0.5 text-xs font-medium border',
    },
    // Navigation
    nav: {
      header: 'sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60',
      sidebar: 'w-64 border-r bg-background/50',
      item: 'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
      activeItem: 'bg-accent text-accent-foreground',
    },
  },

  // Utility classes
  utils: {
    // Glass morphism
    glass: 'bg-white/50 dark:bg-black/50 backdrop-blur-xl',
    glassSubtle: 'bg-white/30 dark:bg-black/30 backdrop-blur-md',
    
    // Borders
    borderSubtle: 'border-neutral-200 dark:border-neutral-800',
    borderDefault: 'border-neutral-300 dark:border-neutral-700',
    
    // Focus states
    focusRing: 'focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100',
    focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100',
  },
} as const

// Helper function to combine classes
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
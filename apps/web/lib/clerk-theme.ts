import { dark } from '@clerk/themes'
import type { Appearance } from '@clerk/types'

export const clerkAppearance: Appearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: '#fc476c', // AWE primary color
    colorBackground: 'hsl(var(--background))',
    colorInputBackground: 'hsl(var(--input))',
    colorInputText: 'hsl(var(--foreground))',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-geist-sans)',
  },
  elements: {
    card: {
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      border: '1px solid hsl(var(--border))',
    },
    headerTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
    },
    headerSubtitle: {
      color: 'hsl(var(--muted-foreground))',
    },
    socialButtonsBlockButton: {
      border: '1px solid hsl(var(--border))',
      backgroundColor: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      '&:hover': {
        backgroundColor: 'hsl(var(--accent))',
      },
    },
    formButtonPrimary: {
      backgroundColor: '#fc476c',
      color: 'white',
      '&:hover': {
        backgroundColor: '#fb2856',
      },
    },
    footerActionLink: {
      color: '#fc476c',
      '&:hover': {
        color: '#fb2856',
      },
    },
  },
}

export const getClerkAppearance = (theme: string | undefined): Appearance => ({
  ...clerkAppearance,
  baseTheme: theme === 'dark' ? dark : undefined,
})
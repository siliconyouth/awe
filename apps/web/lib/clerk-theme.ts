import { dark } from '@clerk/themes'
import type { Appearance } from '@clerk/types'

export const clerkAppearance: Appearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: 'hsl(var(--color-primary))',
    colorDanger: 'hsl(var(--color-destructive))',
    colorSuccess: 'hsl(142 76% 36%)',
    colorWarning: 'hsl(38 92% 50%)',
    colorNeutral: 'hsl(var(--color-muted-foreground))',
    colorBackground: 'hsl(var(--color-background))',
    colorInputBackground: 'hsl(var(--color-background))',
    colorInputText: 'hsl(var(--color-foreground))',
    colorText: 'hsl(var(--color-foreground))',
    colorTextSecondary: 'hsl(var(--color-muted-foreground))',
    borderRadius: '0.5rem',
    fontFamily: 'inherit',
  },
  elements: {
    // Cards and containers
    card: {
      backgroundColor: 'hsl(var(--color-background))',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      border: '1px solid hsl(var(--color-border))',
    },
    // UserButton specific styling
    userButtonPopoverCard: {
      backgroundColor: 'hsl(var(--color-background) / 0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid hsl(var(--color-border))',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    },
    userButtonPopoverActionButton: {
      color: 'hsl(var(--color-foreground))',
      '&:hover': {
        backgroundColor: 'hsl(var(--color-accent))',
      },
    },
    userButtonPopoverActionButtonText: {
      color: 'hsl(var(--color-foreground))',
    },
    userButtonPopoverFooter: {
      borderTop: '1px solid hsl(var(--color-border))',
    },
    // User profile (manage account) styling
    userProfileCard: {
      backgroundColor: 'hsl(var(--color-background))',
      border: '1px solid hsl(var(--color-border))',
    },
    userProfileSection: {
      borderBottom: '1px solid hsl(var(--color-border))',
    },
    userProfileSectionHeader: {
      color: 'hsl(var(--color-foreground))',
    },
    userProfileSectionContent: {
      color: 'hsl(var(--color-muted-foreground))',
    },
    // Headers
    headerTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: 'hsl(var(--color-foreground))',
    },
    headerSubtitle: {
      color: 'hsl(var(--color-muted-foreground))',
    },
    // Form elements
    formFieldLabel: {
      color: 'hsl(var(--color-foreground))',
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    formFieldInput: {
      backgroundColor: 'hsl(var(--color-background))',
      border: '1px solid hsl(var(--color-border))',
      color: 'hsl(var(--color-foreground))',
      '&:focus': {
        borderColor: 'hsl(var(--color-ring))',
        boxShadow: '0 0 0 3px hsl(var(--color-ring) / 0.1)',
      },
    },
    // Buttons
    formButtonPrimary: {
      backgroundColor: 'hsl(var(--color-primary))',
      color: 'hsl(var(--color-primary-foreground))',
      '&:hover': {
        backgroundColor: 'hsl(var(--color-primary) / 0.9)',
      },
    },
    socialButtonsBlockButton: {
      border: '1px solid hsl(var(--color-border))',
      backgroundColor: 'hsl(var(--color-background))',
      color: 'hsl(var(--color-foreground))',
      '&:hover': {
        backgroundColor: 'hsl(var(--color-accent))',
      },
    },
    // Links
    footerActionLink: {
      color: 'hsl(var(--color-primary))',
      '&:hover': {
        color: 'hsl(var(--color-primary) / 0.8)',
      },
    },
    // Alerts and messages
    alert: {
      backgroundColor: 'hsl(var(--color-muted))',
      border: '1px solid hsl(var(--color-border))',
      color: 'hsl(var(--color-foreground))',
    },
    alertText: {
      color: 'hsl(var(--color-foreground))',
    },
  },
}

export const getClerkAppearance = (theme: string | undefined): Appearance => ({
  ...clerkAppearance,
  baseTheme: theme === 'dark' ? dark : undefined,
})
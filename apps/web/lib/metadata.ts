import { Metadata } from 'next'

const siteConfig = {
  name: 'AWE - Awesome Workspace Engineering',
  shortName: 'AWE',
  description: 'AI-powered workspace engineering platform for modern development teams',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://awe.dev',
  ogImage: '/og-image.png',
  creator: '@awe_dev',
}

interface GenerateMetadataProps {
  title: string
  description?: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
}

export function generatePageMetadata({
  title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
  keywords = [],
}: GenerateMetadataProps): Metadata {
  const fullTitle = `${title} | ${siteConfig.shortName}`
  
  return {
    title: fullTitle,
    description,
    keywords: [
      'workspace engineering',
      'AI development',
      'code analysis',
      'project optimization',
      'Claude AI',
      'development tools',
      ...keywords,
    ],
    authors: [{ name: siteConfig.shortName }],
    creator: siteConfig.creator,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteConfig.url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: siteConfig.creator,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
  }
}

// Page-specific metadata generators
export const pageMetadata = {
  dashboard: () => generatePageMetadata({
    title: 'Dashboard',
    description: 'Monitor your projects, view analytics, and manage your AI-powered workspace',
    keywords: ['dashboard', 'analytics', 'monitoring'],
  }),
  
  projects: () => generatePageMetadata({
    title: 'Projects',
    description: 'Manage your development projects, track optimizations, and organize your work',
    keywords: ['projects', 'management', 'organization'],
  }),
  
  recommendations: () => generatePageMetadata({
    title: 'AI Recommendations',
    description: 'Get intelligent pattern recommendations based on your project context and code analysis',
    keywords: ['AI recommendations', 'patterns', 'code suggestions'],
  }),
  
  analytics: () => generatePageMetadata({
    title: 'Analytics',
    description: 'Comprehensive analytics and insights for your development workflow',
    keywords: ['analytics', 'metrics', 'insights', 'performance'],
  }),
  
  adminUsers: () => generatePageMetadata({
    title: 'User Management',
    description: 'Manage users, roles, and permissions for your organization',
    keywords: ['user management', 'permissions', 'roles', 'admin'],
  }),
  
  adminKnowledge: () => generatePageMetadata({
    title: 'Knowledge Management',
    description: 'Monitor web sources, track changes, and extract intelligent patterns',
    keywords: ['knowledge base', 'web scraping', 'pattern extraction'],
  }),
  
  adminPatterns: () => generatePageMetadata({
    title: 'Pattern Management',
    description: 'Review and manage extracted patterns from your knowledge sources',
    keywords: ['patterns', 'extraction', 'management'],
  }),
  
  adminConfig: () => generatePageMetadata({
    title: 'Configuration',
    description: 'Configure system settings and environment variables',
    keywords: ['configuration', 'settings', 'environment'],
  }),
  
  organizations: () => generatePageMetadata({
    title: 'Organizations',
    description: 'Manage your organization settings and team collaboration',
    keywords: ['organizations', 'teams', 'collaboration'],
  }),
  
  apiTest: () => generatePageMetadata({
    title: 'API Testing',
    description: 'Test and explore AWE API endpoints',
    keywords: ['API', 'testing', 'endpoints', 'development'],
  }),
}

// Dynamic metadata for specific entities
export function generateProjectMetadata(projectName: string): Metadata {
  return generatePageMetadata({
    title: `${projectName} - Project`,
    description: `View and manage ${projectName} project details, optimizations, and recommendations`,
    keywords: ['project', projectName.toLowerCase()],
  })
}

export function generateUserMetadata(userName: string): Metadata {
  return generatePageMetadata({
    title: `${userName} - User Profile`,
    description: `User profile and activity for ${userName}`,
    keywords: ['user', 'profile'],
    noIndex: true, // Don't index user profiles
  })
}
/**
 * Privacy Policy Page
 * 
 * Displays the current active Privacy Policy
 * Content is managed through the admin backend
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { CalendarDays, FileText, Shield, Lock, Eye } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | AWE',
  description: 'Privacy Policy for AWE - How we collect, use, and protect your personal data',
}

// Default Privacy Policy content for AWE
const DEFAULT_POLICY = {
  version: '1.0.0',
  effectiveDate: '2025-08-19',
  lastUpdated: '2025-08-19',
  jurisdiction: 'GDPR and CCPA Compliant',
  content: `
# Privacy Policy

**Effective Date: August 19, 2025**  
**Version: 1.0.0**

## 1. Introduction

AWE ("Awesome Workspace Engineering," "we," "our," or "us") is committed to protecting your privacy and ensuring compliance with the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and other applicable data protection laws.

This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered web extraction and knowledge management platform.

## 2. Data Controller Information

**Data Controller**: AWE Technologies  
**Address**: [Your Address]  
**Email**: privacy@awe.dukelic.com  
**Data Protection Officer**: dpo@awe.dukelic.com

## 3. Information We Collect

### 3.1 Personal Information You Provide
- **Account Information**: Name, email address, username, password (hashed)
- **Profile Information**: Organization name, role, preferences
- **Payment Information**: Processed securely through Stripe (we don't store card details)
- **Communication Data**: Support tickets, feedback, correspondence

### 3.2 Information Automatically Collected
- **Usage Data**: Features used, API calls, scraping activities
- **Device Information**: IP address, browser type, operating system
- **Cookies and Tracking**: Session cookies, authentication tokens
- **Log Data**: Access times, pages viewed, errors encountered

### 3.3 Information from Web Scraping
- **Public Web Data**: Content from publicly accessible websites
- **Metadata**: URLs, timestamps, content structure
- **Analysis Results**: AI-generated insights and patterns

**Important**: We do not intentionally scrape personal data. If personal data is inadvertently collected, we process it in compliance with GDPR.

## 4. Legal Basis for Processing (GDPR)

We process personal data based on:

### 4.1 Consent
- Marketing communications
- Optional features requiring additional data
- Cookies (where required)

### 4.2 Contract Performance
- Providing our services
- Account management
- Customer support

### 4.3 Legitimate Interests
- Service improvement and development
- Security and fraud prevention
- Analytics and performance monitoring

### 4.4 Legal Obligations
- Compliance with laws and regulations
- Response to legal requests
- Tax and accounting requirements

## 5. How We Use Your Information

### 5.1 Service Provision
- Create and manage your account
- Provide web scraping and AI analysis services
- Process transactions
- Send service-related communications

### 5.2 Service Improvement
- Analyze usage patterns
- Develop new features
- Optimize performance
- Conduct research (anonymized data)

### 5.3 Communication
- Respond to inquiries
- Provide customer support
- Send updates (with consent)
- Security alerts

### 5.4 Legal and Security
- Comply with legal obligations
- Protect against fraud and abuse
- Enforce our Terms of Service
- Resolve disputes

## 6. Data Sharing and Disclosure

### 6.1 We DO NOT Sell Your Personal Data

### 6.2 Service Providers
We share data with trusted third parties who assist us:
- **Clerk**: Authentication and user management
- **Stripe**: Payment processing
- **Vercel**: Hosting and infrastructure
- **Supabase**: Database services
- **Anthropic**: AI processing (anonymized)

All service providers are bound by data protection agreements.

### 6.3 Legal Requirements
We may disclose information when required by:
- Court orders or subpoenas
- Government authorities
- Legal proceedings
- Protection of rights and safety

### 6.4 Business Transfers
In case of merger, acquisition, or sale, user information may be transferred with appropriate safeguards.

## 7. International Data Transfers

### 7.1 Transfer Mechanisms
For transfers outside the EEA, we use:
- Standard Contractual Clauses (SCCs)
- Adequacy decisions
- Your explicit consent

### 7.2 Data Localization
- EU user data primarily stored in EU data centers
- US user data primarily stored in US data centers

## 8. Data Retention

### 8.1 Retention Periods
- **Account Data**: Duration of account + 30 days
- **Transaction Data**: 7 years (legal requirement)
- **Usage Data**: 2 years
- **Scraped Content**: Based on user settings (default 90 days)
- **Cookies**: Session or up to 1 year

### 8.2 Deletion
Upon account deletion, we remove personal data within 30 days, except where retention is legally required.

## 9. Your Rights (GDPR & CCPA)

### 9.1 GDPR Rights (EU Users)
- **Access**: Request a copy of your personal data
- **Rectification**: Correct inaccurate data
- **Erasure**: Request deletion ("right to be forgotten")
- **Portability**: Receive data in machine-readable format
- **Restriction**: Limit processing of your data
- **Objection**: Object to certain processing
- **Automated Decision-Making**: Right not to be subject to automated decisions

### 9.2 CCPA Rights (California Users)
- **Know**: What personal information is collected, used, shared, or sold
- **Delete**: Request deletion of personal information
- **Opt-Out**: Opt-out of sale (we don't sell data)
- **Non-Discrimination**: Equal service regardless of privacy choices

### 9.3 Exercising Your Rights
Contact us at privacy@awe.dukelic.com or use the in-app privacy center.

## 10. Data Security

### 10.1 Technical Measures
- **Encryption**: TLS 1.3 for data in transit, AES-256 for data at rest
- **Access Controls**: Role-based access, multi-factor authentication
- **Infrastructure**: Secure cloud providers, regular security updates
- **Monitoring**: 24/7 security monitoring, intrusion detection

### 10.2 Organizational Measures
- Employee training on data protection
- Data protection by design and default
- Regular security assessments
- Incident response procedures

### 10.3 Breach Notification
In case of a data breach, we will:
- Notify affected users within 72 hours (GDPR requirement)
- Inform relevant supervisory authorities
- Provide information about the breach and mitigation steps

## 11. AI and Automated Processing

### 11.1 AI Processing
- We use Claude and other AI models for content analysis
- AI processing is designed to be privacy-preserving
- Personal data is anonymized before AI processing where possible

### 11.2 Transparency
- You can request information about AI decision-making
- Human review is available for significant decisions
- AI limitations and capabilities are documented

### 11.3 AI Act Compliance
We comply with EU AI Act requirements:
- No prohibited AI practices
- Transparency about AI systems
- Human oversight mechanisms
- Data quality and bias mitigation

## 12. Cookies and Tracking

### 12.1 Types of Cookies
- **Essential**: Required for service functionality
- **Analytics**: Help us understand usage (with consent)
- **Preferences**: Remember your settings

### 12.2 Cookie Management
You can control cookies through:
- Browser settings
- Our cookie preference center
- Do Not Track signals (we honor them)

### 12.3 Third-Party Analytics
We use privacy-focused analytics that don't track individuals.

## 13. Children's Privacy

AWE is not intended for users under 16. We do not knowingly collect data from children. If we discover such data, we delete it immediately.

## 14. Privacy Settings and Controls

### 14.1 Account Settings
You can control:
- Profile information
- Communication preferences
- Data sharing settings
- API access permissions

### 14.2 Data Export
Export your data anytime through:
- Account settings
- API endpoints
- Support request

### 14.3 Account Deletion
Delete your account and data through account settings or by contacting support.

## 15. Third-Party Websites

Our service may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies.

## 16. Changes to This Policy

### 16.1 Notification
We will notify you of material changes via:
- Email notification
- In-app notification
- Website banner

### 16.2 Review
We review this policy annually and update as needed for legal compliance.

## 17. Contact Information

### 17.1 General Inquiries
Email: privacy@awe.dukelic.com  
Website: https://awe.dukelic.com/privacy

### 17.2 Data Protection Officer
Email: dpo@awe.dukelic.com

### 17.3 Supervisory Authority (EU)
You have the right to lodge a complaint with your local data protection authority.

## 18. California Privacy Rights

### 18.1 Shine the Light
California residents can request information about personal information shared with third parties for marketing (we don't do this).

### 18.2 Do Not Track
We honor Do Not Track signals.

### 18.3 CCPA Metrics (Annual)
- Requests received: [To be updated]
- Requests complied with: [To be updated]
- Average response time: [To be updated]

## 19. Specific Provisions for Web Scraping

### 19.1 Data Minimization
- We only scrape data necessary for your specified purpose
- Personal data in scraped content is your responsibility
- We provide tools to filter and anonymize data

### 19.2 Lawful Scraping
- We respect robots.txt and terms of service
- Rate limiting to prevent server overload
- Compliance with legal requirements

### 19.3 Your Responsibilities
When using our scraping services, you must:
- Ensure you have legal basis for data collection
- Comply with third-party terms of service
- Handle personal data appropriately
- Obtain necessary consents

## 20. Cookie Policy Details

### 20.1 Strictly Necessary Cookies
- **auth_token**: Authentication (Session)
- **csrf_token**: Security (Session)
- **user_preferences**: Settings (1 year)

### 20.2 Analytics Cookies (With Consent)
- **_ga**: Google Analytics (2 years)
- **_analytics**: Internal analytics (1 year)

### 20.3 Opting Out
- Use our cookie preference center
- Browser settings
- Browser extensions for cookie blocking

---

**By using AWE, you acknowledge that you have read and understood this Privacy Policy.**

**Last Updated**: August 19, 2025  
**Effective Date**: August 19, 2025
  `.trim()
}

async function getActivePolicy() {
  try {
    // In production, this would fetch from database
    // const policy = await fetch('/api/legal/documents/privacy')
    // return policy.json()
    
    // For now, return default policy
    return DEFAULT_POLICY
  } catch (error) {
    console.error('Failed to fetch privacy policy:', error)
    return DEFAULT_POLICY
  }
}

export default async function PrivacyPolicyPage() {
  const policy = await getActivePolicy()
  
  if (!policy) {
    notFound()
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8" />
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
          </div>
          <CardDescription className="text-lg">
            How we collect, use, and protect your personal information
          </CardDescription>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <Badge variant="secondary" className="text-sm">
              <FileText className="h-3 w-3 mr-1" />
              Version {policy.version}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <CalendarDays className="h-3 w-3 mr-1" />
              Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Lock className="h-3 w-3 mr-1" />
              {policy.jurisdiction}
            </Badge>
          </div>
          
          <div className="flex items-center justify-center gap-8 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span>CCPA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-600" />
              <span>AI Act Compliant</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="prose prose-slate dark:prose-invert max-w-none p-8">
          <div 
            className="legal-content"
            dangerouslySetInnerHTML={{ 
              __html: policy.content.replace(/\n/g, '<br />').replace(/#{1,6}\s(.+)/g, '<h3>$1</h3>') 
            }}
          />
        </CardContent>
        
        <div className="border-t p-6 text-center text-sm text-muted-foreground">
          <p>Last updated: {new Date(policy.lastUpdated).toLocaleDateString()}</p>
          <p className="mt-2">
            Questions about privacy? Contact our Data Protection Officer at{' '}
            <a href="mailto:dpo@awe.dukelic.com" className="text-primary hover:underline">
              dpo@awe.dukelic.com
            </a>
          </p>
          <p className="mt-2">
            General privacy inquiries:{' '}
            <a href="mailto:privacy@awe.dukelic.com" className="text-primary hover:underline">
              privacy@awe.dukelic.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
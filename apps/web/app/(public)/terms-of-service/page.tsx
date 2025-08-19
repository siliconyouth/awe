/**
 * Terms of Service Page
 * 
 * Displays the current active Terms of Service
 * Content is managed through the admin backend
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { CalendarDays, FileText, Globe, Scale } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | AWE',
  description: 'Terms of Service for AWE - AI-powered Web Extraction and Knowledge Management Platform',
}

// Default Terms of Service content for AWE
const DEFAULT_TERMS = {
  version: '1.0.0',
  effectiveDate: '2025-08-19',
  lastUpdated: '2025-08-19',
  jurisdiction: 'United States and European Union',
  content: `
# Terms of Service

**Effective Date: August 19, 2025**  
**Version: 1.0.0**

## 1. Agreement to Terms

By accessing or using AWE ("Awesome Workspace Engineering"), including our web scraping, AI-powered analysis, and knowledge management services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the Service.

## 2. Description of Service

AWE provides:
- **Intelligent Web Scraping**: Automated data extraction from publicly available websites
- **AI-Powered Analysis**: Using Claude and other AI models for content processing
- **Knowledge Management**: Organization and versioning of extracted information
- **API Access**: Programmatic access to our services
- **Configuration Management**: Centralized settings for all services

## 3. Acceptable Use

### 3.1 Compliance with Laws
You agree to use AWE in compliance with all applicable laws, including but not limited to:
- General Data Protection Regulation (GDPR)
- EU AI Act (effective 2025)
- Copyright and intellectual property laws
- Computer Fraud and Abuse Act (CFAA)
- Local data protection regulations

### 3.2 Web Scraping Guidelines
When using our scraping services, you MUST:
- Respect robots.txt files and website terms of service
- Not scrape personal data without proper legal basis
- Implement reasonable rate limiting
- Not use scraped data for prohibited AI practices under EU AI Act
- Not scrape facial images or biometric data
- Obtain consent when required by GDPR

### 3.3 Prohibited Uses
You may NOT use AWE to:
- Violate any laws or regulations
- Infringe on intellectual property rights
- Scrape or process special categories of personal data (health, political views, religious beliefs) without explicit consent
- Create AI systems that manipulate decisions or exploit vulnerabilities
- Conduct social scoring or classification based on personal traits
- Harvest email addresses for spam
- Perform any malicious or harmful activities
- Circumvent security measures or access controls

## 4. AI and Data Processing

### 4.1 AI Act Compliance
AWE complies with the EU AI Act requirements:
- We implement appropriate data governance measures
- We conduct bias mitigation and quality assessments
- We maintain transparency about AI processing
- We do not engage in prohibited AI practices

### 4.2 Data Processing
- We process data according to GDPR principles
- We respect purpose limitation and data minimization
- We provide mechanisms for data subject rights
- We conduct Data Protection Impact Assessments (DPIA) when required

## 5. User Accounts and Roles

### 5.1 Account Responsibility
You are responsible for:
- Maintaining the confidentiality of your account
- All activities that occur under your account
- Notifying us of any unauthorized use

### 5.2 Role-Based Access
AWE implements role-based access control:
- **Super Admin**: Full system access
- **Admin**: Administrative functions
- **Moderator**: Content moderation
- **Developer**: API and advanced features
- **User**: Standard access
- **Guest**: Limited read-only access

## 6. Intellectual Property

### 6.1 Your Content
You retain all rights to content you upload or process through AWE. By using our Service, you grant us a license to process and analyze your content solely for providing the Service.

### 6.2 AWE Property
The Service, including its original content, features, and functionality, is owned by AWE and protected by international copyright, trademark, and other intellectual property laws.

### 6.3 Scraped Content
You acknowledge that content obtained through web scraping may be subject to third-party intellectual property rights. You are responsible for ensuring your use of such content is lawful.

## 7. API Usage and Limits

### 7.1 Rate Limits
- Free tier: 1,000 API calls/month, 100 scrape requests/month
- Pro tier: 10,000 API calls/month, 1,000 scrape requests/month
- Enterprise: Custom limits

### 7.2 Fair Use
We reserve the right to throttle or suspend access for excessive or abusive usage.

## 8. Privacy and Data Protection

### 8.1 Personal Data Processing
We process personal data in accordance with our Privacy Policy and applicable data protection laws, including GDPR.

### 8.2 Data Security
We implement appropriate technical and organizational measures to protect your data, including:
- Encryption in transit and at rest
- Access controls and authentication
- Regular security assessments
- Incident response procedures

### 8.3 Data Retention
We retain data only as long as necessary for the purposes outlined in our Privacy Policy.

## 9. Payment Terms (Pro/Enterprise Plans)

### 9.1 Billing
- Subscriptions are billed monthly or annually
- Payments are non-refundable except as required by law
- We use Stripe for payment processing

### 9.2 Changes to Pricing
We may modify pricing with 30 days notice for existing customers.

## 10. Disclaimers and Limitations of Liability

### 10.1 Service Availability
AWE is provided "as is" without warranties of any kind. We do not guarantee:
- Uninterrupted or error-free service
- Accuracy of scraped or analyzed content
- Fitness for a particular purpose

### 10.2 Limitation of Liability
To the maximum extent permitted by law, AWE shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.

### 10.3 Indemnification
You agree to indemnify and hold AWE harmless from any claims arising from:
- Your use of the Service
- Your violation of these Terms
- Your violation of any third-party rights

## 11. Termination

### 11.1 Termination by You
You may terminate your account at any time through the account settings or by contacting support.

### 11.2 Termination by AWE
We may terminate or suspend your account immediately, without prior notice, for:
- Breach of these Terms
- Illegal or harmful activities
- Non-payment (for paid plans)

### 11.3 Effect of Termination
Upon termination:
- Your access to the Service will cease
- We may delete your data after 30 days
- Provisions that should survive will remain in effect

## 12. Changes to Terms

We reserve the right to modify these Terms at any time. We will provide notice of material changes via:
- Email notification
- Prominent notice on our website
- In-app notification

Continued use after changes constitutes acceptance of the new Terms.

## 13. Governing Law and Jurisdiction

### 13.1 Applicable Law
These Terms are governed by the laws of:
- United States (for US users)
- European Union regulations (for EU users)
- Local jurisdiction (for other users)

### 13.2 Dispute Resolution
Any disputes shall be resolved through:
1. Good faith negotiation
2. Mediation (if negotiation fails)
3. Binding arbitration or court proceedings

## 14. GDPR Specific Provisions (EU Users)

### 14.1 Legal Basis
We process personal data based on:
- Consent (where applicable)
- Legitimate interests
- Contract performance
- Legal obligations

### 14.2 Your Rights
EU users have the right to:
- Access personal data
- Rectification and erasure
- Data portability
- Object to processing
- Lodge complaints with supervisory authorities

### 14.3 Data Protection Officer
Contact our DPO at: dpo@awe.dukelic.com

## 15. AI Act Compliance (EU Users)

### 15.1 Transparency
We provide clear information about:
- AI system capabilities and limitations
- Human oversight measures
- Data quality and bias mitigation

### 15.2 Prohibited Practices
We do not engage in:
- Subliminal manipulation
- Exploitation of vulnerabilities
- Social scoring
- Biometric categorization

## 16. Contact Information

For questions about these Terms, contact us at:

**AWE Support**  
Email: legal@awe.dukelic.com  
Address: [Your Address]  
Website: https://awe.dukelic.com

## 17. Severability

If any provision of these Terms is found unenforceable, the remaining provisions will continue in full force and effect.

## 18. Entire Agreement

These Terms constitute the entire agreement between you and AWE regarding the use of the Service, superseding any prior agreements.

---

**By using AWE, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.**
  `.trim()
}

async function getActiveTerms() {
  try {
    // In production, this would fetch from database
    // const terms = await fetch('/api/legal/documents/terms')
    // return terms.json()
    
    // For now, return default terms
    return DEFAULT_TERMS
  } catch (error) {
    console.error('Failed to fetch terms:', error)
    return DEFAULT_TERMS
  }
}

export default async function TermsOfServicePage() {
  const terms = await getActiveTerms()
  
  if (!terms) {
    notFound()
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="h-8 w-8" />
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Please read these terms carefully before using AWE
          </CardDescription>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <Badge variant="secondary" className="text-sm">
              <FileText className="h-3 w-3 mr-1" />
              Version {terms.version}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <CalendarDays className="h-3 w-3 mr-1" />
              Effective: {new Date(terms.effectiveDate).toLocaleDateString()}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Globe className="h-3 w-3 mr-1" />
              {terms.jurisdiction}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="prose prose-slate dark:prose-invert max-w-none p-8">
          <div 
            className="legal-content"
            dangerouslySetInnerHTML={{ 
              __html: terms.content.replace(/\n/g, '<br />').replace(/#{1,6}\s(.+)/g, '<h3>$1</h3>') 
            }}
          />
        </CardContent>
        
        <div className="border-t p-6 text-center text-sm text-muted-foreground">
          <p>Last updated: {new Date(terms.lastUpdated).toLocaleDateString()}</p>
          <p className="mt-2">
            Questions? Contact us at{' '}
            <a href="mailto:legal@awe.dukelic.com" className="text-primary hover:underline">
              legal@awe.dukelic.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
import { OrganizationList, CreateOrganization } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { PageContainer } from '../../../components/layout/page-container'
import { PageHeader } from '../../../components/layout/page-header'
import { designSystem, cn } from '../../../lib/design-system'
import { Building2, Plus, Users, Settings, Sparkles } from "lucide-react"

export default function OrganizationsPage() {
  return (
    <PageContainer className={cn(designSystem.animations.fadeIn)}>
      <PageHeader
        title="Organizations"
        description="Manage your organizations and team collaborations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Organizations' }
        ]}
      />

      <div className={cn(
        'grid gap-8 md:grid-cols-2',
        designSystem.animations.slideUp
      )}>
        <Card className={cn(
          designSystem.components.card.hover,
          'group relative overflow-hidden'
        )}>
          <div className={cn(
            'absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-xl',
            'bg-gradient-to-br from-emerald-400 to-emerald-600'
          )} />
          <CardHeader className="relative">
            <CardTitle className={cn(
              designSystem.typography.heading[4],
              'flex items-center gap-2'
            )}>
              <div className={cn(
                'p-2 rounded-lg',
                'bg-emerald-50 dark:bg-emerald-950/30',
                designSystem.animations.hover.scale
              )}>
                <Plus className="h-5 w-5 text-emerald-600" />
              </div>
              Create New Organization
            </CardTitle>
            <CardDescription>
              Start a new organization to collaborate with your team
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <CreateOrganization 
              afterCreateOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  formButtonPrimary: "bg-primary hover:bg-primary/90 transition-all",
                  card: "shadow-none border-0 bg-transparent",
                  formFieldInput: "rounded-lg border-input",
                  formFieldLabel: "text-sm font-medium"
                }
              }}
            />
          </CardContent>
        </Card>

        <Card className={cn(
          designSystem.components.card.hover,
          'group relative overflow-hidden'
        )}>
          <div className={cn(
            'absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-xl',
            'bg-gradient-to-br from-blue-400 to-blue-600'
          )} />
          <CardHeader className="relative">
            <CardTitle className={cn(
              designSystem.typography.heading[4],
              'flex items-center gap-2'
            )}>
              <div className={cn(
                'p-2 rounded-lg',
                'bg-blue-50 dark:bg-blue-950/30',
                designSystem.animations.hover.scale
              )}>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              Your Organizations
            </CardTitle>
            <CardDescription>
              Switch between your organizations or manage their settings
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <OrganizationList 
              afterSelectOrganizationUrl="/dashboard"
              afterCreateOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationPreview: cn(
                    'border rounded-lg p-4 transition-all',
                    designSystem.animations.hover.lift,
                    'hover:bg-muted/50 hover:border-border'
                  ),
                  organizationPreviewAvatarBox: "size-10",
                  organizationPreviewMainIdentifier: "font-semibold",
                  organizationPreviewSecondaryIdentifier: "text-sm text-muted-foreground"
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className={cn(
        designSystem.animations.slideUp,
        'delay-200'
      )}>
        <Card className={cn(
          designSystem.components.card.hover,
          'group relative overflow-hidden'
        )}>
          <div className={cn(
            'absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 blur-2xl',
            'bg-gradient-to-br from-purple-400 via-pink-400 to-red-400'
          )} />
          <CardHeader className="relative">
            <CardTitle className={cn(
              designSystem.typography.heading[3],
              'flex items-center gap-3'
            )}>
              <div className={cn(
                'p-3 rounded-xl',
                'bg-gradient-to-br from-purple-50 to-pink-50',
                'dark:from-purple-950/30 dark:to-pink-950/30',
                designSystem.animations.hover.scale
              )}>
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              Organization Features
            </CardTitle>
            <CardDescription className="text-base">
              Benefits of using organizations in AWE
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            <div className="grid gap-6 md:grid-cols-3">
              <div className={cn(
                'space-y-3 p-4 rounded-xl',
                'bg-gradient-to-br from-blue-50/50 to-cyan-50/50',
                'dark:from-blue-950/20 dark:to-cyan-950/20',
                'border border-blue-100 dark:border-blue-900/30',
                designSystem.animations.hover.lift
              )}>
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  'bg-blue-100 dark:bg-blue-900/30'
                )}>
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className={cn(
                  'font-semibold',
                  designSystem.typography.heading[4]
                )}>Team Collaboration</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Share scraped data, patterns, and configurations with your team members
                </p>
              </div>
              
              <div className={cn(
                'space-y-3 p-4 rounded-xl',
                'bg-gradient-to-br from-emerald-50/50 to-teal-50/50',
                'dark:from-emerald-950/20 dark:to-teal-950/20',
                'border border-emerald-100 dark:border-emerald-900/30',
                designSystem.animations.hover.lift
              )}>
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  'bg-emerald-100 dark:bg-emerald-900/30'
                )}>
                  <Settings className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className={cn(
                  'font-semibold',
                  designSystem.typography.heading[4]
                )}>Role-Based Access</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Control who can access what with granular permission settings
                </p>
              </div>
              
              <div className={cn(
                'space-y-3 p-4 rounded-xl',
                'bg-gradient-to-br from-purple-50/50 to-pink-50/50',
                'dark:from-purple-950/20 dark:to-pink-950/20',
                'border border-purple-100 dark:border-purple-900/30',
                designSystem.animations.hover.lift
              )}>
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  'bg-purple-100 dark:bg-purple-900/30'
                )}>
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className={cn(
                  'font-semibold',
                  designSystem.typography.heading[4]
                )}>Shared Resources</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pool API limits and resources across your entire organization
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
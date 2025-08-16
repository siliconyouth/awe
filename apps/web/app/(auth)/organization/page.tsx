import { OrganizationProfile } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Settings, Users, Shield, Webhook } from "lucide-react"

export default function OrganizationProfilePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Organization Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization settings, members, and permissions
        </p>
      </div>

      <OrganizationProfile 
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-xl border-border",
            navbar: "bg-muted/50",
            pageScrollBox: "px-4",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            organizationSwitcherTrigger: "border hover:bg-muted",
            organizationSwitcherTriggerIcon: "text-muted-foreground",
            organizationPreview: "border rounded-lg",
            organizationPreviewAvatarBox: "size-8",
            organizationPreviewMainIdentifier: "font-semibold",
            organizationPreviewSecondaryIdentifier: "text-sm text-muted-foreground",
            membersPageInviteButton: "bg-primary hover:bg-primary/90",
            memberListItem: "border-b last:border-0 py-3",
            invitationListItem: "border-b last:border-0 py-3"
          },
          variables: {
            borderRadius: "0.5rem"
          }
        }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Team Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Invite team members, manage roles, and control access to your organization's resources
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Configure security policies, enforce MFA, and manage API access for your organization
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Webhook className="h-5 w-5" />
              Webhooks & Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Set up webhooks and third-party integrations to automate your workflows
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
import { OrganizationList, CreateOrganization } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Building2, Plus, Users, Settings } from "lucide-react"

export default function OrganizationsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Organizations
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your organizations and team collaborations
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Organization
            </CardTitle>
            <CardDescription>
              Start a new organization to collaborate with your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateOrganization 
              afterCreateOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  formButtonPrimary: "bg-primary hover:bg-primary/90",
                  card: "shadow-none border-0"
                }
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Organizations
            </CardTitle>
            <CardDescription>
              Switch between your organizations or manage their settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationList 
              afterSelectOrganizationUrl="/dashboard"
              afterCreateOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationPreview: "border rounded-lg p-3 hover:bg-muted/50",
                  organizationPreviewAvatarBox: "size-10",
                  organizationPreviewMainIdentifier: "font-semibold",
                  organizationPreviewSecondaryIdentifier: "text-sm text-muted-foreground"
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Organization Features
          </CardTitle>
          <CardDescription>
            Benefits of using organizations in AWE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-semibold">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Share scraped data, patterns, and configurations with your team members
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Role-Based Access</h3>
              <p className="text-sm text-muted-foreground">
                Control who can access what with granular permission settings
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Shared Resources</h3>
              <p className="text-sm text-muted-foreground">
                Pool API limits and resources across your entire organization
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
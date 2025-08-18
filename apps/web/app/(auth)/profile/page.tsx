import { UserProfile } from "@clerk/nextjs"

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      
      <UserProfile 
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-xl border-border",
            navbar: "hidden", // Hide default nav, we'll use our own
            pageScrollBox: "px-4",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton: "bg-secondary hover:bg-secondary/80",
            formFieldInput: "bg-background border-input",
            footerActionLink: "text-primary hover:text-primary/90"
          },
          variables: {
            borderRadius: "0.5rem"
          }
        }}
      />
    </div>
  )
}
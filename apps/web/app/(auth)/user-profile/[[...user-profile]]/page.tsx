import { RedirectToUserProfile } from '@clerk/nextjs'

export default function UserProfilePage() {
  // This will automatically redirect to the Clerk Account Portal user profile page
  return <RedirectToUserProfile />
}
import { RedirectToSignIn } from '@clerk/nextjs'

export default function SignInPage() {
  // This will automatically redirect to the Clerk Account Portal sign-in page
  return <RedirectToSignIn />
}
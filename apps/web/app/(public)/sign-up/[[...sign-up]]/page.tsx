import { RedirectToSignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  // This will automatically redirect to the Clerk Account Portal sign-up page
  return <RedirectToSignUp />
}
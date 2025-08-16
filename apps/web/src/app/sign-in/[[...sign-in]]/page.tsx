import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-background/95 backdrop-blur shadow-2xl",
          }
        }}
      />
    </div>
  );
}
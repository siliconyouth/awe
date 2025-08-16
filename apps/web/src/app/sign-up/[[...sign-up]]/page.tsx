import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <SignUp 
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
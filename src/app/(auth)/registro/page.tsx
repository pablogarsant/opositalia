import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RegistroPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return <SignUp routing="hash" signInUrl="/login" />;
}

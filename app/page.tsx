import { AuthButton } from "@/components/auth-button";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { RotatingText } from "@/components/rotating-text";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // If user is logged in, redirect to home
  if (data.user != null) {
    redirect("/home");
  }

  return (
    <>
      <div className="   flex min-h-screen max-w-10xl items-center justify-start gap-100   px-6">
        <div className="flex flex-col  text-left font-bold ml-50   ">
          <h1 className="font-bold text-7xl text-glow-accent text-accent">
            RoboForge
          </h1>
          <h2 className="text-3xl mt-4">
            platform to help you
            <RotatingText
              words={["create", "build", "share"]}
              className="mx-1 text-3xl text-secondary font-extrabold text-glow-primary"
            ></RotatingText>
            your robotics projects
          </h2>
        </div>
        <AuthButton />
      </div>
    </>
  );
}

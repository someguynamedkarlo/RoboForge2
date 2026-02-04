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
      <div className="flex min-h-screen flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-8 sm:gap-12 lg:gap-20 px-6 py-12">
        <div className="flex flex-col text-center md:text-left font-bold md:ml-6 lg:ml-16 xl:ml-24 max-w-3xl">
          <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-glow-accent text-accent">
            RoboForge
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl mt-4">
            platform to help you
            <RotatingText
              words={["create", "build", "share"]}
              className="mx-1 text-xl sm:text-2xl md:text-3xl text-secondary font-extrabold text-glow-primary"
            ></RotatingText>
            your robotics projects
          </h2>
        </div>
        <div className="w-full md:w-auto flex justify-center md:justify-start">
          <AuthButton />
        </div>
      </div>
    </>
  );
}

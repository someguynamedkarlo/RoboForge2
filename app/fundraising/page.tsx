import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default function FundraisingPage() {
  return (
    <>
      <Navbar />
    </>
  );
}

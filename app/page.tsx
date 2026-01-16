import { AuthButton } from "@/components/auth-button";

import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <AuthButton />
    </>
  );
}

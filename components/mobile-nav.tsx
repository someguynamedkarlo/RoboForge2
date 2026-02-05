"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "./logout-button";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative block md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 text-white"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[#0b0f14] border border-white/10 shadow-lg z-20">
          <ul className="flex flex-col divide-y divide-white/10">
            <li>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-white hover:text-accent"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/my-projects"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-white hover:text-accent"
              >
                My projects
              </Link>
            </li>
            <li>
              <Link
                href="/fundraising"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-white hover:text-accent"
              >
                Fundraising
              </Link>
            </li>
            <li className="px-4 py-3">
              <LogoutButton />
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { Profile } from "./profile";

export default function Navbar() {
  return (
    <nav className="fixed w-full z-20 top-0 start-0">
      <div className="w-full flex items-center justify-between px-4 py-4">
        <div className="w-50"></div>

        <div className="hidden md:flex items-center justify-center">
          <ul className="font-medium flex flex-row p-0    space-x-8 rtl:space-x-reverse bg-neutral-primary">
            <li>
              <Link
                href="/"
                className="block my-4 mx-25 text-white text-2xl text-glow-white hover:text-accent hover:text-glow-accent transition-all duration-300"
                aria-current="page"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/my-projects"
                className="block my-4 mx-25 text-white text-2xl text-glow-white hover:text-accent hover:text-glow-accent transition-all duration-300"
              >
                My projects
              </Link>
            </li>
            <li>
              <Link
                href="/fundraising"
                className="block my-4 mx-25 text-white text-2xl text-glow-white hover:text-accent hover:text-glow-accent transition-all duration-300"
              >
                Fundraising
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex items-center">
          <Profile />
        </div>
      </div>
    </nav>
  );
}

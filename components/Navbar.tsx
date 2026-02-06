import Link from "next/link";
import { Profile } from "./profile";
import { MobileNav } from "./mobile-nav";

export default function Navbar() {
  return (
    <nav className="fixed w-full z-20 top-0 start-0 bg-background/80 backdrop-blur-sm">
      <div className="w-full flex items-center justify-between px-4 py-4">
        <div className="w-12 md:w-50">
          <Link href="/" className="flex items-center md:justify-start">
            <img src="/favicon.ico" alt="" className="w-10" />
            <h1 className="hidden md:block text-glow-accent text-accent font-bold text-2xl ml-2">
              RoboForge
            </h1>
          </Link>
        </div>

        <div className="hidden md:flex items-center justify-center">
          <ul className="font-medium flex flex-row p-0 space-x-6 lg:space-x-10 rtl:space-x-reverse bg-neutral-primary">
            <li>
              <Link
                href="/"
                className="block my-4 mx-3 lg:mx-6 xl:mx-8 text-white text-lg lg:text-2xl text-glow-white hover:text-accent hover:text-glow-accent transition-all duration-300"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/my-projects"
                className="block my-4 mx-3 lg:mx-6 xl:mx-8 text-white text-lg lg:text-2xl text-glow-white hover:text-accent hover:text-glow-accent transition-all duration-300"
              >
                My projects
              </Link>
            </li>
            <li>
              <Link
                href="/fundraising"
                className="block my-4 mx-3 lg:mx-6 xl:mx-8 text-white text-lg lg:text-2xl text-glow-white hover:text-accent hover:text-glow-accent transition-all duration-300"
              >
                Fundraising
              </Link>
            </li>
          </ul>
        </div>

        <div className="hidden md:flex items-center">
          <Profile />
        </div>

        <MobileNav />
      </div>
    </nav>
  );
}

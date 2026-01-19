import Link from "next/link";
import { Profile } from "./profile";
export default function Navbar() {
  return (
    <nav className=" fixed w-full z-20 top-0 start-0 b">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-center mx-auto p-4">
        <div
          className="items-center justify-center hidden w-full md:flex md:w-auto md:order-1"
          id="navbar-cta"
        >
          <ul className="font-medium flex flex-col p-0 md:p-0 mt-4 border border-default rounded-base bg-neutral-secondary-soft md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-neutral-primary">
            <li>
              <Link
                href="/"
                className="block  my-4 mx-20 text-white text-2xl  text-glow-white  hover:text-accent hover:text-glow-accent
                
"
                aria-current="page"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/my-projects"
                className="block my-4 mx-20 text-white text-2xl text-glow-white hover:text-accent hover:text-glow-accent"
              >
                My projects
              </Link>
            </li>
            <li>
              <Link
                href="/fundraising"
                className="block my-4 mx-20 text-white  text-2xl   text-glow-white  hover:text-accent hover:text-glow-accent"
              >
                Fundraising
              </Link>
            </li>
            <li>
              <Profile />
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

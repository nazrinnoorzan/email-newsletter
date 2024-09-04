import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function NavBar() {
  const router = useRouter();

  const isActive = (href: string) => {
    return router.pathname === href;
  };

  return (
    <nav className="relative border-gray-200 bg-black">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
        <Link
          href="/compose"
          className="flex items-center space-x-3 rtl:space-x-reverse"
        >
          Home
        </Link>
        <div className="flex space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse">
          <button
            type="button"
            className="rounded-lg bg-orange-600 px-4 py-2 text-center text-sm font-medium text-white focus:outline-none"
            onClick={() => void signOut({ callbackUrl: "/compose/login" })}
          >
            Sign out
          </button>
          <button
            data-collapse-toggle="navbar-cta"
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 md:hidden"
            aria-controls="navbar-cta"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="h-5 w-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>
        <div
          className="hidden w-full items-center justify-between md:order-1 md:flex md:w-auto"
          id="navbar-cta"
        >
          <ul className="mt-4 flex flex-col p-4 font-medium text-white md:mt-0 md:flex-row md:space-x-8 md:border-0 md:p-0 rtl:space-x-reverse">
            <li>
              <Link
                href="/compose/subscribers"
                className={
                  isActive("/compose/subscribers") ? "text-orange-600" : ""
                }
              >
                Subscribers
              </Link>
            </li>
            <li>
              <Link
                href="/compose/add-subscribers"
                className={
                  isActive("/compose/add-subscribers") ? "text-orange-600" : ""
                }
              >
                Add Subscribers
              </Link>
            </li>
            <li>
              <Link
                href="/deactivate"
                className={isActive("/deactivate") ? "text-orange-600" : ""}
              >
                Deactivate List
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

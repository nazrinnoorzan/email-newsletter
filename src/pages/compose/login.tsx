import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import MobileView from "~/components/MobileView";

export default function Login() {
  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <main className="relative hidden min-h-screen flex-col items-center justify-center md:flex">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <div className="flex flex-col items-center gap-2">
            <AuthShowcase />
          </div>
        </div>
      </main>
      <MobileView />
    </>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="rounded-lg bg-orange-600 px-10 py-3 font-semibold text-white no-underline"
        onClick={
          sessionData
            ? () => void signOut()
            : () => void signIn("Credentials", { callbackUrl: "/compose" })
        }
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}

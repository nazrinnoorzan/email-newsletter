import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>Email Blasting</title>
        <meta name="description" content="Email Blasting System" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <ToastContainer />
      <main className={`font-sans ${inter.variable} relative bg-[#1E1E1E]`}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-full w-full mix-blend-multiply"
          style={{
            background:
              "linear-gradient(267deg, #131313 0%, rgba(30, 30, 30, 0.40) 100%)",
          }}
        ></div>
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);

import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";

import { api } from "~/utils/api";

export default function Unsubscribe() {
  const [unsubscribeText, setUnsubscribeText] = useState("");

  const router = useRouter();
  const unsubscribe = api.subscriber.deactivateSubscribers.useMutation({
    onSuccess(_data) {
      setUnsubscribeText(
        "You have successfully unsubscribe from our mailing list.",
      );
    },
    onError(_error) {
      setUnsubscribeText("Subscriber Id not found!");
    },
  });

  useEffect(() => {
    if (
      router.query.unsubscribeId &&
      !Array.isArray(router.query.unsubscribeId)
    ) {
      unsubscribe.mutate({ unsubscribeId: router.query.unsubscribeId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.unsubscribeId]);

  return (
    <>
      <Head>
        <title>Unsubscribe Email</title>
      </Head>
      <nav className="relative border-gray-200 bg-black">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
          <a
            href="https://diri.my/"
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <Image
              src="/navbar-diri-logo.svg"
              alt="DIRI Logo"
              className="h-8"
              width={103}
              height={32}
              priority
            />
          </a>
        </div>
      </nav>
      <main className=" relative flex min-h-screen flex-col items-center justify-center">
        <div className="container mb-8 flex flex-col justify-center px-4 lg:flex-row">
          <div className="flex h-full w-full flex-col items-center p-4">
            <div className="flex flex-col">
              {unsubscribeText ? <p>{unsubscribeText}</p> : <p>Loading...</p>}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

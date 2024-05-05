import { useState, useEffect } from "react";
import Head from "next/head";
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

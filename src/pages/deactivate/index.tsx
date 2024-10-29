import { useMemo } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import AccessDenied from "~/components/AccessDenied";
import Loading from "~/components/Loading";

import { api } from "~/utils/api";
import NavBar from "~/components/NavBar";
import SubscribersTable from "~/components/SubscribersTable";
import MobileView from "~/components/MobileView";

export default function Deactivate() {
  const { data: sessionData, status } = useSession();
  const { data: unsubscriberList, isLoading } =
    api.subscriber.getDeactive.useQuery();

  const unsubscribersData = useMemo(() => {
    return (
      unsubscriberList?.map((subscriber) => ({
        firstName: subscriber.firstName ?? "",
        lastName: subscriber.lastName ?? "",
        email: subscriber.email ?? "",
      })) ?? [
        {
          firstName: "",
          lastName: "",
          email: "",
        },
      ]
    );
  }, [unsubscriberList]);

  if (status === "loading" || isLoading) return <Loading />;
  if (!sessionData) return <AccessDenied />;

  return (
    <>
      <Head>
        <title>Deactive List</title>
      </Head>
      <NavBar />
      <main className="relative hidden min-h-screen flex-col items-center py-16 md:flex">
        <div className="container flex flex-col items-center justify-center px-4 py-16 ">
          <div className="flex flex-col items-center">
            <SubscribersTable data={unsubscribersData} />
          </div>
        </div>
      </main>
      <MobileView />
    </>
  );
}

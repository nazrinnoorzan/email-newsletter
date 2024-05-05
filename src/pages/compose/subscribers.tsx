import { type ChangeEvent, type FormEvent, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import AccessDenied from "~/components/AccessDenied";
import Loading from "~/components/Loading";

import { api } from "~/utils/api";
import NavBar from "~/components/NavBar";
import SubscribersTable from "~/components/SubscribersTable";
import MobileView from "~/components/MobileView";

export interface SelectedListSusbcribers {
  id: number;
  name: string;
  list: {
    subscriber: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
      isDeactive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  }[];
}

export default function Subscribers() {
  const [selectedList, setSelectedList] = useState("");
  const [selectedListSusbcribers, setSelectedListSusbcribers] =
    useState<SelectedListSusbcribers | null>(null);
  const [isShowNewListField, setIsShowNewListField] = useState(false);
  const [newList, setNewList] = useState("");

  const { data: sessionData, status } = useSession();
  const { data: subscriberList, isLoading } = api.subscriber.getAll.useQuery();
  const { data: segmentList, isLoading: isSegmentListLoading } =
    api.segment.getAll.useQuery();
  const filterByList = api.segment.getSubscribers.useMutation({
    onSuccess(data) {
      setSelectedListSusbcribers(data);
    },
    onError(error) {
      console.error("Filter subscribers by list failed!", error);
    },
  });
  const addSegment = api.segment.addSegment.useMutation({
    onSuccess(_data) {
      setNewList("");
      setIsShowNewListField(false);
    },
    onError(error) {
      console.error("Add New List Failed", error);
    },
  });

  const subscribersData = useMemo(() => {
    return (
      subscriberList?.map((subscriber) => ({
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
  }, [subscriberList]);

  const selectedListSusbcribersData = useMemo(() => {
    return (
      selectedListSusbcribers?.list
        ?.filter((subscriber) => subscriber.subscriber.isDeactive === false)
        .map((data) => ({
          firstName: data.subscriber.firstName ?? "",
          lastName: data.subscriber.lastName ?? "",
          email: data.subscriber.email ?? "",
        })) ?? [
        {
          firstName: "",
          lastName: "",
          email: "",
        },
      ]
    );
  }, [selectedListSusbcribers?.list]);

  const selectedListHandler = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedList(e.target.value);

    if (e.target.value) {
      filterByList.mutate({ id: Number(e.target.value) });
    } else {
      setSelectedListSusbcribers(null);
    }
  };

  const addListHandler = () => {
    setNewList("");
    setIsShowNewListField(!isShowNewListField);
  };

  const newListSubmitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newList) {
      addSegment.mutate({ name: newList });
    }
  };

  if (status === "loading" || isLoading || isSegmentListLoading)
    return <Loading />;
  if (!sessionData) return <AccessDenied />;

  return (
    <>
      <Head>
        <title>Susbcribers List</title>
      </Head>
      <NavBar />
      <main className="relative hidden min-h-screen flex-col items-center py-16 md:flex">
        <div className="flex items-center justify-center gap-8">
          <Link
            className="rounded-lg bg-orange-600 p-4 text-center text-sm font-medium text-white focus:outline-none"
            href="/compose/add-subscribers"
          >
            Bulk Add New Subscribers
          </Link>
          <button
            className="rounded-lg bg-orange-600 p-4 text-center text-sm font-medium text-white focus:outline-none"
            onClick={addListHandler}
          >
            Add New List
          </button>
          <div>
            <label>
              Filter by List:
              <select
                className="ml-2 rounded-lg bg-orange-600 p-4 text-center text-sm font-medium text-white focus:outline-none"
                value={selectedList}
                onChange={selectedListHandler}
              >
                <option value="">All subscribers</option>
                {segmentList?.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {isShowNewListField && (
          <div className="my-4">
            <form onSubmit={newListSubmitHandler}>
              <input
                onChange={(e) => setNewList(e.target.value)}
                value={newList}
                className="p-2 text-black focus:outline-none"
              ></input>
              <button
                className="ml-2 rounded-lg bg-orange-600 px-6 py-3 text-center text-sm font-medium text-white focus:outline-none"
                type="submit"
              >
                Submit
              </button>
            </form>
          </div>
        )}
        <div className="container flex flex-col items-center justify-center px-4 py-16 ">
          <div className="flex flex-col items-center">
            {!selectedList ? (
              <SubscribersTable data={subscribersData} />
            ) : (
              <SubscribersTable data={selectedListSusbcribersData} />
            )}
          </div>
        </div>
      </main>
      <MobileView />
    </>
  );
}

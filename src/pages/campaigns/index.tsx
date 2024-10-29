import { useMemo } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { toast } from "react-toastify";
import AccessDenied from "~/components/AccessDenied";
import Loading from "~/components/Loading";

import { api } from "~/utils/api";
import NavBar from "~/components/NavBar";
import CampaignTable from "~/components/CampaignTable";
import MobileView from "~/components/MobileView";

export default function Campaigns() {
  const { data: sessionData, status } = useSession();
  const {
    data: campaignList,
    isLoading,
    refetch,
  } = api.campaign.list.useQuery();

  const deleteCampaign = api.campaign.delete.useMutation({
    onError(error) {
      toast.error("Failed to delete campaign!", { theme: "colored" });
      console.error("Failed to delete campaign!", error);
    },
  });

  const handleDelete = async (
    id: string,
    s3Key: string,
    isScheduled: boolean,
  ) => {
    await deleteCampaign.mutateAsync({
      campaignId: id,
      s3Key,
      isScheduled,
    });

    toast.success("Campaign deleted!", { theme: "colored" });
    await refetch();
  };

  const campaignData = useMemo(() => {
    return (
      campaignList?.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        s3Key: campaign.s3Key,
        status: campaign.status,
        segmentList: campaign.segmentList,
        totalEmailSent: campaign.totalEmailSent,
        scheduleKey: campaign.scheduleKey,
        scheduleDate: campaign.scheduleDate,
      })) ?? [
        {
          id: "",
          title: "",
          s3Key: "",
          status: "",
          segmentList: [],
          totalEmailSent: 0,
          scheduleKey: "",
          scheduleDate: "",
        },
      ]
    );
  }, [campaignList]);

  if (status === "loading" || isLoading) return <Loading />;
  if (!sessionData) return <AccessDenied />;

  return (
    <>
      <Head>
        <title>Campaign List</title>
      </Head>
      <NavBar />
      <main className="relative hidden min-h-screen flex-col items-center py-16 md:flex">
        <div className="container flex flex-col items-center justify-center px-4 py-16 ">
          <div className="flex flex-col items-center">
            <CampaignTable data={campaignData} onDelete={handleDelete} />
          </div>
        </div>
      </main>
      <MobileView />
    </>
  );
}

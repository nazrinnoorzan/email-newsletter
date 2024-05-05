import { useState, useEffect, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { toast } from "react-toastify";

import NavBar from "~/components/NavBar";
import MobileView from "~/components/MobileView";
import LoadingSpinner from "~/components/LoadingSpinner";

import { api } from "~/utils/api";
import { replaceEmailHtmlSource, replacePlainTextSource } from "~/utils/utils";
import { type SelectedListSusbcribers } from "~/pages/compose/subscribers";

interface IEmailData {
  subject: string;
  bodyHtml: string;
  bodyPlainText: string;
  toAddress: string;
}

const defaultEmailData: IEmailData = {
  subject: "",
  bodyHtml: "",
  bodyPlainText: "",
  toAddress: "",
};

export default function Compose() {
  const [emailData, setEmailData] = useState<IEmailData>(defaultEmailData);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isShowWarning, setIsShowWarning] = useState(false);
  const [selectedList, setSelectedList] = useState("");
  const [selectedListSusbcribers, setSelectedListSusbcribers] =
    useState<SelectedListSusbcribers | null>(null);

  const { data: sessionData, status } = useSession();
  const { data: segmentList, isLoading: isSegmentListLoading } =
    api.segment.getAll.useQuery();

  const filterByList = api.segment.getSubscribers.useMutation({
    onSuccess(data) {
      setSelectedListSusbcribers(data);
      setSendingEmail(false);
    },
    onError(error) {
      displayErrorToast("Filter subscribers by list failed!");
      console.error("Filter subscribers by list failed!", error);
    },
  });

  const sendEmail = api.compose.sendEmail.useMutation({
    onSuccess(_data) {
      if (isSendingTestEmail) {
        displaySuccessToast("Sending test email success!");
        setEmailData({ ...emailData, toAddress: "" });
        setIsSendingTestEmail(false);
        setSendingEmail(false);
      } else {
        displaySuccessToast("Sending all emails success!");
        setSelectedList("");
        setSelectedListSusbcribers(null);
        setEmailData(defaultEmailData);
        setSendingEmail(false);
      }
    },
    onError(error) {
      displayErrorToast("Sending email failed!");
      console.error("Sending email failed!", error);
    },
  });

  useEffect(() => {
    if (!selectedListSusbcribers) return;

    if (selectedListSusbcribers.list.length > 348) {
      displayErrorToast("Email list exceed 348 emails!");
      setIsShowWarning(true);
    } else {
      setIsShowWarning(false);
    }
  }, [selectedListSusbcribers]);

  if (status === "loading" || isSegmentListLoading) return <p>Loading...</p>;
  if (!sessionData) return <p>Access Denied</p>;

  const displaySuccessToast = (text: string) => {
    toast.success(text, { theme: "colored" });
  };

  const displayErrorToast = (text: string) => {
    toast.error(text, { theme: "colored" });
  };

  const selectedListHandler = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedList(e.target.value);

    if (e.target.value) {
      setSendingEmail(true);
      filterByList.mutate({ id: Number(e.target.value) });
    } else {
      setSelectedListSusbcribers(null);
    }
  };

  const handleSendTestEmail = () => {
    if (
      !emailData.toAddress ||
      !emailData.subject ||
      !emailData.bodyHtml ||
      !emailData.bodyPlainText
    )
      return;

    setSendingEmail(true);
    setIsSendingTestEmail(true);

    const updatedBodyHtml = replaceEmailHtmlSource(
      emailData.bodyHtml,
      emailData.subject,
    );
    const updatedPlainText = replacePlainTextSource(emailData.bodyPlainText);

    sendEmail.mutate({
      toAddress: [
        { emailAddress: emailData.toAddress, subscribeId: "abcdefg" },
      ],
      subject: emailData.subject,
      bodyHtml: updatedBodyHtml,
      bodyPlainText: updatedPlainText,
    });
  };

  const handleSubmit = () => {
    if (
      !selectedListSusbcribers ||
      !emailData.subject ||
      !emailData.bodyHtml ||
      !emailData.bodyPlainText ||
      isShowWarning
    )
      return;

    const emailList = selectedListSusbcribers.list
      .filter((subscriber) => subscriber.subscriber.isDeactive === false)
      .map((emailData) => ({
        emailAddress: emailData.subscriber.email,
        subscribeId: emailData.subscriber.id,
      }));

    setSendingEmail(true);

    const updatedBodyHtml = replaceEmailHtmlSource(
      emailData.bodyHtml,
      emailData.subject,
    );
    const updatedPlainText = replacePlainTextSource(emailData.bodyPlainText);

    sendEmail.mutate({
      toAddress: emailList,
      subject: emailData.subject,
      bodyHtml: updatedBodyHtml,
      bodyPlainText: updatedPlainText,
    });
  };

  return (
    <>
      <Head>
        <title>Compose Email</title>
      </Head>
      <NavBar />
      <main className=" relative hidden min-h-screen flex-col items-center justify-center md:flex">
        <div className="container mb-8 flex flex-col justify-center px-4 lg:flex-row">
          <div className="h-full w-full lg:w-2/5">
            <div className="mb-8 flex flex-col">
              <label htmlFor="subjectContent" className="mt-8">
                Email Subject
              </label>
              <input
                name="subjectContent"
                onChange={(e) =>
                  setEmailData((prev) => ({ ...prev, subject: e.target.value }))
                }
                value={emailData.subject}
                className="p-2 text-black focus:outline-none"
              ></input>
            </div>
            <div>
              <label>Send email to this list:</label>
              <select
                className="ml-2 rounded-lg bg-orange-600 p-4 text-center text-sm font-medium text-white focus:outline-none"
                value={selectedList}
                onChange={selectedListHandler}
              >
                <option value="">Please choose a list</option>
                {segmentList?.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-8 flex flex-col">
              <label htmlFor="toAddress">{`Send Preview Email (Only one email)`}</label>
              <input
                name="toAddress"
                onChange={(e) =>
                  setEmailData((prev) => ({
                    ...prev,
                    toAddress: e.target.value,
                  }))
                }
                value={emailData.toAddress}
                className="p-2 text-black focus:outline-none"
              ></input>
              <button
                type="submit"
                className="mt-4 rounded-lg bg-orange-600 p-4 text-center text-sm font-medium text-white focus:outline-none"
                disabled={sendingEmail}
                onClick={handleSendTestEmail}
              >
                {sendingEmail && <LoadingSpinner />}
                <span className="mx-2">Send Preview Email</span>
              </button>
            </div>
            {isShowWarning && (
              <p className="mt-4 text-red-700">
                Email list exceed 348 emails! Please blast email to less than
                348 emails.
              </p>
            )}
          </div>
          <div className="flex h-full w-full flex-col items-center p-4 lg:w-3/5">
            <div className="flex flex-col">
              <label htmlFor="emailContent" className="mt-8">
                Email Body HTML
              </label>
              <textarea
                name="emailContent"
                value={emailData.bodyHtml}
                placeholder="Paste from Mailchimp HTML Source."
                onChange={(e) =>
                  setEmailData((prev) => ({
                    ...prev,
                    bodyHtml: e.target.value,
                  }))
                }
                className="mb-8 h-[500px] w-[500px] p-4 text-black focus:outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="emailPlainTextContent" className="mt-4">
                Plain-Text Email
              </label>
              <textarea
                name="emailPlainTextContent"
                value={emailData.bodyPlainText}
                placeholder="Paste from Mailchimp Plain-Text Email."
                onChange={(e) =>
                  setEmailData((prev) => ({
                    ...prev,
                    bodyPlainText: e.target.value,
                  }))
                }
                className="mb-8 h-[500px] w-[500px] p-4 text-black focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center rounded-lg bg-orange-600 p-4 text-center text-sm font-medium text-white focus:outline-none"
              disabled={sendingEmail}
              onClick={handleSubmit}
            >
              {sendingEmail && <LoadingSpinner />}
              <span className="mx-2">Send Email</span>
            </button>
          </div>
        </div>
      </main>
      <MobileView />
    </>
  );
}

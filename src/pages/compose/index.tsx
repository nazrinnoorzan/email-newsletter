import { useState, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import DateTimePicker from "react-datetime-picker";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";

import NavBar from "~/components/NavBar";
import MobileView from "~/components/MobileView";
import LoadingSpinner from "~/components/LoadingSpinner";

import { api } from "~/utils/api";
import {
  replaceEmailHtmlSource,
  replacePlainTextSource,
  convertToISOWithoutSeconds,
  CAMPAIGN_STATUS,
} from "~/utils/utils";
import { type SelectedListSusbcribers } from "~/pages/compose/subscribers";

interface IEmailData {
  subject: string;
  bodyHtml: string;
  bodyPlainText: string;
  toAddress: string;
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

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
  const [selectedList, setSelectedList] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [selectedListSusbcribers, setSelectedListSusbcribers] =
    useState<SelectedListSusbcribers | null>(null);
  const [isSchedule, setIsSchedule] = useState(false);
  const [date, setDate] = useState<Value>(new Date());

  const router = useRouter();
  const { data: sessionData, status } = useSession();
  const { data: segmentList, isLoading: isSegmentListLoading } =
    api.segment.getAll.useQuery();

  const filterByList = api.segment.getSubscribers.useMutation({
    onSuccess(data) {
      setSelectedListSusbcribers(data);
      setSendingEmail(false);
    },
    onError(error) {
      setSendingEmail(false);
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
        setSelectedName("");
        setSelectedListSusbcribers(null);
        setEmailData(defaultEmailData);
        setSendingEmail(false);
      }
    },
    onError(error) {
      setSendingEmail(false);
      displayErrorToast("Sending email failed!");
      console.error("Sending email failed!", error);
    },
  });

  const sendEventBridge = api.compose.sendEventBridge.useMutation({
    onSuccess(_data) {
      displaySuccessToast(
        `Sending scheduled emails at ${date as unknown as string} success!`,
      );
      setSelectedList("");
      setSelectedName("");
      setSelectedListSusbcribers(null);
      setEmailData(defaultEmailData);
      setSendingEmail(false);
      setIsSchedule(false);
      setDate(new Date());
    },
    onError(error) {
      setSendingEmail(false);
      displayErrorToast("Sending scheduled email failed!");
      console.error("Sending scheduled email failed!", error);
    },
  });

  const saveCampaign = api.campaign.save.useMutation({
    onError(error) {
      setSendingEmail(false);
      displayErrorToast("Failed to upload to S3!");
      console.error("Failed to upload to S3!", error);
    },
  });

  if (status === "loading" || isSegmentListLoading) return <p>Loading...</p>;
  if (!sessionData) return <p>Access Denied</p>;

  const displaySuccessToast = (text: string) => {
    toast.success(text, { theme: "colored" });
  };

  const displayErrorToast = (text: string) => {
    toast.error(text, { theme: "colored" });
  };

  const selectedListHandler = (e: ChangeEvent<HTMLSelectElement>) => {
    const listName = e.target.options[e.target.selectedIndex]?.text ?? "";

    setSelectedList(e.target.value);
    setSelectedName(listName);

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
        {
          emailAddress: emailData.toAddress,
          subscribeId: "abcdefg",
          firstName: "firstName",
          lastName: "lastName",
        },
      ],
      subject: emailData.subject,
      bodyHtml: updatedBodyHtml,
      bodyPlainText: updatedPlainText,
    });
  };

  const handleSubmit = async () => {
    if (
      !selectedListSusbcribers ||
      !emailData.subject ||
      !emailData.bodyHtml ||
      !emailData.bodyPlainText
    )
      return;

    const emailList = selectedListSusbcribers.list
      .filter((subscriber) => subscriber.subscriber.isDeactive === false)
      .map((emailData) => ({
        emailAddress: emailData.subscriber.email,
        subscribeId: emailData.subscriber.id,
        firstName: emailData.subscriber.firstName,
        lastName: emailData.subscriber.lastName,
      }));

    setSendingEmail(true);

    const updatedBodyHtml = replaceEmailHtmlSource(
      emailData.bodyHtml,
      emailData.subject,
    );
    const updatedPlainText = replacePlainTextSource(emailData.bodyPlainText);
    let dateISO = "";

    if (isSchedule) {
      const givenDate = new Date(date as Date);
      const currentDate = new Date();
      const thirtyMinutesLater = new Date(
        currentDate.getTime() + 30 * 60 * 1000,
      );

      // Check if the input date is at least 30 minutes later than the current time
      if (givenDate <= thirtyMinutesLater) {
        displayErrorToast(
          "The provided date must be at least 30 minutes after the current time.",
        );
        setSendingEmail(false);
        return;
      }

      dateISO = convertToISOWithoutSeconds(date as Date);

      if (!dateISO) {
        displayErrorToast("Something is wrong in setting the calendar!");
        setSendingEmail(false);
        return;
      }
    }

    const s3Key = await saveCampaign.mutateAsync({
      segmentName: selectedName,
      status: CAMPAIGN_STATUS.SENT,
      subscriberCount: selectedListSusbcribers.list.length,
      scheduleTime: dateISO,
      toAddress: emailList,
      subject: emailData.subject,
      bodyHtml: updatedBodyHtml,
      bodyPlainText: updatedPlainText,
    });

    if (!s3Key) {
      displayErrorToast("Failed to save data to s3!");
      setSendingEmail(false);
      return;
    }

    if (isSchedule) {
      sendEventBridge.mutate({
        date: dateISO,
        scheduleName: s3Key,
        toAddress: emailList,
        subject: emailData.subject,
        bodyHtml: updatedBodyHtml,
        bodyPlainText: updatedPlainText,
      });
    } else {
      sendEmail.mutate({
        toAddress: emailList,
        subject: emailData.subject,
        bodyHtml: updatedBodyHtml,
        bodyPlainText: updatedPlainText,
      });
    }
  };

  const handleDraftSubmit = async () => {
    if (!emailData.subject || !emailData.bodyHtml || !emailData.bodyPlainText)
      return;

    const emailList = selectedListSusbcribers?.list
      .filter((subscriber) => subscriber.subscriber.isDeactive === false)
      .map((emailData) => ({
        emailAddress: emailData.subscriber.email,
        subscribeId: emailData.subscriber.id,
        firstName: emailData.subscriber.firstName,
        lastName: emailData.subscriber.lastName,
      }));

    setSendingEmail(true);

    const updatedBodyHtml = replaceEmailHtmlSource(
      emailData.bodyHtml,
      emailData.subject,
    );
    const updatedPlainText = replacePlainTextSource(emailData.bodyPlainText);

    const s3Key = await saveCampaign.mutateAsync({
      segmentName: selectedName,
      status: CAMPAIGN_STATUS.DRAFT,
      subscriberCount: selectedListSusbcribers?.list.length ?? 0,
      scheduleTime: "",
      toAddress: emailList ?? [],
      subject: emailData.subject,
      bodyHtml: updatedBodyHtml,
      bodyPlainText: updatedPlainText,
    });

    if (!s3Key) {
      displayErrorToast("Failed to save data to s3!");
      setSendingEmail(false);
      return;
    }

    displaySuccessToast(`Draft successfully saved!`);
    await router.push("/campaigns");
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
            {selectedListSusbcribers && (
              <div className="pt-4 text-orange-600">
                Total emails are {selectedListSusbcribers.list.length}.
              </div>
            )}
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
              <button
                type="submit"
                className="mt-4 rounded-lg bg-orange-600 p-4 text-center text-sm font-medium text-white focus:outline-none"
                disabled={sendingEmail}
                onClick={handleDraftSubmit}
              >
                {sendingEmail && <LoadingSpinner />}
                <span className="mx-2">Save Email As Draft</span>
              </button>
              <div className="mt-4">
                <label className="mr-1" htmlFor="isSchedule">
                  Schedule email for later?
                </label>
                <input
                  name="isSchedule"
                  type="checkbox"
                  checked={isSchedule}
                  onChange={() => setIsSchedule(!isSchedule)}
                />
              </div>
              {isSchedule && (
                <>
                  <div className="mt-4">
                    <DateTimePicker
                      className="custom-datetime"
                      format="dd/MM/y h:mm a"
                      minDate={new Date()}
                      onChange={(value) => !sendingEmail && setDate(value)}
                      value={date}
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-4 rounded-lg bg-orange-600 p-4 text-center text-sm font-medium text-white focus:outline-none"
                    disabled={sendingEmail}
                    onClick={handleSubmit}
                  >
                    {sendingEmail && <LoadingSpinner />}
                    <span className="mx-2">Send Schedule Email</span>
                  </button>
                </>
              )}
            </div>
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
              disabled={sendingEmail || isSchedule}
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

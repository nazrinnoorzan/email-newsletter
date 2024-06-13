import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { toast } from "react-toastify";

import AccessDenied from "~/components/AccessDenied";
import Loading from "~/components/Loading";

import { api } from "~/utils/api";
import { emailIsValid } from "~/utils/utils";
import NavBar from "~/components/NavBar";
import MobileView from "~/components/MobileView";

// export default function AddSubscribers() {
//   const [textarea, setTextarea] = useState("");
//   const [selectedList, setSelectedList] = useState("");

//   const { data: sessionData, status } = useSession();
//   const { data: segmentList, isLoading: isSegmentListLoading } =
//     api.segment.getAll.useQuery();
//   const addSubscribers = api.subscriber.addSubscribers.useMutation({
//     onSuccess(_data) {
//       displaySuccessToast("Add subscribers success!");
//       setTextarea("");
//       setSelectedList("");
//     },
//     onError(error) {
//       displayErrorToast("Update Failed!");
//       console.error("Update Failed!", error);
//     },
//   });

//   if (status === "loading" || isSegmentListLoading) return <Loading />;
//   if (!sessionData) return <AccessDenied />;

//   const displaySuccessToast = (text: string) => {
//     toast.success(text, { theme: "colored" });
//   };

//   const displayErrorToast = (text: string) => {
//     toast.error(text, { theme: "colored" });
//   };

//   const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     const splitEmails = textarea.split("\n");

//     // eslint-disable-next-line @typescript-eslint/prefer-for-of
//     for (let i = 0; i < splitEmails.length; i++) {
//       if (!emailIsValid(splitEmails[i] ?? "")) {
//         alert("Some emails format are wrong! Please check.");
//         return;
//       }
//     }

//     const formatEmailsData = splitEmails.map((email) => ({ email }));
//     addSubscribers.mutate({
//       emails: formatEmailsData,
//       list: selectedList ? Number(selectedList) : -1,
//     });
//   };

//   return (
//     <>
//       <Head>
//         <title>Add Susbcribers</title>
//       </Head>
//       <NavBar />
//       <main className="relative hidden min-h-screen flex-col items-center py-16 md:flex">
//         <div className="container flex flex-col items-center justify-center gap-12 px-4">
//           <form className="flex flex-col" onSubmit={handleSubmit}>
//             <label htmlFor="list" className="mb-8">
//               Add To List:
//               <select
//                 name="list"
//                 className="ml-2 rounded-lg bg-orange-600 p-4 text-center text-sm font-medium text-white focus:outline-none"
//                 value={selectedList}
//                 onChange={(e) => setSelectedList(e.target.value)}
//               >
//                 <option value="">None</option>
//                 {segmentList?.map((segment) => (
//                   <option key={segment.id} value={segment.id}>
//                     {segment.name}
//                   </option>
//                 ))}
//               </select>
//             </label>
//             <label htmlFor="emails">Email List To Add</label>
//             <textarea
//               name="emails"
//               value={textarea}
//               placeholder="Separate emails list in a new line without comma."
//               onChange={(e) => setTextarea(e.target.value)}
//               className="mb-8 h-[500px] w-[500px] p-4 text-black focus:outline-none"
//             />
//             <button
//               type="submit"
//               className="rounded-lg bg-orange-600 p-4 text-center text-sm font-medium text-white focus:outline-none"
//             >
//               Submit
//             </button>
//           </form>
//         </div>
//       </main>
//       <MobileView />
//     </>
//   );
// }

export default function AddSubscribers() {
  return (
    <>
      <Head>
        <title>Add Susbcribers</title>
      </Head>
      <NavBar />
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1>Coming soon!</h1>
      </div>
    </>
  );
}

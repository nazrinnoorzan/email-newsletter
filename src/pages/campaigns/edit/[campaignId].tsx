import Head from "next/head";

import NavBar from "~/components/NavBar";

export default function EditCampaign() {
  console.log("edit campaign page");

  return (
    <>
      <Head>
        <title>Edit Campaign</title>
      </Head>
      <NavBar />
      <main className=" relative flex min-h-screen flex-col items-center justify-center">
        <div className="container mb-8 flex flex-col justify-center px-4 lg:flex-row">
          <div className="flex h-full w-full flex-col items-center p-4">
            <div className="flex flex-col">Edit Campaign Page</div>
          </div>
        </div>
      </main>
    </>
  );
}

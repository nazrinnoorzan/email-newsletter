export default function MobileView() {
  return (
    <main className=" relative flex min-h-screen flex-col items-center justify-center md:hidden">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex flex-col items-center gap-2">
          <p className="text-white">Only can view in Desktop screen size.</p>
        </div>
      </div>
    </main>
  );
}

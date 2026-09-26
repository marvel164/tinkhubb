export default function AdminLoading() {
  return (
    <main className="min-h-[calc(100vh-76px)] bg-[#f5f6f8] px-4 py-7 text-[#171717] transition-colors dark:bg-[#15120f] dark:text-[#fff4ec] md:px-7 md:py-8">
      <div className="mx-auto max-w-[1280px] animate-pulse">
        <div className="h-7 w-52 rounded bg-[#e4e5e7] dark:bg-[#342a24]" />

        <div className="mt-2 h-3 w-72 rounded bg-[#e9eaec] dark:bg-[#29221d]" />

        <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[125px] rounded-[6px] border border-[#e5e7ea] bg-white p-5 transition-colors dark:border-[#342a24] dark:bg-[#1b1714]"
            >
              <div className="h-3 w-24 rounded bg-[#ececee] dark:bg-[#342a24]" />

              <div className="mt-5 h-7 w-20 rounded bg-[#e4e5e7] dark:bg-[#3b3029]" />

              <div className="mt-3 h-2 w-28 rounded bg-[#f0f0f1] dark:bg-[#29221d]" />
            </div>
          ))}
        </section>

        <section className="mt-4 h-[330px] rounded-[6px] border border-[#e5e7ea] bg-white p-5 transition-colors dark:border-[#342a24] dark:bg-[#1b1714]">
          <div className="h-4 w-40 rounded bg-[#e7e8ea] dark:bg-[#342a24]" />

          <div className="mt-2 h-2 w-64 rounded bg-[#f0f0f1] dark:bg-[#29221d]" />

          <div className="mt-8 flex h-[190px] items-end gap-4 px-5">
            {[70, 55, 42, 32, 20].map((height, index) => (
              <div
                key={index}
                className="flex-1 rounded-t-[18px] bg-[#ececee] dark:bg-[#3b3029]"
                style={{
                  height: `${height}%`,
                }}
              />
            ))}
          </div>
        </section>

        <section className="mt-4 h-[230px] rounded-[6px] border border-[#e5e7ea] bg-white transition-colors dark:border-[#342a24] dark:bg-[#1b1714]" />

        <section className="mt-4 h-[270px] rounded-[6px] border border-[#e5e7ea] bg-white transition-colors dark:border-[#342a24] dark:bg-[#1b1714]" />
      </div>
    </main>
  );
}

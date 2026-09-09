export default function Loading() {
  return (
    <main className="min-h-screen bg-[#fffaf6]">
      <header className="border-b border-[#f1e5dc] bg-[#fffaf6]">
        <div className="mx-auto flex h-[78px] max-w-[1240px] items-center px-5 sm:px-8">
          <span className="text-[23px] font-black tracking-[-0.04em] text-[#121212]">
            TinkHubb
          </span>
        </div>
      </header>

      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#6f7278]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ff6b00] border-t-transparent" />
          Loading your results...
        </div>
      </div>
    </main>
  );
}

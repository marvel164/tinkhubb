import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Medal,
  UserRoundPlus,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const steps = [
  {
    number: "01",
    icon: UserRoundPlus,
    title: "Register",
    description:
      "Create your TinkHubb account with your username and phone number. It only takes a moment to get ready.",
  },
  {
    number: "02",
    icon: CheckCircle2,
    title: "Answer and Score",
    description:
      "Take a timed round of 10 questions. Every correct answer earns you a point and moves your score forward.",
  },
  {
    number: "03",
    icon: Medal,
    title: "Climb the Leaderboard",
    description:
      "Keep playing, protect your daily streak, earn more points, and see how high you can climb.",
  },
];

const highlights = [
  "10 questions per round",
  "Timed gameplay",
  "Daily streak tracking",
  "Live leaderboard rankings",
];

export default function Page() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffaf6] text-[#451900] transition-colors duration-200 dark:bg-[#17110e] dark:text-[#fff4ec]">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-[#fffaf6] dark:bg-[#17110e]">
          <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#ffe8d7] blur-3xl dark:bg-[#3b2115]" />
          <div className="pointer-events-none absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-[#fff0e5] blur-3xl dark:bg-[#321d14]" />

          <div className="relative mx-auto w-full max-w-[1200px] px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-20 md:pb-24 md:pt-24 lg:px-12 lg:pt-28">
            <div className="max-w-[760px]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FF6B00] sm:text-[11px]">
                HOW IT WORKS
              </p>

              <h1 className="mt-4 text-[40px] font-extrabold leading-[1.02] tracking-[-0.055em] text-[#451900] dark:text-[#fff4ec] sm:text-[54px] md:text-[62px]">
                Three steps between you and the leaderboard.
              </h1>

              <p className="mt-6 max-w-[590px] text-[14px] leading-7 text-[#786b63] dark:text-[#c1b4ad] sm:text-[15px]">
                TinkHubb keeps trivia simple. Register, play your round,
                score points, and keep coming back to improve your position.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#f0ded4] pt-6 dark:border-[#3d2d26] sm:mt-14">
              {highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="flex items-center gap-2 text-[10px] font-bold text-[#806f65] dark:text-[#b9aaa2]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STEPS */}
        <section className="border-y border-[#f2e2d9] bg-white dark:border-[#342620] dark:bg-[#201815]">
          <div className="mx-auto w-full max-w-[1200px] px-5 py-20 sm:px-8 md:py-24 lg:px-12">
            <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
              {/* Connector */}
              <div className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-[27px] hidden border-t border-dashed border-[#e8d6cb] dark:border-[#4b3931] md:block" />

              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.number}
                    className="relative"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FF6B00] text-[11px] font-extrabold text-white shadow-[0_8px_20px_rgba(255,107,0,0.15)]">
                        {step.number}
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1e7] text-[#FF6B00] dark:bg-[#352219]">
                        <Icon size={18} strokeWidth={1.9} />
                      </div>
                    </div>

                    <h2 className="mt-7 text-[19px] font-extrabold tracking-[-0.02em] text-[#451900] dark:text-[#fff4ec]">
                      {step.title}
                    </h2>

                    <p className="mt-3 max-w-[320px] text-[13px] leading-6 text-[#786b63] dark:text-[#c1b4ad]">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* SIMPLE GAME FLOW */}
        <section className="bg-[#fffaf6] dark:bg-[#17110e]">
          <div className="mx-auto grid w-full max-w-[1200px] items-center gap-12 px-5 py-20 sm:px-8 md:py-24 lg:grid-cols-[1fr_0.9fr] lg:px-12">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]">
                THE GAME
              </p>

              <h2 className="mt-4 max-w-[600px] text-[34px] font-extrabold leading-tight tracking-[-0.045em] text-[#451900] dark:text-[#fff4ec] sm:text-[43px]">
                Fast questions. Clear choices. No wasted time.
              </h2>

              <p className="mt-5 max-w-[570px] text-[14px] leading-7 text-[#786b63] dark:text-[#c1b4ad]">
                Each round gives you 10 questions from TinkHubb&apos;s
                trivia categories. Answer each question before the timer
                runs out and move through the round one question at a time.
              </p>

              <Link
                href="/play"
                className="group mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[7px] bg-[#FF6B00] px-7 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_10px_24px_rgba(255,107,0,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e95f00] hover:shadow-[0_14px_30px_rgba(255,107,0,0.2)] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
              >
                Start Playing
                <ArrowRight
                  size={14}
                  strokeWidth={2.5}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="mx-auto w-full max-w-[430px]">
              <div className="rounded-[16px] border border-[#f0ded4] bg-white p-5 shadow-[0_18px_55px_rgba(69,25,0,0.06)] dark:border-[#49352c] dark:bg-[#241b17] dark:shadow-[0_18px_55px_rgba(0,0,0,0.2)] sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8d7c72] dark:text-[#aa9b93]">
                    YOUR ROUND
                  </span>

                  <span className="rounded-full bg-[#fff0e6] px-3 py-1.5 text-[9px] font-extrabold text-[#FF6B00] dark:bg-[#352219]">
                    10 QUESTIONS
                  </span>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#817168] dark:text-[#b0a19a]">
                    <span>Progress</span>
                    <span className="text-[#FF6B00]">04 / 10</span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1e1d8] dark:bg-[#403029]">
                    <div className="h-full w-[40%] rounded-full bg-[#FF6B00]" />
                  </div>
                </div>

                <div className="mt-7 rounded-[11px] border border-[#eee0d8] bg-[#fffaf7] p-5 dark:border-[#49352c] dark:bg-[#1d1613]">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#FF6B00]">
                    QUESTION 04
                  </p>

                  <p className="mt-3 text-[18px] font-extrabold leading-tight tracking-[-0.02em] text-[#451900] dark:text-[#fff4ec]">
                    Choose the answer you think is correct.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {["A", "B", "C", "D"].map((letter, index) => (
                      <div
                        key={letter}
                        className={`rounded-[8px] border p-3 ${
                          index === 1
                            ? "border-[#FF6B00] bg-[#FF6B00] text-white"
                            : "border-[#eee0d8] bg-white text-[#67584f] dark:border-[#49352c] dark:bg-[#241b17] dark:text-[#d0c3bb]"
                        }`}
                      >
                        <span className="text-[10px] font-extrabold">
                          {letter}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#f0e3dc] pt-5 dark:border-[#3b2d26]">
                  <div className="flex items-center gap-2">
                    <FlameIcon />
                    <span className="text-[10px] font-bold text-[#75665d] dark:text-[#c1b4ad]">
                      Keep your streak alive
                    </span>
                  </div>

                  <span className="text-[10px] font-extrabold text-[#FF6B00]">
                    60 secs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="border-t border-[#f2ddd1] bg-[#fff2e9] dark:border-[#49352c] dark:bg-[#2b1d17]">
          <div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 py-20 text-center sm:px-8 md:py-24">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]">
              READY?
            </p>

            <h2 className="mt-4 text-[35px] font-extrabold leading-tight tracking-[-0.05em] text-[#451900] dark:text-[#fff4ec] sm:text-[48px]">
              Your next score starts here.
            </h2>

            <p className="mt-5 max-w-[500px] text-[13px] leading-6 text-[#786b63] dark:text-[#c1b4ad]">
              Step into your next round, test what you know, and see where
              you land on the leaderboard.
            </p>

            <Link
              href="/play"
              className="mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[7px] bg-[#FF6B00] px-8 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_10px_24px_rgba(255,107,0,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e95f00] hover:shadow-[0_14px_30px_rgba(255,107,0,0.2)] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
            >
              Play Now
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FlameIcon() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff0e6] text-[#FF6B00] dark:bg-[#352219]">
      <span className="text-[12px]">🔥</span>
    </span>
  );
}

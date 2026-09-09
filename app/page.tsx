import Link from "next/link";
import {
  Atom,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Cpu,
  Flame,
  Globe2,
  Landmark,
  Trophy,
  Tv,
  Zap,
} from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const categories = [
  {
    name: "General Knowledge",
    icon: BookOpen,
    className:
      "border-[#ead99b] bg-[#fff8d9] hover:border-[#dfca79] hover:bg-[#fff6ce] dark:border-[#665d35] dark:bg-[#302d1d] dark:hover:border-[#7d713f] dark:hover:bg-[#383420]",
  },
  {
    name: "Science",
    icon: Atom,
    className:
      "border-[#c7e1f2] bg-[#edf8ff] hover:border-[#a9d1e9] hover:bg-[#e5f5ff] dark:border-[#3c596b] dark:bg-[#1d2b34] dark:hover:border-[#4c7187] dark:hover:bg-[#22343f]",
  },
  {
    name: "History",
    icon: Landmark,
    className:
      "border-[#cfe4d4] bg-[#f0faf2] hover:border-[#b8d6be] hover:bg-[#e9f7ec] dark:border-[#405846] dark:bg-[#1f2c22] dark:hover:border-[#52705a] dark:hover:bg-[#233327]",
  },
  {
    name: "Technology",
    icon: Cpu,
    className:
      "border-[#ddd0ef] bg-[#f7f1ff] hover:border-[#c8b6df] hover:bg-[#f3ebff] dark:border-[#57476b] dark:bg-[#2b2235] dark:hover:border-[#69547f] dark:hover:bg-[#30263c]",
  },
  {
    name: "Business",
    icon: BriefcaseBusiness,
    className:
      "border-[#f0cccc] bg-[#fff0f0] hover:border-[#e5b5b5] hover:bg-[#ffebeb] dark:border-[#633f3f] dark:bg-[#321f1f] dark:hover:border-[#7a4c4c] dark:hover:bg-[#382323]",
  },
  {
    name: "Current Affairs",
    icon: Zap,
    className:
      "border-[#f3d2b8] bg-[#fff4e9] hover:border-[#e8bc9a] hover:bg-[#ffefe1] dark:border-[#684c39] dark:bg-[#33271f] dark:hover:border-[#805c43] dark:hover:bg-[#3a2d24]",
  },
  {
    name: "Sports",
    icon: Trophy,
    className:
      "border-[#ead99b] bg-[#fff8d9] hover:border-[#dfca79] hover:bg-[#fff6ce] dark:border-[#665d35] dark:bg-[#302d1d] dark:hover:border-[#7d713f] dark:hover:bg-[#383420]",
  },
  {
    name: "Geography",
    icon: Globe2,
    className:
      "border-[#c7e1f2] bg-[#edf8ff] hover:border-[#a9d1e9] hover:bg-[#e5f5ff] dark:border-[#3c596b] dark:bg-[#1d2b34] dark:hover:border-[#4c7187] dark:hover:bg-[#22343f]",
  },
  {
    name: "Entertainment",
    icon: Tv,
    className:
      "border-[#cfe4d4] bg-[#f0faf2] hover:border-[#b8d6be] hover:bg-[#e9f7ec] dark:border-[#405846] dark:bg-[#1f2c22] dark:hover:border-[#52705a] dark:hover:bg-[#233327]",
  },
];

const leaderboard = [
  { rank: 1, username: "Kemi_O", points: "12,850", streak: 18 },
  { rank: 2, username: "Tunde_A", points: "11,920", streak: 14 },
  { rank: 3, username: "Adaeze_N", points: "11,450", streak: 21 },
  { rank: 4, username: "Daniel_K", points: "10,880", streak: 11 },
  { rank: 5, username: "Maya_T", points: "10,420", streak: 9 },
  { rank: 6, username: "Chris_E", points: "9,980", streak: 16 },
];

const steps = [
  {
    number: "01",
    title: "Register",
    description:
      "Create your TinkHubb account with your username and phone number.",
  },
  {
    number: "02",
    title: "Answer and Score",
    description:
      "Take 10 timed questions and earn a point every time you get one right.",
  },
  {
    number: "03",
    title: "Climb the Leaderboard",
    description:
      "Keep playing, build your streak, and compete for a higher position.",
  },
];

const answers = ["A", "B", "C", "D"];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffaf6] text-[#451900] transition-colors duration-200 dark:bg-[#17110e] dark:text-[#fff4ec]">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-[#fffaf6] dark:bg-[#17110e]">
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-[#fff0e5] blur-3xl dark:bg-[#3a2015]" />
          <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#fff0e5] blur-3xl dark:bg-[#3a2015]" />

          <div className="relative mx-auto grid min-h-[620px] w-full max-w-[1440px] items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 md:min-h-[650px] md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12 lg:py-28">
            <div className="max-w-[650px]">
              <p className="mb-5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FF6B00] sm:text-[11px]">
                TINKHUBB TRIVIA
              </p>

              <h1 className="max-w-[620px] text-[45px] font-extrabold leading-[0.98] tracking-[-0.055em] text-[#451900] dark:text-[#fff4ec] sm:text-[58px] md:text-[68px] lg:text-[72px]">
                Think Fast.
                <br />
                <span className="text-[#FF6B00]">Score Big.</span>
                <br />
                Rule the
                <br />
                Leaderboard.
              </h1>

              <p className="mt-7 max-w-[500px] text-[14px] leading-7 text-[#766960] dark:text-[#c9bcb5] sm:text-[15px]">
                Test your knowledge, earn points, keep your streak alive,
                and see how high you can climb.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/play"
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[7px] bg-[#FF6B00] px-7 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_10px_24px_rgba(255,107,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e95f00] hover:shadow-[0_14px_30px_rgba(255,107,0,0.22)] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:ring-offset-2 focus:ring-offset-[#fffaf6] dark:focus:ring-offset-[#17110e]"
                >
                  Play Now
                  <ArrowRight
                    size={14}
                    strokeWidth={2.5}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>

                <Link
                  href="/how-it-works"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-[7px] border border-[#f0ddd2] bg-[#fff4ed] px-7 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6f5e54] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffb27d] hover:bg-white hover:text-[#FF6B00] dark:border-[#49352c] dark:bg-[#241b17] dark:text-[#c9bcb5] dark:hover:border-[#76523d] dark:hover:bg-[#2a1e19] dark:hover:text-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:ring-offset-2 focus:ring-offset-[#fffaf6] dark:focus:ring-offset-[#17110e]"
                >
                  See How It Works
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-semibold text-[#9a887e] dark:text-[#a99b93]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
                  10 questions
                </span>
                <span className="hidden h-3 w-px bg-[#e5d5cc] dark:bg-[#44332b] sm:block" />
                <span>Timed rounds</span>
                <span className="hidden h-3 w-px bg-[#e5d5cc] dark:bg-[#44332b] sm:block" />
                <span>Daily streaks</span>
              </div>
            </div>

            {/* HERO GAME PREVIEW */}
            <div className="relative mx-auto flex w-full max-w-[510px] items-center justify-center lg:justify-end">
              <div className="absolute -right-2 -top-2 h-28 w-28 rounded-full bg-[#ffe2cd] blur-2xl dark:bg-[#5a2c13] sm:-right-7 sm:-top-7" />

              <div className="relative w-full max-w-[430px]">
                <div className="absolute -bottom-5 -left-5 h-20 w-20 rounded-full border border-[#f5d8c6] dark:border-[#513326]" />

                <div className="relative rounded-[20px] border border-[#f1ded3] bg-white p-5 shadow-[0_25px_70px_rgba(84,48,25,0.08)] dark:border-[#49352c] dark:bg-[#241b17] dark:shadow-[0_25px_70px_rgba(0,0,0,0.24)] sm:p-7">
                  <div className="flex items-center justify-between border-b border-[#f3e7e0] pb-5 dark:border-[#3b2d26]">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#FF6B00]">
                        TODAY&apos;S CHALLENGE
                      </p>

                      <p className="mt-1 text-[13px] font-bold text-[#451900] dark:text-[#fff4ec]">
                        Ready to play?
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0e6] dark:bg-[#3a251b]">
                      <Flame
                        size={20}
                        strokeWidth={2}
                        className="text-[#FF6B00]"
                      />
                    </div>
                  </div>

                  <div className="py-7">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#82736a] dark:text-[#a99b93]">
                      <span>QUESTION 04</span>
                      <span className="text-[#FF6B00]">04 / 10</span>
                    </div>

                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f5e7df] dark:bg-[#403029]">
                      <div className="h-full w-[40%] rounded-full bg-[#FF6B00]" />
                    </div>

                    <p className="mt-7 text-[22px] font-extrabold leading-tight tracking-[-0.025em] text-[#451900] dark:text-[#fff4ec]">
                      How well do you know the world around you?
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      {answers.map((letter, index) => (
                        <div
                          key={letter}
                          className={`rounded-[9px] border p-3 transition-transform duration-200 ${
                            index === 1
                              ? "border-[#FF6B00] bg-[#FF6B00] text-white shadow-[0_7px_18px_rgba(255,107,0,0.16)]"
                              : "border-[#f0e2da] bg-[#fffaf7] text-[#5f5048] hover:-translate-y-0.5 hover:border-[#e7cfc1] dark:border-[#49352c] dark:bg-[#1d1613] dark:text-[#d3c6bf] dark:hover:border-[#60483a]"
                          }`}
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-[9px] font-extrabold dark:bg-white/10">
                            {letter}
                          </span>

                          <span className="mt-2 block text-[10px] font-bold">
                            Answer option
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#f3e7e0] pt-5 dark:border-[#3b2d26]">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-[#FF6B00]" />

                      <span className="text-[11px] font-bold text-[#6f625b] dark:text-[#c1b4ad]">
                        12 day streak
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-[#91837a] dark:text-[#a99b93]">
                      60 secs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-y border-[#f2e2d9] bg-white dark:border-[#342620] dark:bg-[#201815]">
          <div className="mx-auto w-full max-w-[1200px] px-5 py-20 sm:px-8 md:py-24 lg:px-12">
            <div className="max-w-[650px]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]">
                HOW IT WORKS
              </p>

              <h2 className="mt-4 text-[34px] font-extrabold leading-tight tracking-[-0.045em] text-[#451900] dark:text-[#fff4ec] sm:text-[43px]">
                Three steps between you and the leaderboard.
              </h2>
            </div>

            <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              <div className="pointer-events-none absolute left-[16%] right-[16%] top-6 hidden border-t border-dashed border-[#ead9cf] dark:border-[#4b3931] md:block" />

              {steps.map((step) => (
                <div key={step.number} className="relative">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B00] text-[11px] font-extrabold text-white shadow-[0_8px_18px_rgba(255,107,0,0.16)]">
                    {step.number}
                  </div>

                  <h3 className="mt-6 text-[18px] font-extrabold text-[#451900] dark:text-[#fff4ec]">
                    {step.title}
                  </h3>

                  <p className="mt-3 max-w-[310px] text-[13px] leading-6 text-[#786b63] dark:text-[#c1b4ad]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="bg-[#fffaf6] dark:bg-[#17110e]">
          <div className="mx-auto w-full max-w-[1200px] px-5 py-20 sm:px-8 md:py-24 lg:px-12">
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]">
                OUR TRIVIA CATEGORIES
              </p>

              <h2 className="mt-4 text-[34px] font-extrabold leading-tight tracking-[-0.045em] text-[#451900] dark:text-[#fff4ec] sm:text-[43px]">
                Questions are pulled from everywhere.
              </h2>
            </div>

            <div className="mx-auto mt-12 grid max-w-[900px] grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {categories.map((category) => {
                const Icon = category.icon;

                return (
                  <div
                    key={category.name}
                    className={`group flex min-h-[105px] items-center gap-4 rounded-[12px] border px-5 py-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(69,25,0,0.05)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.16)] ${category.className}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 transition-transform duration-200 group-hover:scale-105 dark:bg-black/15">
                      <Icon
                        size={18}
                        strokeWidth={1.8}
                        className="text-[#5f5149] dark:text-[#d2c4bc]"
                      />
                    </div>

                    <span className="text-[12px] font-extrabold text-[#51443d] dark:text-[#e1d5ce]">
                      {category.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* LEADERBOARD */}
        <section className="bg-white dark:bg-[#201815]">
          <div className="mx-auto w-full max-w-[1200px] px-5 py-20 sm:px-8 md:py-24 lg:px-12">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]">
                  LEADERBOARD
                </p>

                <h2 className="mt-4 text-[34px] font-extrabold leading-tight tracking-[-0.045em] text-[#451900] dark:text-[#fff4ec] sm:text-[43px]">
                  See exactly where you stand.
                </h2>
              </div>

              <Link
                href="/leaderboard"
                className="group inline-flex w-fit items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#FF6B00] transition-colors hover:text-[#e95f00]"
              >
                View Full Leaderboard
                <ArrowRight
                  size={14}
                  strokeWidth={2.5}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="mt-10 overflow-hidden rounded-[12px] border border-[#eee1d9] bg-white shadow-[0_12px_40px_rgba(69,25,0,0.04)] dark:border-[#49352c] dark:bg-[#241b17] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
              <div className="hidden grid-cols-[80px_1fr_150px_120px] border-b border-[#f1e6df] bg-[#fffaf7] px-5 py-4 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#97887f] dark:border-[#3b2d26] dark:bg-[#1d1613] dark:text-[#a99b93] sm:grid">
                <span>Rank</span>
                <span>Player</span>
                <span>Points</span>
                <span>Streak</span>
              </div>

              {leaderboard.map((player) => (
                <div
                  key={player.rank}
                  className={`grid grid-cols-[48px_1fr_auto] items-center gap-3 border-b border-[#f4ebe6] px-4 py-4 last:border-b-0 transition-colors dark:border-[#3b2d26] sm:grid-cols-[80px_1fr_150px_120px] sm:px-5 ${
                    player.username === "Kemi_O"
                      ? "bg-[#fff3e9] hover:bg-[#ffede0] dark:bg-[#332219] dark:hover:bg-[#39261d]"
                      : "bg-white hover:bg-[#fffaf7] dark:bg-[#241b17] dark:hover:bg-[#2a1e19]"
                  }`}
                >
                  <span className="text-[13px] font-extrabold text-[#FF6B00]">
                    #{player.rank}
                  </span>

                  <span className="min-w-0 truncate text-[12px] font-bold text-[#51443d] dark:text-[#e1d5ce]">
                    {player.username}

                    {player.username === "Kemi_O" && (
                      <span className="ml-2 text-[9px] font-bold text-[#FF6B00]">
                        (you)
                      </span>
                    )}
                  </span>

                  <span className="text-right text-[12px] font-extrabold text-[#451900] dark:text-[#fff4ec] sm:text-left">
                    {player.points}
                  </span>

                  <span className="hidden items-center gap-1.5 text-[11px] font-bold text-[#75675f] dark:text-[#c1b4ad] sm:flex">
                    <Flame size={14} className="text-[#FF6B00]" />
                    {player.streak}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DAILY STREAK */}
        <section className="bg-[#fffaf6] dark:bg-[#17110e]">
          <div className="mx-auto grid w-full max-w-[1200px] items-center gap-12 px-5 py-20 sm:px-8 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
            <div className="flex justify-center lg:justify-start">
              <div className="relative flex h-[250px] w-[250px] flex-col items-center justify-center rounded-full border border-[#f4d8c7] bg-[#fff1e7] shadow-[0_20px_60px_rgba(255,107,0,0.08)] dark:border-[#5b3b2b] dark:bg-[#2e2019] dark:shadow-[0_20px_60px_rgba(0,0,0,0.22)] sm:h-[290px] sm:w-[290px]">
                <div className="absolute inset-5 rounded-full border border-dashed border-[#f1cbb5] dark:border-[#65432f]" />

                <Flame
                  size={62}
                  strokeWidth={1.5}
                  className="relative text-[#FF6B00]"
                />

                <p className="relative mt-4 text-[36px] font-extrabold tracking-[-0.05em] text-[#451900] dark:text-[#fff4ec]">
                  12
                </p>

                <p className="relative text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#796a61] dark:text-[#b4a69e]">
                  Day Streak
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]">
                DAILY STREAK
              </p>

              <h2 className="mt-4 max-w-[600px] text-[34px] font-extrabold leading-tight tracking-[-0.045em] text-[#451900] dark:text-[#fff4ec] sm:text-[43px]">
                Show up everyday and watch the flame grow.
              </h2>

              <p className="mt-5 max-w-[560px] text-[14px] leading-7 text-[#786b63] dark:text-[#c1b4ad]">
                Play at least one quiz every day to protect your streak.
                Hit milestones, unlock achievements, and keep building
                your run.
              </p>

              <div className="mt-8 max-w-[550px]">
                <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#8c7c73] dark:text-[#aa9b93]">
                  <span>7 Days</span>
                  <span className="text-[#FF6B00]">12 Days</span>
                  <span>14 Days</span>
                  <span>30 Days</span>
                </div>

                <div className="relative mt-4 h-2 rounded-full bg-[#f1dfd4] dark:bg-[#403029]">
                  <div className="relative h-full w-[40%] rounded-full bg-[#FF6B00]">
                    <span className="absolute -right-1.5 -top-1 h-5 w-5 rounded-full border-4 border-[#fffaf6] bg-[#FF6B00] dark:border-[#17110e]" />
                  </div>
                </div>
              </div>

              <Link
                href="/play"
                className="mt-8 inline-flex min-h-[46px] items-center justify-center rounded-[7px] bg-[#FF6B00] px-7 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_8px_20px_rgba(255,107,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e95f00] hover:shadow-[0_12px_26px_rgba(255,107,0,0.2)] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
              >
                Keep My Streak Alive
              </Link>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="border-t border-[#f2ddd1] bg-[#fff2e9] dark:border-[#49352c] dark:bg-[#2b1d17]">
          <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center px-5 py-20 text-center sm:px-8 md:py-24">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]">
              ARE YOU READY FOR TODAY&apos;S GAME?
            </p>

            <h2 className="mt-5 text-[35px] font-extrabold leading-tight tracking-[-0.05em] text-[#451900] dark:text-[#fff4ec] sm:text-[48px]">
              Your first round is
              <br className="sm:hidden" /> waiting.
            </h2>

            <p className="mt-5 max-w-[500px] text-[13px] leading-6 text-[#786b63] dark:text-[#c1b4ad]">
              Ten questions. One shot at the leaderboard. Keep your streak
              alive and see what you can score today.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/play"
                className="inline-flex min-h-[48px] items-center justify-center rounded-[7px] bg-[#FF6B00] px-8 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_10px_24px_rgba(255,107,0,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e95f00] hover:shadow-[0_14px_30px_rgba(255,107,0,0.2)] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
              >
                Play Now
              </Link>

              <Link
                href="/how-it-works"
                className="inline-flex min-h-[48px] items-center justify-center rounded-[7px] border border-[#edd8ca] bg-white px-8 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6f5e54] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffb27d] hover:text-[#FF6B00] dark:border-[#49352c] dark:bg-[#241b17] dark:text-[#c9bcb5] dark:hover:border-[#76523d] dark:hover:text-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

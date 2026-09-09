import Link from "next/link";

const playLinks = [
  { label: "Home", href: "/" },
  { label: "Play Game", href: "/play" },
  { label: "Leaderboard", href: "/leaderboard" },
];

const learnLinks = [
  { label: "How it works", href: "/how-it-works" },
  { label: "My Profile", href: "/profile" },
];

const socialLinks = [
  { label: "Instagram", href: "#" },
  { label: "TikTok", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "X (Twitter)", href: "#" },
  { label: "Facebook", href: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#f1ddd0] bg-[#fff4ec] text-[#451900] transition-colors duration-200 dark:border-[#3a2923] dark:bg-[#211713] dark:text-[#fff4ec]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-14 sm:px-8 lg:grid-cols-4 lg:px-10">
        <div>
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-[#FF6B00]"
          >
            TinkHubb
          </Link>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-bold tracking-[0.18em] text-[#451900] dark:text-[#ffede2]">
            PLAY
          </h3>

          <div className="flex flex-col gap-3">
            {playLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-[#765646] transition-colors hover:text-[#FF6B00] dark:text-[#cdb8aa] dark:hover:text-[#FF6B00]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-bold tracking-[0.18em] text-[#451900] dark:text-[#ffede2]">
            LEARN
          </h3>

          <div className="flex flex-col gap-3">
            {learnLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-[#765646] transition-colors hover:text-[#FF6B00] dark:text-[#cdb8aa] dark:hover:text-[#FF6B00]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-bold tracking-[0.18em] text-[#451900] dark:text-[#ffede2]">
            FOLLOW US
          </h3>

          <div className="flex flex-col gap-3">
            {socialLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-[#765646] transition-colors hover:text-[#FF6B00] dark:text-[#cdb8aa] dark:hover:text-[#FF6B00]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#f1ddd0] px-6 py-6 text-center text-xs text-[#8b6d5d] dark:border-[#3a2923] dark:text-[#a99386]">
        © 2026 TinkHubb. All rights reserved.
      </div>
    </footer>
  );
}

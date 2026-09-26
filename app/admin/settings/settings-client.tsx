"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import AdminShell from "@/components/admin/admin-shell";
import AdminTeamTab from "./admin-team-tab";

type Tab = "profile" | "game" | "notifications" | "team" | "security";

type SettingsData = {
  profile: {
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
  };

  gameDefaults: {
    questionsPerSession: number;
    totalTimeSeconds: number;
    pointsPerCorrectAnswer: number;
    randomizeQuestions: boolean;
  };

  notifications: {
    notifySuspiciousActivity: boolean;
    notifyWeeklySummary: boolean;
    notifyStreakMilestones: boolean;
    notifyAdminActivity: boolean;
  };

  security: {
    twoFactorEnabled: boolean;
    sessions: {
      id: string;
      createdAt: string;
      lastUsedAt: string;
      expiresAt: string;
    }[];
  };
};

const tabs: { key: Tab; label: string }[] = [
  { key: "profile", label: "My Profile" },
  { key: "game", label: "Game Defaults" },
  { key: "notifications", label: "Notifications" },
  { key: "team", label: "Admin Team" },
  { key: "security", label: "Security" },
];

export default function SettingsClient({
  adminName,
  adminEmail,
  adminRole,
}: {
  adminName: string;
  adminEmail: string;
  adminRole: string;
}) {
  const [tab, setTab] = useState<Tab>("profile");
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/settings", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Unable to load settings.",
        );
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function save(section: string, sectionData: unknown) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section,
          data: sectionData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Unable to save settings.",
        );
      }

      setMessage(result.message || "Settings saved successfully.");
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    setMessage("");
    setError("");
  }

  return (
    <AdminShell
      adminName={adminName}
      adminEmail={adminEmail}
      adminRole={adminRole}
      active="settings"
    >
      <main className="min-h-[calc(100vh-64px)] bg-[#f5f6f8] px-4 py-5 text-[#171717] sm:px-5 sm:py-6 md:px-7 md:py-7 dark:bg-[#15120f] dark:text-[#fff4ec]">
        <div className="mx-auto max-w-[1280px]">
          <header>
            <h1 className="text-[23px] font-bold tracking-[-0.04em] sm:text-[25px]">
              Admin Settings
            </h1>

            <p className="mt-1 text-[10px] text-[#777b80] sm:text-[11px] dark:text-[#a99d96]">
              Platform configuration, team access and security.
            </p>
          </header>

          {message && (
            <div className="mt-5 flex min-h-10 items-center gap-2 rounded-[6px] border border-[#b9e2cc] bg-[#f0fff6] px-3.5 py-2.5 text-[10px] text-[#167044] dark:border-[#284c38] dark:bg-[#17251d] dark:text-[#8ce0ae]">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-[6px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[10px] leading-4 text-red-700 dark:border-[#5a3028] dark:bg-[#291a17] dark:text-[#ffb4a8]">
              {error}
            </div>
          )}

          <div className="mt-5 grid gap-4 lg:mt-6 lg:grid-cols-[225px_minmax(0,1fr)] lg:gap-5">
            {/* Settings navigation */}
            <aside className="h-fit overflow-hidden rounded-[7px] border border-[#e6e7e9] bg-white p-2 dark:border-[#342a24] dark:bg-[#1b1714]">
              <nav
                aria-label="Settings sections"
                className="flex gap-1 overflow-x-auto lg:block lg:overflow-visible"
              >
                {tabs.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => selectTab(item.key)}
                    className={[
                      "min-h-[38px] shrink-0 rounded-[5px] px-3.5 text-left text-[10px] font-semibold transition-colors lg:block lg:w-full",
                      tab === item.key
                        ? "bg-[#fff0e5] text-[#ff6b00] dark:bg-[#4a2818] dark:text-[#ffb27a]"
                        : "text-[#777b80] hover:bg-[#f7f7f8] dark:text-[#bdb0a8] dark:hover:bg-[#29201b]",
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <section className="min-w-0">
              {loading || !data ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-[7px] border border-[#e6e7e9] bg-white dark:border-[#342a24] dark:bg-[#1b1714]">
                  <Loader2 size={22} className="animate-spin text-[#ff6b00]" />
                </div>
              ) : (
                <>
                  {tab === "profile" && (
                    <ProfileTab data={data} saving={saving} save={save} />
                  )}

                  {tab === "game" && (
                    <GameTab data={data} saving={saving} save={save} />
                  )}

                  {tab === "notifications" && (
                    <NotificationsTab data={data} saving={saving} save={save} />
                  )}

                  {tab === "team" && (
                    <AdminTeamTab
                      onMessage={(nextMessage) => {
                        setMessage(nextMessage);
                        setError("");
                      }}
                      onError={(nextError) => {
                        setError(nextError);
                        if (nextError) {
                          setMessage("");
                        }
                      }}
                    />
                  )}

                  {tab === "security" && (
                    <SecurityTab data={data} saving={saving} save={save} />
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </AdminShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[7px] border border-[#e6e7e9] bg-white p-5 sm:p-6 dark:border-[#342a24] dark:bg-[#1b1714]">
      {children}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="text-[14px] font-bold tracking-[-0.02em]">{title}</h2>

      <p className="mt-1 text-[10px] leading-4 text-[#8a8d91] dark:text-[#9e9189]">
        {subtitle}
      </p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
  placeholder,
  min,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  min?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-semibold text-[#55585d] dark:text-[#bdb0a8]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        min={min}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-10 w-full rounded-[4px] border border-[#e5e6e8] bg-[#f7f7f7] px-3 text-[10px] outline-none transition placeholder:text-[#a7a9ad] focus:border-[#ff6b00] disabled:cursor-not-allowed disabled:opacity-70 dark:border-[#40352e] dark:bg-[#241e1a] dark:text-[#fff4ec] dark:placeholder:text-[#756a63]"
      />
    </label>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-semibold text-[#55585d] dark:text-[#bdb0a8]">
        {label}
      </span>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          placeholder="Enter password"
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-[4px] border border-[#e5e6e8] bg-[#f7f7f7] px-3 pr-10 text-[10px] outline-none transition focus:border-[#ff6b00] dark:border-[#40352e] dark:bg-[#241e1a] dark:text-[#fff4ec]"
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[4px] text-[#8a8d91] transition-colors hover:bg-[#eeeeef] hover:text-[#55585d] dark:text-[#9e9189] dark:hover:bg-[#302721] dark:hover:text-[#fff4ec]"
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </label>
  );
}

function SaveButton({
  saving,
  onClick,
  label = "Save Changes",
}: {
  saving: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="mt-5 inline-flex h-10 min-w-[104px] items-center justify-center rounded-[4px] bg-[#ff6b00] px-5 text-[10px] font-semibold text-white transition-colors hover:bg-[#e96000] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? (
        <>
          <Loader2 size={13} className="mr-1.5 animate-spin" />
          Saving...
        </>
      ) : (
        label
      )}
    </button>
  );
}

function ProfileTab({
  data,
  saving,
  save,
}: {
  data: SettingsData;
  saving: boolean;
  save: (section: string, sectionData: unknown) => Promise<void>;
}) {
  const [name, setName] = useState(data.profile.name);
  const [email, setEmail] = useState(data.profile.email);
  const [phone, setPhone] = useState(data.profile.phoneNumber);

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AD";

  return (
    <Card>
      <SectionTitle
        title="My Profile"
        subtitle="This is how it will appear across the admin console."
      />

      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0e5] text-[11px] font-bold text-[#ff6b00] dark:bg-[#35231a] dark:text-[#ffb27a]">
          {initials}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold">{name}</p>

          <span className="mt-1 inline-block rounded-[4px] bg-[#fff0e5] px-2 py-1 text-[8px] font-semibold capitalize text-[#ff6b00] dark:bg-[#35231a] dark:text-[#ffb27a]">
            {data.profile.role.replaceAll("_", " ")}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Input label="Full Name" value={name} onChange={setName} />

        <Input
          label="Email Address"
          value={email}
          onChange={setEmail}
          type="email"
        />

        <Input label="Phone Number" value={phone} onChange={setPhone} />

        <Input
          label="Role"
          value={data.profile.role.replaceAll("_", " ")}
          disabled
        />
      </div>

      <SaveButton
        saving={saving}
        onClick={() =>
          void save("profile", {
            name,
            email,
            phoneNumber: phone,
          })
        }
      />
    </Card>
  );
}

function GameTab({
  data,
  saving,
  save,
}: {
  data: SettingsData;
  saving: boolean;
  save: (section: string, sectionData: unknown) => Promise<void>;
}) {
  const [questions, setQuestions] = useState(
    data.gameDefaults.questionsPerSession,
  );

  const [timerPerQuestion, setTimerPerQuestion] = useState(() => {
    const questionCount = Math.max(1, data.gameDefaults.questionsPerSession);

    return Math.max(
      1,
      Math.round(data.gameDefaults.totalTimeSeconds / questionCount),
    );
  });

  const [points, setPoints] = useState(
    data.gameDefaults.pointsPerCorrectAnswer,
  );

  const [randomize, setRandomize] = useState(
    data.gameDefaults.randomizeQuestions,
  );

  function saveGameDefaults() {
    const safeQuestions = Math.max(1, questions);
    const safeTimer = Math.max(1, timerPerQuestion);
    const safePoints = Math.max(0, points);

    void save("gameDefaults", {
      questionsPerSession: safeQuestions,
      totalTimeSeconds: safeQuestions * safeTimer,
      pointsPerCorrectAnswer: safePoints,
      randomizeQuestions: randomize,
    });
  }

  return (
    <Card>
      <SectionTitle
        title="Session structure"
        subtitle="Defaults applied to every new quiz session."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Input
          label="Questions Per Session"
          value={String(questions)}
          onChange={(value) => setQuestions(Math.max(1, Number(value) || 1))}
          type="number"
          min={1}
        />

        <Input
          label="Default timer per question (seconds)"
          value={String(timerPerQuestion)}
          onChange={(value) =>
            setTimerPerQuestion(Math.max(1, Number(value) || 1))
          }
          type="number"
          min={1}
        />
      </div>

      <div className="mt-4">
        <Input
          label="Points per correct answer"
          value={String(points)}
          onChange={(value) => setPoints(Math.max(0, Number(value) || 0))}
          type="number"
          min={0}
        />
      </div>

      <SaveButton saving={saving} onClick={saveGameDefaults} />

      <div className="mt-7 flex flex-col gap-4 border-t border-[#eeeeef] pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-5 dark:border-[#342a24]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold">Randomize questions</p>

          <p className="mt-1 max-w-[560px] text-[9px] leading-4 text-[#8a8d91] dark:text-[#9e9189]">
            Shuffle question order so gameplay stays fresh across sessions, per
            the platform&apos;s fairness rules.
          </p>
        </div>

        <Toggle
          checked={randomize}
          onChange={() => setRandomize((current) => !current)}
        />
      </div>
    </Card>
  );
}

function NotificationsTab({
  data,
  saving,
  save,
}: {
  data: SettingsData;
  saving: boolean;
  save: (section: string, sectionData: unknown) => Promise<void>;
}) {
  const [preferences, setPreferences] = useState(data.notifications);

  function toggle(key: keyof typeof preferences) {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  const items = [
    {
      key: "notifySuspiciousActivity" as const,
      title: "Suspicious activity alerts",
      description:
        "Get notified when the system flags unusual answer timing or scoring patterns.",
    },
    {
      key: "notifyWeeklySummary" as const,
      title: "Weekly performance summary",
      description:
        "A digest of users, games played, and engagement trends every Monday.",
    },
    {
      key: "notifyStreakMilestones" as const,
      title: "Streak milestone notifications",
      description:
        "Alerts when a large number of users hit 7, 14, or 30-day streaks at once.",
    },
    {
      key: "notifyAdminActivity" as const,
      title: "Admin team activity",
      description:
        "Notify me when a new admin is invited, joins, or is removed from the console.",
    },
  ];

  return (
    <Card>
      <SectionTitle
        title="Notification preferences"
        subtitle={`Sent to ${data.profile.email}`}
      />

      <div className="mt-5">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 border-b border-[#eeeeef] py-5 last:border-b-0 dark:border-[#342a24]"
          >
            <div className="min-w-0 pr-2">
              <p className="text-[11px] font-semibold">{item.title}</p>

              <p className="mt-1 max-w-[600px] text-[9px] leading-4 text-[#8a8d91] dark:text-[#9e9189]">
                {item.description}
              </p>
            </div>

            <Toggle
              checked={preferences[item.key]}
              onChange={() => toggle(item.key)}
            />
          </div>
        ))}
      </div>

      <SaveButton
        saving={saving}
        onClick={() => void save("notifications", preferences)}
      />
    </Card>
  );
}

function SecurityTab({
  data,
  saving,
  save,
}: {
  data: SettingsData;
  saving: boolean;
  save: (section: string, sectionData: unknown) => Promise<void>;
}) {
  const [twoFactor, setTwoFactor] = useState(data.security.twoFactorEnabled);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle
          title="Password"
          subtitle="Update the password used to access the admin console."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <PasswordInput
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />

          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
          />
        </div>

        <SaveButton
          saving={saving}
          label="Update password"
          onClick={() =>
            void save("password", {
              currentPassword,
              newPassword,
            })
          }
        />
      </Card>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="flex min-w-0 items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#ff6b00]" />

            <div className="min-w-0">
              <p className="text-[11px] font-semibold">
                Two-factor authentication
              </p>

              <p className="mt-1 max-w-[600px] text-[9px] leading-4 text-[#8a8d91] dark:text-[#9e9189]">
                Add an additional verification step when signing in to the admin
                console.
              </p>
            </div>
          </div>

          <Toggle
            checked={twoFactor}
            onChange={() => {
              const next = !twoFactor;
              setTwoFactor(next);

              void save("security", {
                twoFactorEnabled: next,
              });
            }}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Active sessions"
          subtitle="Devices currently signed in to this admin account."
        />

        <div className="mt-4 overflow-hidden rounded-[5px] border border-[#eeeeef] dark:border-[#342a24]">
          {data.security.sessions.map((session, index) => (
            <div
              key={session.id}
              className="flex items-center justify-between gap-4 border-b border-[#eeeeef] px-3.5 py-4 last:border-b-0 sm:px-4 dark:border-[#342a24]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    index === 0
                      ? "bg-[#fff0e5] text-[#ff6b00] dark:bg-[#35231a] dark:text-[#ffb27a]"
                      : "bg-[#f4f4f5] text-[#8a8d91] dark:bg-[#29221e] dark:text-[#a99d96]",
                  ].join(" ")}
                >
                  {index === 0 ? (
                    <Smartphone size={15} />
                  ) : (
                    <LockKeyhole size={15} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold">
                    Admin browser session
                  </p>

                  <p className="mt-1 text-[8px] text-[#8a8d91] dark:text-[#9e9189]">
                    Last active {formatDate(session.lastUsedAt)}
                  </p>
                </div>
              </div>

              {index === 0 && (
                <span className="shrink-0 rounded-full bg-[#e8f8ef] px-2 py-1 text-[8px] font-semibold text-[#167044] dark:bg-[#17251d] dark:text-[#8ce0ae]">
                  This device
                </span>
              )}
            </div>
          ))}

          {data.security.sessions.length === 0 && (
            <div className="py-8 text-center text-[10px] text-[#8a8d91] dark:text-[#9e9189]">
              No active sessions found.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={[
        "relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20",
        checked ? "bg-[#ff6b00]" : "bg-[#d4d5d7] dark:bg-[#51463f]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-[left]",
          checked ? "left-[18px]" : "left-[3px]",
        ].join(" ")}
      />
    </button>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

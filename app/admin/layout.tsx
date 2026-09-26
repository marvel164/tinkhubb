import type { ReactNode } from "react";

const adminThemeScript = `
(function () {
  try {
    var theme = localStorage.getItem("tinkhupp-admin-theme");

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (error) {
    document.documentElement.classList.remove("dark");
  }
})();
`;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: adminThemeScript,
        }}
      />
      {children}
    </>
  );
}

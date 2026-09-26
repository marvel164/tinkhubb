"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnTo = searchParams.get("returnTo") || "/";

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to continue. Please try again.");
        return;
      }

      router.replace(returnTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      {/* KEEP THE EXISTING REGISTER PAGE UI HERE */}
      {/* The only required auth-flow change is the successful submit behavior above. */}

      <form onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username"
          required
        />

        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone number"
          required
        />

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}

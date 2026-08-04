"use client";

import { useState, type FormEvent } from "react";

import styles from "./enter.module.css";

/**
 * The gate's only interactive part. On success it reloads rather than routing:
 * the middleware rewrote this page over whatever URL the visitor actually asked
 * for, so a reload re-runs the gate and lands them where they were going.
 */
export default function PasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/site-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        window.location.reload();
        return;
      }

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "That password is not right.");
      setBusy(false);
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.label} htmlFor="site-password">
        Password
      </label>
      <input
        id="site-password"
        className={styles.input}
        type="password"
        name="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={error !== null}
        aria-describedby={error ? "site-password-error" : undefined}
      />
      {error && (
        <p id="site-password-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={styles.submit} disabled={busy || password.length === 0}>
        {busy ? "Checking…" : "Open the book"}
      </button>
    </form>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Globe2, LockKeyhole } from "lucide-react";
import { authClient } from "@/lib/auth-client";
export function AuthForm({ mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === "sign-up";
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
          })
        : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError(
          "We couldn’t complete that request. Check your details and try again.",
        );
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("We couldn’t complete that request. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-title">
        <Link className="auth-back" href="/" aria-label="Back to Flag Frenzy">
          <ArrowLeft /> Back to the arcade
        </Link>
        <Link className="auth-brand" href="/" aria-label="Flag Frenzy home">
          <span>
            <Globe2 />
          </span>{" "}
          FLAG FRENZY
        </Link>
        <div className="auth-copy">
          <span className="eyebrow">YOUR NEXT EXPEDITION</span>
          <h1 id="auth-title">
            {isSignUp ? "Join the explorers." : "Good to see you."}
          </h1>
          <p>
            {isSignUp
              ? "Create an account and make this corner of the world yours."
              : "Sign in to pick up where your curiosity left off."}
          </p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <label htmlFor="name">
              Name
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}
          <label htmlFor="email">
            Email address
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label htmlFor="password">
            Password
            <span className="password-hint">
              {isSignUp ? "At least 12 characters" : ""}
            </span>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "ONE MOMENT…" : isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}
            {!loading && <ArrowRight />}
          </button>
        </form>
        <p className="auth-switch">
          {isSignUp ? "Already exploring with us?" : "New to the arcade?"}{" "}
          <Link href={isSignUp ? "/sign-in" : "/sign-up"}>
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
        <p className="auth-security">
          <LockKeyhole /> Your password is encrypted and never stored in plain
          text.
        </p>
      </section>
      <aside className="auth-art" aria-hidden="true">
        <div className="auth-orbit auth-orbit-one" />
        <div className="auth-orbit auth-orbit-two" />
        <div className="auth-art-copy">
          <span>THE WORLD IS WAITING</span>
          <strong>
            One flag
            <br />
            at a time.
          </strong>
          <i>36 countries. Endless curiosity.</i>
        </div>
        <div className="auth-stamp">
          EST.
          <br />
          <b>2024</b>
        </div>
      </aside>
    </main>
  );
}

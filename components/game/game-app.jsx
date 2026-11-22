"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  Clock3,
  Flag,
  Home,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { countries, defaultStats, modes, pick, shuffle } from "./data";
import { FlagArt, FlagFrame } from "./flag-art";
import { DrawingBoard } from "./drawing-board";
export default function Page() {
  const { data: authSession } = authClient.useSession();
  const [screen, setScreen] = useState("home"),
    [mode, setMode] = useState("classic"),
    [country, setCountry] = useState(countries[0]),
    [choices, setChoices] = useState([]),
    [seen, setSeen] = useState([]),
    [question, setQuestion] = useState(1),
    [score, setScore] = useState(0),
    [streak, setStreak] = useState(0),
    [correct, setCorrect] = useState(0),
    [selected, setSelected] = useState(null),
    [seconds, setSeconds] = useState(60),
    [done, setDone] = useState(false),
    [drawScore, setDrawScore] = useState(null),
    [stats, setStats] = useState(defaultStats),
    [settings, setSettings] = useState({
      sound: true,
      music: false,
      animations: true,
      dark: false,
    }),
    [page, setPage] = useState("home");
  const [settingsReady, setSettingsReady] = useState(false);
  const [heroCountries, setHeroCountries] = useState(countries.slice(0, 3));
  useEffect(() => {
    try {
      const s = localStorage.getItem("flag-frenzy-stats");
      if (s) setStats({ ...defaultStats, ...JSON.parse(s) });
      const p = localStorage.getItem("flag-frenzy-settings");
      if (p) setSettings((current) => ({ ...current, ...JSON.parse(p) }));
      else
        setSettings((current) => ({
          ...current,
          dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
        }));
    } catch {}
    setSettingsReady(true);
  }, []);
  useEffect(() => {
    setHeroCountries(shuffle(countries).slice(0, 3));
  }, []);
  useEffect(() => {
    localStorage.setItem("flag-frenzy-stats", JSON.stringify(stats));
  }, [stats]);
  useEffect(() => {
    if (!settingsReady) return;
    localStorage.setItem("flag-frenzy-settings", JSON.stringify(settings));
    document.documentElement.classList.toggle("dark", settings.dark);
  }, [settings, settingsReady]);
  useEffect(() => {
    if (
      screen !== "game" ||
      done ||
      mode === "draw" ||
      (mode === "classic" && selected)
    )
      return;
    const timer = window.setInterval(
      () =>
        setSeconds((s) => {
          if (s <= 1) {
            setDone(true);
            return 0;
          }
          return s - 1;
        }),
      1000,
    );
    return () => clearInterval(timer);
  }, [screen, done, mode, selected, question]);
  const start = (id) => {
    setMode(id);
    setScreen("game");
    setQuestion(1);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setSelected(null);
    setDone(false);
    setDrawScore(null);
    setSeconds(id === "hard" ? 30 : 60);
    setSeen([]);
    if (id === "draw") {
      setCountry(pick(countries));
      return;
    }
    nextQuestion([], id);
  };
  const nextQuestion = (old, id = mode) => {
    const pool = countries.filter((c) => !old.includes(c.code));
    const next = pick(pool.length ? pool : countries);
    const distractors = countries.filter(
      (c) => c.code !== next.code && (id !== "hard" || c.difficulty !== "easy"),
    );
    const answers = shuffle([
      next,
      ...Array.from({ length: 3 }, () => {
        const candidate = pick(distractors);
        distractors.splice(distractors.indexOf(candidate), 1);
        return candidate;
      }),
    ]);
    setCountry(next);
    setChoices(answers);
    setSeen([...old, next.code]);
    setSelected(null);
  };
  const answer = (c) => {
    if (selected || done) return;
    setSelected(c.code);
    const right = c.code === country.code,
      nextStreak = right ? streak + 1 : 0,
      points = right
        ? 100 +
          (mode === "hard" ? 100 : 0) +
          Math.max(0, seconds > 0 ? Math.floor(seconds / 6) : 0) +
          (nextStreak >= 3 ? 50 : 0)
        : 0;
    setStreak(nextStreak);
    if (right) {
      setScore((v) => v + points);
      setCorrect((v) => v + 1);
    }
    if (mode === "endless" && !right) {
      setDone(true);
      return;
    }
    if (mode === "classic" && question >= 10) {
      setDone(true);
      return;
    }
    window.setTimeout(() => {
      if (mode === "time" && seconds < 2) {
        setDone(true);
        return;
      }
      setQuestion((q) => q + 1);
      nextQuestion([...seen, country.code]);
    }, 850);
  };
  useEffect(() => {
    if (screen === "game" && done && mode !== "draw") {
      setStats((s) => ({
        games: s.games + 1,
        questions: s.questions + question,
        correct: s.correct + correct,
        best: Math.max(s.best, score),
        streak: Math.max(s.streak, streak),
        timeBest: mode === "time" ? Math.max(s.timeBest, score) : s.timeBest,
        drawBest: s.drawBest,
      }));
    }
  }, [done]);
  const progress =
    mode === "classic"
      ? ((question - 1) / 10) * 100
      : mode === "time"
        ? Math.min(100, ((60 - seconds) / 60) * 100)
        : Math.min(94, streak * 8);
  const home = () => {
    setScreen("home");
    setPage("home");
  };
  const accuracy = stats.questions
    ? Math.round((stats.correct / stats.questions) * 100)
    : 0;
  return (
    <main
      className={`app-shell ${settings.dark ? "theme-dark" : ""} ${settings.animations ? "" : "motion-off"}`}
    >
      <nav className="topbar">
        <button className="brand" onClick={home}>
          <span className="brand-mark">
            <Flag />
          </span>
          <span>
            FLAG<span className="brand-light">FRENZY</span>
            <small>THE WORLD, AT A GLANCE</small>
          </span>
        </button>
        <div className="nav-links">
          <button
            className={screen === "home" ? "nav-active" : ""}
            onClick={home}
          >
            <Home /> PLAY
          </button>
          <button
            className={screen === "stats" ? "nav-active" : ""}
            onClick={() => {
              setPage("stats");
              setScreen("stats");
            }}
          >
            <Trophy /> STATS
          </button>
        </div>
        <div className="top-actions">
          <button
            className="icon-button sound-toggle"
            onClick={() => setSettings({ ...settings, sound: !settings.sound })}
            aria-label={settings.sound ? "Turn sound off" : "Turn sound on"}
          >
            {settings.sound ? <Volume2 /> : <VolumeX />}
          </button>
          <button
            className="icon-button"
            onClick={() => {
              setPage("settings");
              setScreen("settings");
            }}
            aria-label="Settings"
          >
            <Settings />
          </button>
          <div className="account-actions">
            {authSession?.user ? (
              <>
                <span className="account-name">{authSession.user.name}</span>
                <button
                  className="account-link"
                  onClick={async () => {
                    await authClient.signOut();
                    window.location.assign("/");
                  }}
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <>
                <Link className="account-link" href="/sign-in">
                  LOG IN
                </Link>
                <Link className="account-cta" href="/sign-up">
                  SIGN UP
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      {screen === "home" && (
        <div className="home-content">
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow hero-eyebrow">
                <span className="live-dot" /> THE GEOGRAPHY ARCADE
              </div>
              <h1>
                How well do
                <br />
                you know <span>the world?</span>
              </h1>
              <p>
                One globe. Hundreds of flags. How far can your instincts take
                you?
              </p>
              <button className="hero-play" onClick={() => start("classic")}>
                <Play fill="currentColor" /> PLAY CLASSIC{" "}
                <span className="play-arrow">
                  <ArrowRight />
                </span>
              </button>
              <div className="hero-note">
                <span className="hero-note-line" /> No maps. No hints. Just you
                and the flags.
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="hero-stamp">
                EST.
                <br />
                <b>2024</b>
              </div>
              {heroCountries.map((heroCountry, index) => (
                <FlagFrame
                  key={heroCountry.code}
                  country={heroCountry}
                  className={`hero-flag ${["flag-brazil", "flag-japan", "flag-france"][index]}`}
                />
              ))}
              <div className="hero-coordinates">
                51°30&apos;26.4&quot;N
                <br />
                00°07&apos;39.0&quot;W
              </div>
              <div className="hero-caption">
                A WORLD OF
                <br />
                <b>POSSIBILITY</b>
              </div>
            </div>
            <div className="hero-side-index">
              01 — 05&nbsp;&nbsp; / &nbsp;&nbsp; THE DAILY RUN
            </div>
          </section>
          <section className="mode-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">CHOOSE YOUR TERRAIN</span>
                <h2>
                  Pick a challenge<span>.</span>
                </h2>
              </div>
              <span className="mode-count">05 MODES / ONE GLOBE</span>
            </div>
            <div className="mode-grid">
              {modes.map((m, i) => (
                <button
                  key={m.id}
                  className={`mode-card mode-${m.color}`}
                  onClick={() => start(m.id)}
                >
                  <div className="mode-card-top">
                    <span className="mode-number">0{i + 1} / 05</span>
                    <span className="mode-icon">
                      <m.icon />
                    </span>
                  </div>
                  <div className="mode-card-copy">
                    <span className="mode-tag">{m.tag}</span>
                    <h3>{m.name}</h3>
                    <p>{m.detail}</p>
                  </div>
                  <span className="mode-arrow">
                    <ArrowRight />
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="stats-strip">
            <div className="stats-intro">
              <span className="eyebrow">YOUR EXPEDITION</span>
              <h2>
                Every flag
                <br />
                leaves a mark.
              </h2>
              <button
                onClick={() => {
                  setPage("stats");
                  setScreen("stats");
                }}
              >
                VIEW FULL STATS <ArrowRight />
              </button>
            </div>
            <div className="stat-cell">
              <span>BEST SCORE</span>
              <strong>{stats.best.toLocaleString()}</strong>
              <small>PTS · ALL MODES</small>
            </div>
            <div className="stat-cell">
              <span>BEST STREAK</span>
              <strong>
                {stats.streak}
                <i>×</i>
              </strong>
              <small>FLAGS IN A ROW</small>
            </div>
            <div className="stat-cell">
              <span>GAMES PLAYED</span>
              <strong>{stats.games.toString().padStart(2, "0")}</strong>
              <small>AND COUNTING</small>
            </div>
            <div className="stat-cell">
              <span>ACCURACY</span>
              <strong>
                {accuracy}
                <i>%</i>
              </strong>
              <small>{stats.correct} CORRECT ANSWERS</small>
            </div>
          </section>
          <footer className="site-footer">
            <span>FLAG FRENZY © 2024</span>
            <span>MADE FOR THE CURIOUS, EVERYWHERE.</span>
            <button
              onClick={() => {
                setPage("settings");
                setScreen("settings");
              }}
            >
              SETTINGS <Settings />
            </button>
          </footer>
        </div>
      )}
      {screen === "game" && mode === "draw" && (
        <DrawingBoard
          country={country}
          onExit={home}
          onResult={(value) => {
            setDrawScore(value);
            setStats((s) => ({
              ...s,
              games: s.games + 1,
              drawBest: Math.max(s.drawBest, value),
            }));
          }}
        />
      )}
      {screen === "game" && mode !== "draw" && (
        <section className="quiz-screen">
          {!done ? (
            <>
              <div className="quiz-head">
                <button className="back-link" onClick={home}>
                  <ArrowLeft /> EXIT RUN
                </button>
                <span className="eyebrow">
                  {mode === "classic"
                    ? "CLASSIC QUIZ"
                    : mode === "time"
                      ? "TIME ATTACK"
                      : mode === "endless"
                        ? "ENDLESS RUN"
                        : "HARD MODE"}{" "}
                  <span className="mode-separator">/</span>{" "}
                  {mode === "classic"
                    ? `QUESTION ${String(question).padStart(2, "0")} OF 10`
                    : `QUESTION ${String(question).padStart(2, "0")}`}
                </span>
                <div className="quiz-score">
                  <span>SCORE</span>
                  <strong>{score.toLocaleString()}</strong>
                </div>
              </div>
              <div className="progress-track">
                <div style={{ width: `${progress}%` }} />
              </div>
              <div className="quiz-main">
                <div className="quiz-prompt">
                  <span className="eyebrow">IDENTIFY THIS FLAG</span>
                  <h1>
                    Where in the
                    <br />
                    world is this?
                  </h1>
                  <p>Choose the country this flag belongs to.</p>
                  <div className="streak-badge">
                    <Sparkles />
                    <span>STREAK</span>
                    <b>{streak}</b>
                  </div>
                </div>
                <div className="quiz-challenge">
                  <div className="flag-panel">
                    <span>
                      FLAG NO. {String(question).padStart(2, "0")}{" "}
                      <span>·</span> {country.difficulty.toUpperCase()}
                    </span>
                    <FlagFrame
                      key={country.code}
                      className="quiz-flag-frame"
                      country={country}
                    />
                    <small>ONE FLAG, FOUR POSSIBILITIES</small>
                  </div>
                  <div className="answer-grid">
                    {choices.map((c, i) => (
                      <button
                        key={c.code}
                        className={`answer-option ${selected === c.code ? (c.code === country.code ? "is-correct" : "is-wrong") : selected && c.code === country.code ? "show-correct" : ""}`}
                        onClick={() => answer(c)}
                        disabled={!!selected}
                      >
                        <span className="answer-letter">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{c.name}</span>
                        {selected && c.code === country.code && <Check />}
                        {selected === c.code && c.code !== country.code && (
                          <X />
                        )}
                      </button>
                    ))}
                  </div>
                  {selected && (
                    <div
                      className={`answer-feedback ${selected === country.code ? "feedback-right" : "feedback-wrong"}`}
                    >
                      {selected === country.code
                        ? "EXCELLENT. THAT’S THE ONE."
                        : `NOT QUITE — THAT WAS ${country.name.toUpperCase()}.`}
                    </div>
                  )}
                </div>
              </div>
              <div className="quiz-foot">
                <span>
                  <span className="live-dot" /> YOUR RUN IS IN PROGRESS
                </span>
                <div className={`timer ${seconds <= 10 ? "timer-low" : ""}`}>
                  <Clock3 />
                  <span>
                    {mode === "classic"
                      ? "UNTIMED"
                      : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
                  </span>
                </div>
                <span>NO PENALTY FOR A GUESS</span>
              </div>
            </>
          ) : (
            <div className="results-screen">
              <span className="eyebrow">
                {mode === "endless" ? "RUN COMPLETE" : "ROUND COMPLETE"} / FLAG
                FRENZY
              </span>
              <div className="results-icon">
                <Award />
              </div>
              <h1>
                {score > 700
                  ? "World class."
                  : score > 350
                    ? "Nicely traveled."
                    : "The world awaits."}
              </h1>
              <p>
                You spotted <b>{correct}</b> of {question} flags. Keep
                exploring.
              </p>
              <div className="result-stats">
                <div>
                  <span>FINAL SCORE</span>
                  <strong>{score.toLocaleString()}</strong>
                </div>
                <div>
                  <span>ACCURACY</span>
                  <strong>
                    {question ? Math.round((correct / question) * 100) : 0}
                    <i>%</i>
                  </strong>
                </div>
                <div>
                  <span>BEST STREAK</span>
                  <strong>{streak}</strong>
                </div>
              </div>
              <div className="result-actions">
                <button className="hero-play" onClick={() => start(mode)}>
                  <RotateCw /> PLAY AGAIN{" "}
                  <span className="play-arrow">
                    <ArrowRight />
                  </span>
                </button>
                <button className="secondary-action" onClick={home}>
                  BACK TO BASE <Home />
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      {screen === "stats" && (
        <section className="interior-page">
          <button className="back-link" onClick={home}>
            <ArrowLeft /> BACK TO BASE
          </button>
          <span className="eyebrow">YOUR FIELD RECORD</span>
          <h1>
            Every flag
            <br />
            leaves a mark<span>.</span>
          </h1>
          <p className="interior-lead">
            A running log of everywhere your curiosity has taken you.
          </p>
          <div className="stats-page-grid">
            {[
              { label: "GAMES PLAYED", value: stats.games },
              { label: "QUESTIONS ANSWERED", value: stats.questions },
              { label: "CORRECT ANSWERS", value: stats.correct },
              {
                label: "INCORRECT ANSWERS",
                value: stats.questions - stats.correct,
              },
              { label: "OVERALL ACCURACY", value: `${accuracy}%` },
              { label: "HIGHEST SCORE", value: stats.best.toLocaleString() },
              { label: "LONGEST STREAK", value: stats.streak },
              {
                label: "TIME ATTACK BEST",
                value: stats.timeBest.toLocaleString(),
              },
              { label: "DRAWING BEST", value: `${stats.drawBest}%` },
            ].map((s) => (
              <div className="stat-page-card" key={s.label}>
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </div>
            ))}
          </div>
          <div className="achievement-section">
            <span className="eyebrow">MILESTONES / COMING INTO VIEW</span>
            <h2>Achievements</h2>
            <div className="achievement-grid">
              {[
                {
                  title: "First Win",
                  desc: "Get your first answer right.",
                  ok: stats.correct > 0,
                },
                {
                  title: "Perfect Round",
                  desc: "Answer ten flags correctly.",
                  ok: stats.correct >= 10,
                },
                {
                  title: "Flag Expert",
                  desc: "Identify 100 flags.",
                  ok: stats.correct >= 100,
                },
                {
                  title: "Drawing Pro",
                  desc: "Score 80% in a draw.",
                  ok: stats.drawBest >= 80,
                },
                {
                  title: "World Explorer",
                  desc: "Play five games.",
                  ok: stats.games >= 5,
                },
                {
                  title: "Streak Master",
                  desc: "Build a streak of ten.",
                  ok: stats.streak >= 10,
                },
              ].map((a, i) => (
                <div
                  className={`achievement ${a.ok ? "unlocked" : ""}`}
                  key={a.title}
                >
                  <div className="achievement-icon">
                    <Award />
                  </div>
                  <div>
                    <b>{a.title}</b>
                    <p>{a.desc}</p>
                  </div>
                  <span>{a.ok ? "UNLOCKED" : `0${i + 1}`}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {screen === "settings" && (
        <section className="interior-page settings-page">
          <button className="back-link" onClick={home}>
            <ArrowLeft /> BACK TO BASE
          </button>
          <span className="eyebrow">TUNE YOUR EXPEDITION</span>
          <h1>
            Game
            <br />
            settings<span>.</span>
          </h1>
          <p className="interior-lead">Make your next trip feel like yours.</p>
          <div className="settings-list">
            {[
              {
                key: "sound",
                label: "Sound effects",
                desc: "Feedback for every guess and milestone.",
                icon: Volume2,
              },
              {
                key: "music",
                label: "Background music",
                desc: "A little soundtrack for the long way around.",
                icon: Volume2,
              },
              {
                key: "animations",
                label: "Motion",
                desc: "Subtle transitions and game feedback.",
                icon: Sparkles,
              },
              {
                key: "dark",
                label: "Dark appearance",
                desc: "A night-sky palette for late-night exploring.",
                icon: Flag,
              },
            ].map((item) => (
              <div className="setting-row" key={item.key}>
                <div className="setting-icon">
                  <item.icon />
                </div>
                <div>
                  <b>{item.label}</b>
                  <p>{item.desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={settings[item.key]}
                  className={`switch ${settings[item.key] ? "on" : ""}`}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      [item.key]: !settings[item.key],
                    })
                  }
                >
                  <span />
                </button>
              </div>
            ))}
          </div>
          <button
            className="reset-button"
            onClick={() => {
              if (window.confirm("Reset all your stats and achievements?")) {
                setStats(defaultStats);
                localStorage.removeItem("flag-frenzy-stats");
              }
            }}
          >
            <RotateCcw /> RESET ALL STATISTICS
          </button>
        </section>
      )}
    </main>
  );
}

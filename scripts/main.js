(() => {
  const { countries, defaultStats, flagSrc } = window.FlagFrenzyData;
  const main = document.querySelector("#app-main");
  const themeNames = ["clay", "forest", "ocean", "berry", "midnight"];
  const themeLabels = { clay: "Clay", forest: "Forest", ocean: "Ocean", berry: "Berry", midnight: "Midnight" };
  const modes = [
    { id: "classic", title: "Classic quiz", tag: "10 QUESTIONS", desc: "10 flags. One perfect round.", icon: "01" },
    { id: "time", title: "Time attack", tag: "60 SECONDS", desc: "How many can you name in 60 seconds?", icon: "60" },
    { id: "endless", title: "Endless", tag: "UNTIL YOU MISS", desc: "One wrong answer ends the run.", icon: "03" },
    { id: "hard", title: "Hard mode", tag: "EXPERT", desc: "Closer calls. Less time. Bigger points.", icon: "EX" },
    { id: "draw", title: "Draw the flag", tag: "CREATIVE", desc: "Recreate a flag from memory.", icon: "DR" },
  ];
  const readStored = (key, fallback) => {
    try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || "{}") }; } catch { return { ...fallback }; }
  };
  let stats = readStored("flag-frenzy-stats", defaultStats);
  let settings = readStored("flag-frenzy-settings", { theme: "clay", sound: true });
  if (!themeNames.includes(settings.theme)) settings.theme = "clay";
  let screen = "home";
  let mode = "classic";
  let country = countries[0];
  let choices = [];
  let seen = [];
  let question = 1;
  let score = 0;
  let streak = 0;
  let correct = 0;
  let selected = null;
  let seconds = 60;
  let done = false;
  let interval = null;
  let drawState = null;
  let globe = null;
  let globeResize = null;
  const save = () => {
    try {
      localStorage.setItem("flag-frenzy-stats", JSON.stringify(stats));
      localStorage.setItem("flag-frenzy-settings", JSON.stringify(settings));
    } catch {}
  };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const randomFrom = (items) => items[Math.floor(Math.random() * items.length)];
  const shuffled = (items) => [...items].sort(() => Math.random() - 0.5);
  const accuracy = () => stats.questions ? Math.round(stats.correct / stats.questions * 100) : 0;
  const formatTime = (totalSeconds) => `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
  const destroyGlobe = () => { if (globeResize) globeResize.disconnect(); globeResize = null; globe = null; };
  const home = () => { clearInterval(interval); destroyGlobe(); screen = "home"; updateNav(); renderHome(); };
  const updateNav = () => {
    document.querySelectorAll(".nav-link").forEach((button) => button.classList.remove("is-active"));
    document.querySelector(`#${screen === "stats" ? "stats-nav" : "play-nav"}`)?.classList.add("is-active");
  };
  const setTheme = (theme) => {
    if (!themeNames.includes(theme)) return;
    settings.theme = theme;
    document.documentElement.dataset.theme = theme;
    save();
    document.querySelectorAll(".theme-option").forEach((button) => {
      const active = button.dataset.theme === theme;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };
  document.documentElement.dataset.theme = settings.theme;
  document.querySelector("#home-button").addEventListener("click", home);
  document.querySelector("#play-nav").addEventListener("click", home);
  document.querySelector("#stats-nav").addEventListener("click", () => { clearInterval(interval); destroyGlobe(); screen = "stats"; updateNav(); renderStats(); });
  document.querySelector("#settings-nav").addEventListener("click", () => { clearInterval(interval); destroyGlobe(); screen = "settings"; updateNav(); renderSettings(); });

  function renderHome() {
    const heroFlags = shuffled(countries).slice(0, 3);
    main.innerHTML = `
      <div class="home-content">
        <section class="hero">
          <div class="hero-copy">
            <div class="eyebrow"><span class="live-dot"></span> THE GEOGRAPHY ARCADE</div>
            <h1>How well do<br>you know <span>the world?</span></h1>
            <p>One globe. Hundreds of flags. How far can your instincts take you?</p>
            <button class="hero-play" data-start="classic">PLAY CLASSIC <span class="play-arrow">→</span></button>
            <div class="hero-note"><span class="hero-note-line"></span>No maps. No hints. Just you and the flags.</div>
          </div>
          <div class="hero-art" aria-label="A rotating collection of flags">
            <div class="hero-globe" aria-hidden="true"></div>
            ${heroFlags.map((item, index) => `<div class="hero-flag ${["one", "two", "three"][index]}"><img src="${flagSrc(item.code)}" alt="${escapeHtml(item.name)} flag"></div>`).join("")}
            <div class="hero-caption">A WORLD OF<br><b>POSSIBILITY</b></div>
          </div>
          <div class="hero-side-index">01 — 05&nbsp; / &nbsp;THE DAILY RUN</div>
        </section>
        <section class="mode-section">
          <div class="section-heading"><div><span class="eyebrow">CHOOSE YOUR TERRAIN</span><h2>Pick a challenge<span>.</span></h2></div><span class="mode-count eyebrow">05 MODES / ONE GLOBE</span></div>
          <div class="mode-grid">${modes.map((item, index) => `<button class="mode-card" data-start="${item.id}"><div class="mode-card-top"><span>0${index + 1} / 05</span><span class="mode-icon" aria-hidden="true">${item.icon}</span></div><div class="mode-copy"><span class="mode-tag">${item.tag}</span><h3>${item.title}</h3><p>${item.desc}</p></div><span class="mode-arrow" aria-hidden="true">→</span></button>`).join("")}</div>
        </section>
        <section class="stats-strip">
          <div class="stats-intro"><span class="eyebrow">YOUR EXPEDITION</span><h2>Every flag<br>leaves a mark.</h2><button id="full-stats">VIEW FULL STATS →</button></div>
          <div class="stat-cell"><span>BEST SCORE</span><strong>${stats.best.toLocaleString()}</strong><small>PTS · ALL MODES</small></div>
          <div class="stat-cell"><span>BEST STREAK</span><strong>${stats.streak}<i>×</i></strong><small>FLAGS IN A ROW</small></div>
          <div class="stat-cell"><span>GAMES PLAYED</span><strong>${String(stats.games).padStart(2, "0")}</strong><small>AND COUNTING</small></div>
          <div class="stat-cell"><span>ACCURACY</span><strong>${accuracy()}<i>%</i></strong><small>${stats.correct} CORRECT ANSWERS</small></div>
        </section>
        <footer class="site-footer"><span>FLAG FRENZY · LOCAL EDITION</span><span>MADE FOR THE CURIOUS, EVERYWHERE.</span><button id="footer-settings">SETTINGS</button></footer>
      </div>`;
    main.querySelectorAll("[data-start]").forEach((button) => button.addEventListener("click", () => startGame(button.dataset.start)));
    main.querySelector("#full-stats").addEventListener("click", () => { screen = "stats"; updateNav(); renderStats(); });
    main.querySelector("#footer-settings").addEventListener("click", () => { destroyGlobe(); screen = "settings"; updateNav(); renderSettings(); });
  }

  function renderStats() {
    const rows = [
      ["GAMES PLAYED", stats.games], ["QUESTIONS ANSWERED", stats.questions], ["CORRECT ANSWERS", stats.correct],
      ["INCORRECT ANSWERS", Math.max(0, stats.questions - stats.correct)], ["OVERALL ACCURACY", `${accuracy()}%`],
      ["HIGHEST SCORE", stats.best.toLocaleString()], ["LONGEST STREAK", stats.streak],
      ["TIME ATTACK BEST", stats.timeBest.toLocaleString()], ["DRAWING BEST", `${stats.drawBest}%`],
    ];
    main.innerHTML = `<section class="interior-page"><button class="back-link" id="back-home">← BACK TO BASE</button><span class="eyebrow">YOUR FIELD RECORD</span><h1>Every flag<br>leaves a mark<span>.</span></h1><p class="interior-lead">A running log of everywhere your curiosity has taken you. Your stats are saved on this device.</p><div class="stats-page-grid">${rows.map(([label, value]) => `<div class="stat-page-card"><span>${label}</span><strong>${value}</strong></div>`).join("")}</div></section>`;
    main.querySelector("#back-home").addEventListener("click", home);
  }

  function renderSettings() {
    main.innerHTML = `
      <section class="interior-page">
        <button class="back-link" id="back-home">← BACK TO BASE</button>
        <span class="eyebrow">MAKE IT YOURS</span><h1>Choose your<br>view<span>.</span></h1>
        <p class="interior-lead">Pick a palette and spin the globe to explore. Click a country to reveal its name and flag.</p>
        <div class="settings-layout">
          <section class="settings-panel"><h2>Color themes</h2><p class="globe-hint">The palette applies across every game screen.</p><div class="theme-options" role="group" aria-label="Color themes">
            ${themeNames.map((theme) => `<button class="theme-option ${settings.theme === theme ? "active" : ""}" data-theme="${theme}" aria-pressed="${settings.theme === theme}" style="--swatch:${{ clay: "#e9543f", forest: "#2e875d", ocean: "#247ca8", berry: "#a94f79", midnight: "#17231f" }[theme]}"><span class="theme-swatch" aria-hidden="true"></span>${themeLabels[theme]}</button>`).join("")}
          </div></section>
          <section class="settings-panel"><h2>Local play</h2><p class="globe-hint">Your game record and selected theme stay in this browser on this device. Sign-in and cloud sync are not part of the static local edition.</p></section>
          <section class="settings-panel globe-panel"><h2>Explore the world</h2><p class="globe-hint">Drag to spin · scroll to zoom · select any country for its flag.</p>
            <div class="globe-layout"><div class="globe-holder" id="globe-holder"><div class="globe-loading" id="globe-status">Loading country boundaries…</div></div>
              <aside class="globe-detail" id="globe-detail" aria-live="polite"><div class="globe-detail-image" id="country-flag-preview">Select a country</div><h3 id="selected-country-name">Your next discovery</h3><p id="selected-country-region">The globe is yours to explore.</p></aside>
            </div>
          </section>
        </div>
      </section>`;
    main.querySelectorAll(".theme-option").forEach((button) => button.addEventListener("click", () => setTheme(button.dataset.theme)));
    main.querySelector("#back-home").addEventListener("click", home);
    initGlobe();
  }

  function initGlobe() {
    const holder = main.querySelector("#globe-holder");
    if (!holder || !window.d3?.geoOrthographic) {
      const status = main.querySelector("#globe-status");
      if (status) status.textContent = "The interactive globe needs an internet connection to load.";
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.className = "globe-canvas";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Interactive globe. Drag to rotate and click a country to select it.");
    const status = holder.querySelector("#globe-status");
    holder.insertBefore(canvas, status);
    const context = canvas.getContext("2d");
    const projection = window.d3.geoOrthographic().rotate([-18, -20, 0]).clipAngle(90).precision(0.45);
    const path = window.d3.geoPath(projection, context);
    globe = { canvas, context, projection, path, features: [], selectedFeature: null, drag: null, render: null };
    globe.render = () => {
      if (!canvas.isConnected) return;
      const width = holder.clientWidth;
      const height = holder.clientHeight;
      const ratio = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      projection.translate([width / 2, height / 2]).scale(Math.min(width, height) * 0.43);
      const radius = Math.min(width, height) * 0.43;
      const glow = context.createRadialGradient(width * 0.38, height * 0.31, radius * 0.08, width * 0.5, height * 0.5, radius * 1.15);
      glow.addColorStop(0, "#5f9d91");
      glow.addColorStop(0.58, "#28554c");
      glow.addColorStop(1, "#162d28");
      context.beginPath();
      path({ type: "Sphere" });
      context.fillStyle = glow;
      context.fill();
      context.save();
      context.beginPath();
      path({ type: "Sphere" });
      context.clip();
      context.beginPath();
      path(window.d3.geoGraticule10());
      context.strokeStyle = "rgba(231,244,230,0.17)";
      context.lineWidth = 0.65;
      context.stroke();
      for (const feature of globe.features) {
        context.beginPath();
        path(feature);
        context.fillStyle = feature === globe.selectedFeature ? "#e9543f" : "#c5dfc4";
        context.globalAlpha = feature === globe.selectedFeature ? 0.98 : 0.82;
        context.fill();
        context.globalAlpha = 1;
        context.strokeStyle = "rgba(27,53,47,0.56)";
        context.lineWidth = 0.55;
        context.stroke();
      }
      context.restore();
      context.beginPath();
      path({ type: "Sphere" });
      context.strokeStyle = "rgba(177,218,207,0.7)";
      context.lineWidth = 1.1;
      context.stroke();
    };
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      canvas.setPointerCapture(event.pointerId);
      globe.drag = { x: event.clientX, y: event.clientY, rotate: projection.rotate(), moved: false };
      canvas.classList.add("is-dragging");
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!globe?.drag) return;
      const drag = globe.drag;
      const rect = canvas.getBoundingClientRect();
      const scale = 180 / Math.max(1, Math.min(rect.width, rect.height));
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.hypot(dx, dy) > 4) drag.moved = true;
      projection.rotate([drag.rotate[0] + dx * scale, Math.max(-85, Math.min(85, drag.rotate[1] - dy * scale)), drag.rotate[2]]);
      globe.render();
    });
    canvas.addEventListener("pointerup", (event) => {
      if (!globe?.drag) return;
      const drag = globe.drag;
      globe.drag = null;
      canvas.classList.remove("is-dragging");
      if (drag.moved) return;
      const rect = canvas.getBoundingClientRect();
      const coordinates = projection.invert([event.clientX - rect.left, event.clientY - rect.top]);
      if (!coordinates) return;
      const selected = [...globe.features].reverse().find((feature) => window.d3.geoContains(feature, coordinates));
      if (selected) selectGlobeCountry(selected);
    });
    canvas.addEventListener("pointercancel", () => { if (globe) globe.drag = null; canvas.classList.remove("is-dragging"); });
    globe.render();
    fetch("https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson")
      .then((response) => { if (!response.ok) throw new Error("Country boundaries failed to load"); return response.json(); })
      .then((data) => {
        if (!holder.isConnected || !globe || globe.canvas !== canvas) return;
        globe.features = data.features.filter((feature) => feature.properties.ISO_A2 !== "AQ");
        globe.render();
        const loading = holder.querySelector(".globe-loading");
        if (loading) loading.remove();
      })
      .catch(() => {
        const loading = holder.querySelector(".globe-loading");
        if (loading) loading.textContent = "Could not load country outlines. Check your internet connection and reopen Settings.";
      });
    globeResize = new ResizeObserver(() => { if (globe && holder.isConnected) globe.render(); });
    globeResize.observe(holder);
  }

  function selectGlobeCountry(feature) {
    if (!feature || !globe) return;
    globe.selectedFeature = feature;
    const props = feature.properties || {};
    const code = String(props.ISO_A2 || "").toLowerCase();
    const name = props.ADMIN || props.NAME || "Unknown country";
    const match = countries.find((item) => item.code === code);
    const flagCode = /^[a-z]{2}$/.test(code) ? code : match?.code;
    main.querySelector("#selected-country-name").textContent = match?.name || name;
    main.querySelector("#selected-country-region").textContent = match ? `A ${match.difficulty} flag in the Flag Frenzy collection.` : "A country on the world map.";
    const preview = main.querySelector("#country-flag-preview");
    if (flagCode) {
      preview.innerHTML = `<img alt="${escapeHtml(match?.name || name)} flag" src="${flagSrc(flagCode)}">`;
      preview.querySelector("img").addEventListener("error", () => { preview.textContent = `Flag unavailable · ${escapeHtml(name)}`; }, { once: true });
    } else preview.textContent = `Flag unavailable · ${escapeHtml(name)}`;
    const [lng, lat] = window.d3.geoCentroid(feature);
    globe.projection.rotate([-lng, -lat, 0]);
    globe.render();
  }

  function nextQuestion() {
    const pool = countries.filter((item) => !seen.includes(item.code));
    country = randomFrom(pool.length ? pool : countries);
    seen.push(country.code);
    const distractors = shuffled(countries.filter((item) => item.code !== country.code && (mode !== "hard" || item.difficulty !== "easy"))).slice(0, 3);
    choices = shuffled([country, ...distractors]);
    selected = null;
  }

  function startGame(nextMode) {
    clearInterval(interval);
    mode = nextMode;
    screen = "game";
    question = 1;
    score = 0;
    streak = 0;
    correct = 0;
    selected = null;
    done = false;
    seen = [];
    seconds = mode === "hard" ? 30 : 60;
    if (mode === "draw") { country = randomFrom(countries); renderDraw(); return; }
    nextQuestion();
    renderQuiz();
    if (mode !== "classic") {
      interval = setInterval(() => {
        seconds -= 1;
        if (seconds <= 0) { seconds = 0; finishGame(); } else updateTimer();
      }, 1000);
    }
  }

  function progressPercent() {
    if (mode === "classic") return Math.min(100, ((question - 1) / 10) * 100);
    if (mode === "time") return Math.min(100, ((60 - seconds) / 60) * 100);
    return Math.min(94, streak * 8);
  }
  function renderQuiz() {
    screen = "game";
    main.innerHTML = `
      <section class="quiz-screen">
        <div class="quiz-head"><button class="back-link" id="exit-game">← EXIT RUN</button><span class="eyebrow">${{classic:"CLASSIC QUIZ",time:"TIME ATTACK",endless:"ENDLESS RUN",hard:"HARD MODE"}[mode]} / QUESTION ${String(question).padStart(2,"0")}${mode === "classic" ? " OF 10" : ""}</span><div class="quiz-score"><span>SCORE</span><strong>${score.toLocaleString()}</strong></div></div>
        <div class="progress-track"><div style="width:${progressPercent()}%"></div></div>
        <div class="quiz-main"><div class="quiz-prompt"><span class="eyebrow">IDENTIFY THIS FLAG</span><h1>Where in the<br>world is this?</h1><p>Choose the country this flag belongs to.</p><div class="streak-badge"><span aria-hidden="true">+</span><span>STREAK</span><b>${streak}</b></div></div>
          <div class="quiz-challenge"><div class="flag-panel"><span>FLAG NO. ${String(question).padStart(2,"0")} <span>·</span> ${country.difficulty.toUpperCase()}</span><div class="quiz-flag-frame"><img src="${flagSrc(country.code)}" alt="Mystery flag" onerror="this.alt='Flag image unavailable';this.style.opacity='.2'"></div><small>ONE FLAG, FOUR POSSIBILITIES</small></div>
          <div class="answer-grid">${choices.map((item,index)=>`<button class="answer-option" data-answer="${item.code}"><span class="answer-letter">${String.fromCharCode(65+index)}</span><span>${escapeHtml(item.name)}</span></button>`).join("")}</div><div class="answer-feedback" aria-live="polite"></div></div></div>
        <div class="quiz-foot"><span><span class="live-dot"></span> YOUR RUN IS IN PROGRESS</span><strong id="timer-label">${mode === "classic" ? "UNTIMED" : formatTime(seconds)}</strong><span>NO PENALTY FOR A GUESS</span></div>
      </section>`;
    main.querySelector("#exit-game").addEventListener("click", home);
    main.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => answer(button.dataset.answer)));
  }
  function updateTimer() {
    const timer = main.querySelector("#timer-label");
    if (timer) timer.textContent = formatTime(seconds);
    const progress = main.querySelector(".progress-track div");
    if (progress) progress.style.width = `${progressPercent()}%`;
  }
  function answer(code) {
    if (selected || done) return;
    selected = code;
    const right = code === country.code;
    const nextStreak = right ? streak + 1 : 0;
    const points = right ? 100 + (mode === "hard" ? 100 : 0) + Math.max(0, Math.floor(seconds / 6)) + (nextStreak >= 3 ? 50 : 0) : 0;
    streak = nextStreak;
    if (right) { score += points; correct += 1; }
    main.querySelectorAll("[data-answer]").forEach((button) => {
      button.disabled = true;
      const answerCode = button.dataset.answer;
      if (answerCode === country.code) button.classList.add("is-correct");
      if (answerCode === code && !right) button.classList.add("is-wrong");
    });
    const feedback = main.querySelector(".answer-feedback");
    feedback.className = `answer-feedback ${right ? "feedback-right" : "feedback-wrong"}`;
    feedback.textContent = right ? "EXCELLENT. THAT’S THE ONE." : `NOT QUITE — THAT WAS ${country.name.toUpperCase()}.`;
    main.querySelector(".quiz-score strong").textContent = score.toLocaleString();
    main.querySelector(".streak-badge b").textContent = streak;
    if ((mode === "endless" && !right) || (mode === "classic" && question >= 10)) { setTimeout(finishGame, 750); return; }
    setTimeout(() => {
      if (mode === "time" && seconds < 2) { finishGame(); return; }
      question += 1;
      nextQuestion();
      renderQuiz();
      updateTimer();
    }, 750);
  }
  function finishGame() {
    if (done || mode === "draw") return;
    done = true;
    clearInterval(interval);
    stats.games += 1;
    stats.questions += question;
    stats.correct += correct;
    stats.best = Math.max(stats.best, score);
    stats.streak = Math.max(stats.streak, streak);
    if (mode === "time") stats.timeBest = Math.max(stats.timeBest, score);
    save();
    main.innerHTML = `<section class="quiz-screen results-screen"><span class="eyebrow">${mode === "endless" ? "RUN COMPLETE" : "ROUND COMPLETE"} / FLAG FRENZY</span><div class="results-icon" aria-hidden="true">FF</div><h1>${score > 700 ? "World class." : score > 350 ? "Nicely traveled." : "The world awaits."}</h1><p>You spotted <b>${correct}</b> of ${question} flags. Keep exploring.</p><div class="result-stats"><div><span>FINAL SCORE</span><strong>${score.toLocaleString()}</strong></div><div><span>ACCURACY</span><strong>${question ? Math.round(correct / question * 100) : 0}%</strong></div><div><span>BEST STREAK</span><strong>${streak}</strong></div></div><button class="hero-play" id="play-again">PLAY AGAIN <span class="play-arrow">↻</span></button><button class="secondary-action" id="result-home">BACK TO BASE →</button></section>`;
    main.querySelector("#play-again").addEventListener("click", () => startGame(mode));
    main.querySelector("#result-home").addEventListener("click", home);
  }

  function createDrawState() {
    drawState = { tool: "brush", color: "#e9543f", size: 8, grid: false, hint: false, submitted: false, undo: [], redo: [], active: false, start: null, beforeShape: null };
  }
  function renderDraw() {
    createDrawState();
    main.innerHTML = `
      <section class="draw-shell"><header class="draw-top"><button class="back-link" id="exit-draw">← EXIT DRAW</button><div><span class="eyebrow">FLAG CHALLENGE / DRAW FROM MEMORY</span><h2>Draw the flag of <em>${escapeHtml(country.name)}</em></h2></div><span class="draw-top-note"><span class="live-dot"></span> FLAG HIDDEN</span></header>
        <div class="draw-body"><div class="draw-workspace"><div class="board-label"><span>YOUR CANVAS</span><span>2 : 1 RATIO</span></div><div class="canvas-wrap" id="canvas-wrap"><canvas id="drawing-canvas" width="900" height="450" aria-label="Flag drawing canvas"></canvas></div>
          <div class="toolbar"><div class="tool-group">${[["brush","Brush"],["eraser","Erase"],["line","Line"],["rect","Box"],["circle","Ellipse"],["fill","Fill"]].map(([id,label])=>`<button class="tool-btn ${id === "brush" ? "selected" : ""}" data-tool="${id}" aria-pressed="${id === "brush"}" title="${label}">${label}</button>`).join("")}</div><div class="tool-divider"></div><div class="color-row">${["#e9543f","#17231f","#fffefa","#f2c14e","#477c63","#3974a5","#7a4d8b","#111111"].map((color,index)=>`<button class="swatch ${index === 0 ? "active" : ""}" style="background:${color}" data-color="${color}" aria-label="Color ${color}" aria-pressed="${index === 0}"></button>`).join("")}<label class="custom-color"><input type="color" id="custom-color" value="#e9543f" aria-label="Choose custom color"></label></div><div class="tool-divider"></div><label class="brush-size"><span>SIZE</span><input type="range" min="2" max="30" value="8" id="brush-size" aria-label="Brush size"><output id="brush-size-value">8px</output></label><div class="tool-divider"></div><button class="tool-btn" id="grid-toggle" aria-pressed="false">Grid</button><button class="tool-btn" id="undo-button" disabled>Undo</button><button class="tool-btn" id="redo-button" disabled>Redo</button><button class="tool-btn" id="clear-button">Clear</button></div>
          <div class="draw-actions"><button class="hint-button" id="hint-button">NEED A HINT?</button><button class="submit-button" id="submit-drawing">SUBMIT DRAWING →</button></div><div class="hint-reveal" id="hint-reveal" hidden><img src="${flagSrc(country.code)}" alt="Hint: ${escapeHtml(country.name)} flag"></div><div class="status-message" id="draw-status" aria-live="polite"></div><div id="draw-result"></div>
        </div><aside class="draw-sidebar"><div class="side-label">FIELD NOTES <span>01 / 01</span></div><article class="note-card"><span aria-hidden="true">01</span><h3>Think in layers.</h3><p>Start with the big color blocks, then add the symbol. You have the whole canvas—make it count.</p></article><article class="note-card"><span aria-hidden="true">02</span><h3>How scoring works</h3><p>Your score measures how much you improved over a blank canvas, so an untouched page starts at 0% instead of receiving free points.</p></article><div class="sealed-card"><strong>THE REFERENCE IS SEALED</strong><p>The authentic flag appears after you submit.</p></div></aside></div>
      </section>`;
    main.querySelector("#exit-draw").addEventListener("click", home);
    const canvas = main.querySelector("#drawing-canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
    drawState.undo.push(context.getImageData(0, 0, canvas.width, canvas.height));
    canvas.addEventListener("pointerdown", drawStart);
    canvas.addEventListener("pointermove", drawMove);
    canvas.addEventListener("pointerup", drawEnd);
    canvas.addEventListener("pointercancel", drawEnd);
    main.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => {
      drawState.tool = button.dataset.tool;
      main.querySelectorAll("[data-tool]").forEach((other) => { other.classList.toggle("selected", other === button); other.setAttribute("aria-pressed", String(other === button)); });
    }));
    main.querySelectorAll("[data-color]").forEach((button) => button.addEventListener("click", () => {
      drawState.color = button.dataset.color;
      main.querySelectorAll("[data-color]").forEach((other) => { other.classList.toggle("active", other === button); other.setAttribute("aria-pressed", String(other === button)); });
      main.querySelector("#custom-color").value = drawState.color;
    }));
    main.querySelector("#custom-color").addEventListener("input", (event) => { drawState.color = event.target.value; main.querySelectorAll("[data-color]").forEach((button) => button.classList.remove("active")); });
    main.querySelector("#brush-size").addEventListener("input", (event) => { drawState.size = Number(event.target.value); main.querySelector("#brush-size-value").textContent = `${drawState.size}px`; });
    main.querySelector("#grid-toggle").addEventListener("click", (event) => { drawState.grid = !drawState.grid; event.currentTarget.classList.toggle("selected", drawState.grid); event.currentTarget.setAttribute("aria-pressed", String(drawState.grid)); main.querySelector("#canvas-wrap").classList.toggle("with-grid", drawState.grid); });
    main.querySelector("#undo-button").addEventListener("click", undoDraw);
    main.querySelector("#redo-button").addEventListener("click", redoDraw);
    main.querySelector("#clear-button").addEventListener("click", clearDraw);
    main.querySelector("#hint-button").addEventListener("click", () => { if (drawState.hint || drawState.submitted) return; drawState.hint = true; main.querySelector("#hint-reveal").hidden = false; main.querySelector("#hint-button").textContent = "HINT USED · −25%"; main.querySelector("#hint-button").disabled = true; });
    main.querySelector("#submit-drawing").addEventListener("click", submitDraw);
    updateUndoButtons();
  }

  function canvasPoint(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * event.currentTarget.width / rect.width, y: (event.clientY - rect.top) * event.currentTarget.height / rect.height };
  }
  function drawStart(event) {
    if (drawState.submitted) return;
    const canvas = event.currentTarget;
    canvas.setPointerCapture(event.pointerId);
    const point = canvasPoint(event);
    drawState.start = point;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (drawState.tool === "fill") { floodFill(context, canvas, Math.floor(point.x), Math.floor(point.y)); stashDraw(); return; }
    drawState.active = true;
    drawState.beforeShape = context.getImageData(0, 0, canvas.width, canvas.height);
    context.beginPath(); context.moveTo(point.x, point.y); context.lineCap = "round"; context.lineJoin = "round"; context.lineWidth = drawState.size; context.strokeStyle = drawState.tool === "eraser" ? "#ffffff" : drawState.color; context.fillStyle = drawState.color;
  }
  function drawMove(event) {
    if (!drawState.active) return;
    const canvas = event.currentTarget; const context = canvas.getContext("2d", { willReadFrequently: true }); const point = canvasPoint(event);
    if (["brush", "eraser"].includes(drawState.tool)) { context.lineTo(point.x, point.y); context.stroke(); return; }
    context.putImageData(drawState.beforeShape, 0, 0); context.beginPath(); context.lineWidth = drawState.size; context.strokeStyle = drawState.color;
    const start = drawState.start;
    if (drawState.tool === "line") { context.moveTo(start.x, start.y); context.lineTo(point.x, point.y); context.stroke(); }
    if (drawState.tool === "rect") context.strokeRect(start.x, start.y, point.x - start.x, point.y - start.y);
    if (drawState.tool === "circle") { context.ellipse((start.x + point.x) / 2, (start.y + point.y) / 2, Math.abs(point.x - start.x) / 2, Math.abs(point.y - start.y) / 2, 0, 0, Math.PI * 2); context.stroke(); }
  }
  function drawEnd() { if (!drawState?.active) return; drawState.active = false; stashDraw(); }
  function stashDraw() {
    const canvas = main.querySelector("#drawing-canvas");
    drawState.undo.push(canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height));
    if (drawState.undo.length > 35) drawState.undo.shift();
    drawState.redo = []; updateUndoButtons();
  }
  function updateUndoButtons() { main.querySelector("#undo-button").disabled = drawState.undo.length < 2; main.querySelector("#redo-button").disabled = drawState.redo.length === 0; }
  function undoDraw() { if (drawState.undo.length < 2) return; drawState.redo.push(drawState.undo.pop()); restoreDraw(drawState.undo.at(-1)); }
  function redoDraw() { const image = drawState.redo.pop(); if (!image) return; drawState.undo.push(image); restoreDraw(image); }
  function restoreDraw(image) { const canvas = main.querySelector("#drawing-canvas"); canvas.getContext("2d", { willReadFrequently: true }).putImageData(image, 0, 0); updateUndoButtons(); }
  function clearDraw() { const canvas = main.querySelector("#drawing-canvas"); const context = canvas.getContext("2d", { willReadFrequently: true }); context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height); stashDraw(); }
  function floodFill(context, canvas, startX, startY) {
    const image = context.getImageData(0, 0, canvas.width, canvas.height); const data = image.data; const width = canvas.width; const height = canvas.height; const start = (startY * width + startX) * 4;
    const target = [data[start], data[start + 1], data[start + 2]]; const hex = drawState.color.slice(1); const replacement = [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
    if (target.every((value,index) => value === replacement[index])) return;
    const seen = new Uint8Array(width * height); const stack = [startX + startY * width]; const tolerance = 36;
    while (stack.length) { const index = stack.pop(); if (index < 0 || index >= width * height || seen[index]) continue; seen[index] = 1; const offset = index * 4;
      if (Math.abs(data[offset]-target[0]) > tolerance || Math.abs(data[offset+1]-target[1]) > tolerance || Math.abs(data[offset+2]-target[2]) > tolerance) continue;
      data[offset] = replacement[0]; data[offset+1] = replacement[1]; data[offset+2] = replacement[2]; data[offset+3] = 255;
      const x = index % width; if (x > 0) stack.push(index-1); if (x < width-1) stack.push(index+1); if (index >= width) stack.push(index-width); if (index < width*(height-1)) stack.push(index+width);
    }
    context.putImageData(image,0,0);
  }
  function submitDraw() {
    if (drawState.submitted) return;
    const canvas = main.querySelector("#drawing-canvas"); const image = new Image(); image.crossOrigin = "anonymous";
    main.querySelector("#draw-status").textContent = "Comparing your drawing…";
    image.onload = () => {
      try {
        const reference = document.createElement("canvas"); reference.width = canvas.width; reference.height = canvas.height;
        const context = reference.getContext("2d", { willReadFrequently: true }); context.fillStyle = "#ffffff"; context.fillRect(0, 0, reference.width, reference.height); context.drawImage(image, 0, 0, reference.width, reference.height);
        const result = window.FlagFrenzyScoring.compareCanvases(canvas, reference, drawState.hint);
        drawState.submitted = true; main.querySelector("#submit-drawing").disabled = true; main.querySelector("#draw-status").textContent = "";
        stats.games += 1; stats.drawBest = Math.max(stats.drawBest, result); save();
        const comparison = document.createElement("canvas"); comparison.width = 450; comparison.height = 225; comparison.getContext("2d").drawImage(canvas, 0, 0, 450, 225);
        main.querySelector("#draw-result").innerHTML = `<section class="draw-result"><span class="eyebrow">DRAWING COMPLETE</span><h3>${result}% <span class="eyebrow">visual match</span></h3><p>${result >= 65 ? "Strong composition. You captured the spirit of the flag." : result >= 35 ? "Good start. The big shapes are beginning to come through." : "Every great flag designer starts somewhere. Try another!"}</p><div class="draw-result-grid"><div><span class="label">YOUR DRAWING</span><div id="your-drawing-result"></div></div><div><span class="label">AUTHENTIC FLAG</span><img src="${flagSrc(country.code)}" alt="${escapeHtml(country.name)} flag"></div></div><button class="hero-play" id="try-another">TRY ANOTHER FLAG →</button></section>`;
        main.querySelector("#your-drawing-result").append(comparison); main.querySelector("#try-another").addEventListener("click", () => startGame("draw"));
      } catch {
        main.querySelector("#draw-status").textContent = "Could not compare this flag. Check your internet connection and try again.";
      }
    };
    image.onerror = () => { main.querySelector("#draw-status").textContent = "Could not load the reference flag. Check your internet connection and try again."; };
    image.src = flagSrc(country.code);
  }

  renderHome();
})();

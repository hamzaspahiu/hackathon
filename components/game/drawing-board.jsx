"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Circle,
  Eraser,
  Flag,
  Grid2X2,
  HelpCircle,
  Lightbulb,
  Minus,
  PaintBucket,
  Pencil,
  RotateCw,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { flagSrc } from "./data";
import { FlagArt } from "./flag-art";

export function DrawingBoard({ country, onResult, onExit }) {
  const canvasRef = useRef(null),
    history = useRef([]),
    redo = useRef([]),
    drawing = useRef(false),
    start = useRef(null),
    beforeShape = useRef(null);
  const [tool, setTool] = useState("brush"),
    [color, setColor] = useState("#e64e38"),
    [size, setSize] = useState(8),
    [grid, setGrid] = useState(false),
    [hint, setHint] = useState(false),
    [submitted, setSubmitted] = useState(false),
    [score, setScore] = useState(0),
    [historySize, setHistorySize] = useState(1),
    [redoSize, setRedoSize] = useState(0);
  const colors = [
    "#e64e38",
    "#13221f",
    "#f7f4ed",
    "#f2c14e",
    "#477c63",
    "#3974a5",
    "#7a4d8b",
    "#111111",
  ];
  useEffect(() => {
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        history.current = [ctx.getImageData(0, 0, c.width, c.height)];
        setHistorySize(1);
      }
    }
  }, []);
  const ctx = () => canvasRef.current?.getContext("2d");
  const pos = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * e.currentTarget.width) / r.width,
      y: ((e.clientY - r.top) * e.currentTarget.height) / r.height,
    };
  };
  const stash = () => {
    const c = canvasRef.current,
      context = ctx();
    if (c && context) {
      history.current.push(context.getImageData(0, 0, c.width, c.height));
      if (history.current.length > 40) history.current.shift();
      redo.current = [];
      setHistorySize(history.current.length);
      setRedoSize(0);
    }
  };
  const fillRegion = (context, canvas, x, y) => {
    const image = context.getImageData(0, 0, canvas.width, canvas.height),
      pixels = image.data,
      width = canvas.width,
      height = canvas.height,
      startIndex = (Math.floor(y) * width + Math.floor(x)) * 4,
      target = [
        pixels[startIndex],
        pixels[startIndex + 1],
        pixels[startIndex + 2],
        pixels[startIndex + 3],
      ],
      hex = color.replace("#", ""),
      replacement = [
        Number.parseInt(hex.slice(0, 2), 16),
        Number.parseInt(hex.slice(2, 4), 16),
        Number.parseInt(hex.slice(4, 6), 16),
        255,
      ];
    if (target.every((value, index) => value === replacement[index]))
      return false;
    const seen = new Uint8Array(width * height),
      stack = new Int32Array(width * height);
    let top = 0;
    const seed = startIndex / 4;
    stack[top++] = seed;
    seen[seed] = 1;
    const tolerance = 42;
    while (top > 0) {
      const index = stack[--top],
        offset = index * 4;
      if (
        Math.abs(pixels[offset] - target[0]) > tolerance ||
        Math.abs(pixels[offset + 1] - target[1]) > tolerance ||
        Math.abs(pixels[offset + 2] - target[2]) > tolerance
      )
        continue;
      pixels[offset] = replacement[0];
      pixels[offset + 1] = replacement[1];
      pixels[offset + 2] = replacement[2];
      pixels[offset + 3] = replacement[3];
      const column = index % width;
      for (const neighbor of [
        column > 0 ? index - 1 : -1,
        column < width - 1 ? index + 1 : -1,
        index >= width ? index - width : -1,
        index < width * (height - 1) ? index + width : -1,
      ]) {
        if (neighbor >= 0 && !seen[neighbor]) {
          seen[neighbor] = 1;
          stack[top++] = neighbor;
        }
      }
    }
    context.putImageData(image, 0, 0);
    return true;
  };
  const down = (e) => {
    if (submitted) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pos(e),
      c = canvasRef.current,
      context = ctx();
    if (!c || !context) return;
    if (tool === "fill") {
      if (fillRegion(context, c, p.x, p.y)) stash();
      return;
    }
    drawing.current = true;
    start.current = p;
    beforeShape.current = context.getImageData(0, 0, c.width, c.height);
    context.beginPath();
    context.moveTo(p.x, p.y);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = size;
    context.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    context.fillStyle = color;
  };
  const move = (e) => {
    if (!drawing.current) return;
    const p = pos(e),
      context = ctx(),
      c = canvasRef.current;
    if (!context || !c) return;
    if (tool === "brush" || tool === "eraser") {
      context.lineTo(p.x, p.y);
      context.stroke();
    } else {
      if (beforeShape.current) context.putImageData(beforeShape.current, 0, 0);
      const a = start.current;
      context.beginPath();
      if (tool === "line") {
        context.moveTo(a.x, a.y);
        context.lineTo(p.x, p.y);
        context.strokeStyle = color;
        context.lineWidth = size;
        context.stroke();
      } else if (tool === "rect") {
        context.strokeStyle = color;
        context.lineWidth = size;
        context.strokeRect(a.x, a.y, p.x - a.x, p.y - a.y);
      } else if (tool === "circle") {
        context.strokeStyle = color;
        context.lineWidth = size;
        context.ellipse(
          (a.x + p.x) / 2,
          (a.y + p.y) / 2,
          Math.abs(p.x - a.x) / 2,
          Math.abs(p.y - a.y) / 2,
          0,
          0,
          Math.PI * 2,
        );
        context.stroke();
      }
    }
  };
  const up = () => {
    if (drawing.current) {
      drawing.current = false;
      stash();
    }
  };
  const undo = () => {
    const c = canvasRef.current,
      context = ctx();
    if (!c || !context || history.current.length < 2) return;
    redo.current.push(history.current.pop());
    context.putImageData(history.current[history.current.length - 1], 0, 0);
    setHistorySize(history.current.length);
    setRedoSize(redo.current.length);
  };
  const redoDrawing = () => {
    const c = canvasRef.current,
      context = ctx(),
      next = redo.current.pop();
    if (!c || !context || !next) return;
    history.current.push(next);
    context.putImageData(next, 0, 0);
    setHistorySize(history.current.length);
    setRedoSize(redo.current.length);
  };
  const clear = () => {
    const c = canvasRef.current,
      context = ctx();
    if (c && context) {
      context.fillStyle = "#fff";
      context.fillRect(0, 0, c.width, c.height);
      stash();
    }
  };
  const submit = () => {
    const c = canvasRef.current;
    if (!c) return;
    const user = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const ref = document.createElement("canvas");
    ref.width = c.width;
    ref.height = c.height;
    const rc = ref.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      rc.drawImage(img, 0, 0, c.width, c.height);
      const target = rc.getImageData(0, 0, c.width, c.height).data;
      let error = 0;
      for (let i = 0; i < user.length; i += 4) {
        error +=
          (Math.abs(user[i] - target[i]) +
            Math.abs(user[i + 1] - target[i + 1]) +
            Math.abs(user[i + 2] - target[i + 2])) /
          (3 * 255);
      }
      const similarity = Math.max(
        0,
        Math.round(100 * (1 - error / (user.length / 4))),
      );
      const final = Math.max(5, Math.round(similarity * (hint ? 0.75 : 1)));
      setScore(final);
      setSubmitted(true);
      onResult(final);
    };
    img.onerror = () => {
      setScore(0);
      setSubmitted(true);
      onResult(0);
    };
    img.src = flagSrc(country.code);
  };
  return (
    <div className="draw-shell">
      <header className="draw-top">
        <button
          className="icon-button"
          onClick={onExit}
          aria-label="Back to home"
        >
          <ArrowLeft />
        </button>
        <div>
          <span className="eyebrow">FLAG CHALLENGE / DRAW FROM MEMORY</span>
          <h2>
            Draw the flag of <em>{country.name}</em>
          </h2>
        </div>
        <div className="draw-top-note">
          <span className="live-dot" /> FLAG HIDDEN
        </div>
      </header>
      <div className="draw-body">
        <div className="draw-workspace">
          <div className="board-label">
            <span>YOUR CANVAS</span>
            <span>2 : 1 RATIO</span>
          </div>
          <div className={`canvas-wrap ${grid ? "with-grid" : ""}`}>
            <canvas
              ref={canvasRef}
              width={900}
              height={450}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              aria-label="Flag drawing canvas"
            />
          </div>
          <div className="toolbar">
            <div className="tool-group">
              {[
                { id: "brush", Icon: Pencil, label: "Brush" },
                { id: "eraser", Icon: Eraser, label: "Eraser" },
                { id: "line", Icon: Minus, label: "Line" },
                { id: "rect", Icon: Grid2X2, label: "Rectangle" },
                { id: "circle", Icon: Circle, label: "Ellipse" },
                { id: "fill", Icon: PaintBucket, label: "Smart fill" },
              ].map(({ id, Icon, label }) => (
                <button
                  key={id}
                  className={`tool-btn ${tool === id ? "selected" : ""}`}
                  onClick={() => setTool(id)}
                  aria-label={label}
                  title={label}
                  aria-pressed={tool === id}
                >
                  <Icon />
                </button>
              ))}
            </div>
            <div className="tool-divider" />
            <div className="color-row">
              {colors.map((c) => (
                <button
                  key={c}
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className={`swatch ${color === c ? "active" : ""}`}
                  style={{ background: c }}
                />
              ))}
              <label className="custom-color" title="Custom color">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  aria-label="Choose custom color"
                />
              </label>
            </div>
            <div className="tool-divider" />
            <label className="brush-size">
              <span>SIZE</span>
              <input
                type="range"
                min="2"
                max="30"
                value={size}
                onChange={(e) => setSize(+e.target.value)}
                aria-label="Brush size"
              />
              <output>{size}px</output>
            </label>
            <div className="tool-divider" />
            <button
              className={`tool-btn ${grid ? "selected" : ""}`}
              onClick={() => setGrid(!grid)}
              aria-label="Toggle grid"
              title="Grid"
              aria-pressed={grid}
            >
              <Grid2X2 />
            </button>
            <button
              className="tool-btn"
              onClick={undo}
              aria-label="Undo"
              title="Undo"
              disabled={historySize < 2}
            >
              <Undo2 />
            </button>
            <button
              className="tool-btn"
              onClick={redoDrawing}
              aria-label="Redo"
              title="Redo"
              disabled={redoSize === 0}
            >
              <RotateCw />
            </button>
            <button
              className="tool-btn danger"
              onClick={clear}
              aria-label="Clear drawing"
              title="Clear drawing; undo to restore"
            >
              <X />
            </button>
          </div>
          <div className="draw-actions">
            <button
              className="hint-button"
              onClick={() => {
                setHint(true);
              }}
              disabled={hint || submitted}
            >
              <Lightbulb /> {hint ? "HINT USED · −25%" : "NEED A HINT?"}
            </button>
            <button
              className="submit-button"
              onClick={submit}
              disabled={submitted}
            >
              {submitted ? "SUBMITTED" : "SUBMIT DRAWING"} <ArrowRight />
            </button>
          </div>
        </div>
        <aside className="draw-sidebar">
          <div className="side-label">
            FIELD NOTES <span>01 / 01</span>
          </div>
          <div className="note-card">
            <Sparkles />
            <h3>Think in layers.</h3>
            <p>
              Start with the big color blocks, then add the symbol. You have the
              whole canvas—make it count.
            </p>
          </div>
          <div className="note-card muted-note">
            <HelpCircle />
            <h3>How scoring works</h3>
            <p>
              Your drawing is compared pixel-by-pixel with the real flag.
              It&apos;s a visual similarity score, not an art grade.
            </p>
          </div>
          <div className="flag-disclosure">
            <span>THE REFERENCE IS SEALED</span>
            <div className="seal-icon">
              <Flag />
            </div>
            <p>The authentic flag appears after you submit.</p>
          </div>
        </aside>
      </div>
      {submitted && (
        <div className="reveal-panel">
          <div className="reveal-copy">
            <span className="eyebrow">DRAWING COMPLETE</span>
            <h3>
              {score}% <span>visual match</span>
            </h3>
            <p>
              {score >= 65
                ? "Strong composition. You captured the spirit of the flag."
                : score >= 35
                  ? "Good start. The big shapes are beginning to come through."
                  : "Every great flag designer starts somewhere. Try another!"}
            </p>
            <button className="play-again" onClick={onExit}>
              TRY ANOTHER FLAG <ArrowRight />
            </button>
          </div>
          <div className="compare">
            <div>
              <span>YOUR DRAWING</span>
              <canvas
                className="mini-drawing"
                ref={(node) => {
                  if (node && canvasRef.current) {
                    node.width = 450;
                    node.height = 225;
                    node
                      .getContext("2d")
                      ?.drawImage(canvasRef.current, 0, 0, 450, 225);
                  }
                }}
              />
            </div>
            <div>
              <span>AUTHENTIC FLAG · FLAGCDN / WIKIMEDIA</span>
              <FlagArt country={country} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

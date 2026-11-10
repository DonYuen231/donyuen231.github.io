import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { forward, loadModel, topGuess, type Model } from './model';
import { inkFromAlpha, preprocess } from './preprocess';
import './mnist-card.css';

interface Sample {
  label: number;
  index: number;
  pixels: number[];
}

interface Demo {
  model: Model;
  samples: Sample[];
}

interface Props {
  codeUrl: string;
  /** Link to the full demo. `null` hides it (the card is already there). */
  fullDemoHref?: string | null;
}

type Source = 'drawing' | 'sample';

type Result =
  | { kind: 'guess'; digit: number; p: number; source: Source }
  | { kind: 'empty' }
  | null;

const SIZE = 280; // logical canvas size in CSS pixels
const GRID = 28;
const SCALE = SIZE / GRID;
const LINE_WIDTH = 18;
/** Ink no larger than this box is a tap or a dot, not a digit. */
const MIN_EXTENT = LINE_WIDTH + 6;
const BASE = '/models/mnist/';

// Loaded once per page and shared by every card (and by later mounts after a
// view-transition navigation). A failed load is forgotten so a remount retries.
let demoPromise: Promise<Demo> | null = null;

function loadDemo(): Promise<Demo> {
  if (!demoPromise) {
    demoPromise = Promise.all([
      loadModel(BASE),
      fetch(`${BASE}samples.json`).then((r) => {
        if (!r.ok) throw new Error(`samples.json failed to load (${r.status})`);
        return r.json() as Promise<Sample[]>;
      }),
    ]).then(([model, samples]) => ({ model, samples }));
    demoPromise.catch(() => {
      demoPromise = null;
    });
  }
  return demoPromise;
}

export default function MnistCard({
  codeUrl,
  fullDemoHref = '/projects/mnist-neural-network/#demo',
}: Props) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [result, setResult] = useState<Result>(null);
  const drawLabel = useId();
  const samplesLabel = useId();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<CanvasRenderingContext2D | null>(null);
  const inkRef = useRef<CanvasRenderingContext2D | null>(null);
  const strokeRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const inkColor = useRef('#fbbf24');
  const requestRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(SIZE * dpr);
      canvas.height = Math.round(SIZE * dpr);
      const view = canvas.getContext('2d');
      view?.scale(canvas.width / SIZE, canvas.height / SIZE);
      viewRef.current = view;
      const color = getComputedStyle(canvas)
        .getPropertyValue('--amber-bright')
        .trim();
      if (color) inkColor.current = color;

      // The network reads ink from this hidden 1x canvas, drawn in black.
      const hidden = document.createElement('canvas');
      hidden.width = SIZE;
      hidden.height = SIZE;
      inkRef.current = hidden.getContext('2d', { willReadFrequently: true });
    }
    loadDemo().then(
      () => alive && setPhase('ready'),
      () => alive && setPhase('error'),
    );
    return () => {
      alive = false;
      requestRef.current++;
    };
  }, []);

  function contexts() {
    const out: [CanvasRenderingContext2D, string][] = [];
    if (viewRef.current) out.push([viewRef.current, inkColor.current]);
    if (inkRef.current) out.push([inkRef.current, '#000']);
    return out;
  }

  function clearCanvases() {
    for (const [ctx] of contexts()) ctx.clearRect(0, 0, SIZE, SIZE);
  }

  function dot(x: number, y: number) {
    for (const [ctx, color] of contexts()) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, LINE_WIDTH / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function line(x0: number, y0: number, x1: number, y1: number) {
    for (const [ctx, color] of contexts()) {
      ctx.strokeStyle = color;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  async function guess(source: Source = 'drawing') {
    const ink = inkRef.current;
    if (!ink) return;
    const id = ++requestRef.current;
    const pixels = ink.getImageData(0, 0, SIZE, SIZE).data;
    const input = preprocess(inkFromAlpha(pixels, SIZE, SIZE), SIZE, SIZE);
    if (!input || (input.crop.w <= MIN_EXTENT && input.crop.h <= MIN_EXTENT)) {
      setResult({ kind: 'empty' });
      return;
    }
    try {
      const { model } = await loadDemo();
      if (id !== requestRef.current) return;
      const { digit, p } = topGuess(forward(model, input.output).probs);
      setResult({ kind: 'guess', digit, p, source });
    } catch {
      // The load failure is already shown by the effect above.
    }
  }

  async function showSample(label: number) {
    const id = ++requestRef.current;
    let samples: Sample[];
    try {
      ({ samples } = await loadDemo());
    } catch {
      return;
    }
    const sample = samples.find((s) => s.label === label);
    if (!sample || id !== requestRef.current) return;
    strokeRef.current = null;
    clearCanvases();
    for (const [ctx, color] of contexts()) {
      ctx.fillStyle = color;
      for (let i = 0; i < sample.pixels.length; i++) {
        const v = sample.pixels[i];
        if (v <= 0) continue;
        ctx.globalAlpha = Math.min(1, v);
        ctx.fillRect(
          (i % GRID) * SCALE,
          Math.floor(i / GRID) * SCALE,
          SCALE,
          SCALE,
        );
      }
      ctx.globalAlpha = 1;
    }
    void guess('sample');
  }

  function clear() {
    requestRef.current++;
    strokeRef.current = null;
    clearCanvases();
    setResult(null);
  }

  function toCanvas(rect: DOMRect, p: { clientX: number; clientY: number }) {
    return {
      x: ((p.clientX - rect.left) * SIZE) / rect.width,
      y: ((p.clientY - rect.top) * SIZE) / rect.height,
    };
  }

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    // A second finger is ignored; the same pointer restarts a lost stroke.
    const active = strokeRef.current;
    if (active && active.id !== e.pointerId) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = toCanvas(e.currentTarget.getBoundingClientRect(), e);
    strokeRef.current = { id: e.pointerId, x, y };
    dot(x, y);
  }

  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const stroke = strokeRef.current;
    if (!stroke || stroke.id !== e.pointerId) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      endStroke(e, true);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of events.length ? events : [e]) {
      const p = toCanvas(rect, ev);
      line(stroke.x, stroke.y, p.x, p.y);
      stroke.x = p.x;
      stroke.y = p.y;
    }
  }

  function endStroke(e: PointerEvent<HTMLCanvasElement>, runGuess: boolean) {
    const stroke = strokeRef.current;
    if (!stroke || stroke.id !== e.pointerId) return;
    strokeRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (runGuess) void guess();
  }

  if (phase === 'error') {
    return (
      <div className="mnist-card on-dark" data-state="error">
        <p className="mnist-failed">Demo couldn't load</p>
        <a className="mnist-link" href={codeUrl}>
          View the code
        </a>
      </div>
    );
  }

  let status: ReactNode = '';
  if (phase === 'loading') status = 'Loading model…';
  else if (result?.kind === 'empty') status = 'Draw a digit first';
  else if (result?.kind === 'guess') {
    const pct = Math.round(result.p * 100);
    const from = result.source === 'sample' ? 'Sample' : 'Your drawing';
    status = (
      <>
        <span className="mnist-guess-visible" aria-hidden="true">
          {`${result.digit} · ${pct}%`}
        </span>
        <span className="mnist-sr-only">
          {`${from}: top guess ${result.digit}, ${pct} percent`}
        </span>
      </>
    );
  }

  return (
    <div className="mnist-card on-dark" data-state={phase}>
      <p className="mnist-label" id={drawLabel}>
        Draw a digit, 0 to 9
      </p>
      <canvas
        ref={canvasRef}
        className="mnist-canvas"
        width={SIZE}
        height={SIZE}
        role="img"
        aria-labelledby={drawLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endStroke(e, true)}
        onPointerCancel={(e) => endStroke(e, false)}
        onLostPointerCapture={(e) => endStroke(e, false)}
      />
      <div className="mnist-actions">
        <button
          type="button"
          className="mnist-btn"
          onClick={() => void guess()}
        >
          Guess
        </button>
        <button type="button" className="mnist-btn" onClick={clear}>
          Clear
        </button>
      </div>
      <p className="mnist-label" id={samplesLabel}>
        Or try a real MNIST test image
      </p>
      <div
        className="mnist-samples"
        role="group"
        aria-labelledby={samplesLabel}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <button
            key={d}
            type="button"
            className="mnist-sample"
            aria-label={`Sample ${d}`}
            onClick={() => void showSample(d)}
          >
            {d}
          </button>
        ))}
      </div>
      <p className="mnist-label">Top guess</p>
      <p
        className={`mnist-guess${result?.kind === 'guess' && phase === 'ready' ? '' : ' mnist-note'}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {status}
      </p>
      {fullDemoHref !== null && (
        <a className="mnist-link" href={fullDemoHref}>
          Watch it think
        </a>
      )}
    </div>
  );
}

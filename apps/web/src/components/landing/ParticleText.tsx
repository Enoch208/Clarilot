import { useEffect, useRef } from "react";
import { buildPalette, drawField, stepField, type Field } from "@/lib/particle-field";
import { glyphRadius, sampleText, toRgb } from "@/lib/particle-sample";
import { pointerPresent, readPointer, trackPointer } from "@/lib/pointer-tracker";
import { useMediaQuery } from "@/lib/use-media-query";

const motionQuery = "(min-width: 767px) and (prefers-reduced-motion: no-preference)";
const tintTokens = ["--color-accent", "--color-periwinkle", "--color-sky", "--color-amber"];
const rebuildDelayMs = 150;

type ParticleTextProps = {
  text: string;
};

export function ParticleText({ text }: ParticleTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = useMediaQuery(motionQuery);

  useEffect(() => {
    const span = spanRef.current;
    const canvas = canvasRef.current;
    if (!enabled || !span || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const root = getComputedStyle(document.documentElement);
    const tints = tintTokens.map((token) => toRgb(root.getPropertyValue(token).trim()));
    const palette = buildPalette(toRgb(getComputedStyle(span).color), tints);
    let field: Field | null = null;
    let radius = 1;
    let frame = 0;
    let visible = true;
    let rebuildTimer = 0;

    const tick = () => {
      frame = 0;
      if (!field) return;
      const box = canvas.getBoundingClientRect();
      const pointer = readPointer();
      const busy = stepField(field, {
        x: pointer.x - box.left,
        y: pointer.y - box.top,
        vx: pointer.vx,
        vy: pointer.vy,
        moving: pointer.moving,
        present: pointerPresent(pointer),
      });
      drawField(context, field, palette, radius);
      if (visible && (busy || pointer.moving)) frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (frame === 0 && visible && field) frame = requestAnimationFrame(tick);
    };

    const build = () => {
      const style = getComputedStyle(span);
      const box = span.getBoundingClientRect();
      field = sampleText({
        text,
        font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
        letterSpacing: style.letterSpacing,
        width: box.width,
        height: box.height,
        tints: tints.length,
      });
      if (field.particles.length === 0) {
        field = null;
        canvas.hidden = true;
        span.style.color = "";
        return;
      }
      const ratio = Math.max(1, window.devicePixelRatio);
      canvas.width = Math.round(field.width * ratio);
      canvas.height = Math.round(field.height * ratio);
      canvas.style.width = `${String(field.width)}px`;
      canvas.style.height = `${String(field.height)}px`;
      canvas.style.top = `${String(-field.bleed)}px`;
      canvas.style.left = `${String(-field.bleed)}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      radius = glyphRadius(context);
      canvas.hidden = false;
      span.style.color = "transparent";
      drawField(context, field, palette, radius);
      wake();
    };

    const scheduleBuild = () => {
      window.clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(build, rebuildDelayMs);
    };

    const visibility = new IntersectionObserver((entries) => {
      for (const entry of entries) visible = entry.isIntersecting;
      wake();
    });
    const resize = new ResizeObserver(scheduleBuild);
    void document.fonts.ready.then(build);
    visibility.observe(span);
    resize.observe(span);
    const untrack = trackPointer(wake);
    return () => {
      untrack();
      visibility.disconnect();
      resize.disconnect();
      window.clearTimeout(rebuildTimer);
      cancelAnimationFrame(frame);
      canvas.hidden = true;
      span.style.color = "";
    };
  }, [text, enabled]);

  return (
    <span ref={spanRef} className="relative inline-block whitespace-nowrap">
      {text}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        hidden
        className="pointer-events-none absolute max-w-none"
      />
    </span>
  );
}

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { createField, settleField, type Field } from "@/lib/particle-field";

const bleed = 54;

type ParticleTextProps = {
  text: string;
};

export function ParticleText({ text }: ParticleTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion() === true;

  useEffect(() => {
    const span = spanRef.current;
    const canvas = canvasRef.current;
    if (!span || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let field: Field | null = null;
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const draw = () => {
      if (!field) return;
      const moving = settleField(field, pointer);
      context.setTransform(field.ratio, 0, 0, field.ratio, 0, 0);
      context.clearRect(0, 0, field.width, field.height);
      context.fillStyle = "#ffffff";
      context.beginPath();
      for (const dot of field.dots) {
        context.moveTo(dot.x + field.radius, dot.y);
        context.arc(dot.x, dot.y, field.radius, 0, Math.PI * 2);
      }
      context.fill();
      frame = moving || pointer ? requestAnimationFrame(draw) : 0;
    };

    const build = () => {
      const style = getComputedStyle(span);
      const box = span.getBoundingClientRect();
      field = createField({
        text,
        font: `420 ${style.fontSize} ${style.fontFamily}`,
        letterSpacing: style.letterSpacing,
        width: box.width + bleed * 2,
        height: box.height + bleed * 2,
        bleed,
        fontSize: parseFloat(style.fontSize),
        ratio: window.devicePixelRatio,
      });
      canvas.width = Math.round(field.width * field.ratio);
      canvas.height = Math.round(field.height * field.ratio);
      canvas.style.width = `${String(field.width)}px`;
      canvas.style.height = `${String(field.height)}px`;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };

    const onMove = (event: PointerEvent) => {
      if (reduceMotion) return;
      const box = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
      if (frame === 0) frame = requestAnimationFrame(draw);
    };
    const onLeave = () => {
      pointer = null;
    };

    void document.fonts.ready.then(build);
    const observer = new ResizeObserver(build);
    observer.observe(span);
    window.addEventListener("pointermove", onMove);
    span.addEventListener("pointerleave", onLeave);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      span.removeEventListener("pointerleave", onLeave);
    };
  }, [text, reduceMotion]);

  return (
    <span ref={spanRef} className="relative inline-block whitespace-nowrap text-transparent">
      {text}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ top: -bleed, left: -bleed }}
      />
    </span>
  );
}

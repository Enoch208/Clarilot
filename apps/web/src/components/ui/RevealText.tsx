import { useRef } from "react";
import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

type WordProps = {
  word: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
};

function Word({ word, progress, start, end }: WordProps) {
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  return <m.span style={{ opacity }}>{word} </m.span>;
}

type RevealTextProps = {
  text: string;
  className?: string;
  as?: "h2" | "p";
};

export function RevealText({ text, className = "", as = "p" }: RevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() === true;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.55"] });
  const words = text.split(" ");
  const Tag = as;
  return (
    <div ref={ref}>
      <Tag className={className}>
        {reduceMotion
          ? text
          : words.map((word, index) => (
              <Word
                key={`${word}-${String(index)}`}
                word={word}
                progress={scrollYProgress}
                start={index / words.length}
                end={(index + 1) / words.length}
              />
            ))}
      </Tag>
    </div>
  );
}

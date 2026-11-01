import { useRef } from "react";
import { LazyMotion, domAnimation, useInView } from "motion/react";
import { AboutSection } from "./AboutSection";
import { CtaSection } from "./CtaSection";
import { DifferenceSection } from "./DifferenceSection";
import { EvidenceSection } from "./EvidenceSection";
import { FeedSection } from "./FeedSection";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { Navbar } from "./Navbar";
import { SourceQuotes } from "./SourceQuotes";
import { SystemSection } from "./SystemSection";

export function Landing() {
  const lightRef = useRef<HTMLDivElement>(null);
  const light = useInView(lightRef, { margin: "-55% 0px -40% 0px" });
  return (
    <LazyMotion features={domAnimation} strict>
      <div className={`min-h-dvh transition-colors duration-700 ${light ? "bg-white" : "bg-ink"}`}>
        <Navbar />
        <main>
          <Hero />
          <SystemSection />
          <SourceQuotes />
          <EvidenceSection />
          <DifferenceSection />
          <div ref={lightRef}>
            <FeedSection />
            <AboutSection />
          </div>
          <CtaSection />
        </main>
        <Footer />
      </div>
    </LazyMotion>
  );
}

import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { Landing } from "@/components/landing/Landing";

const ConsolePage = lazy(() =>
  import("@/pages/ConsolePage").then((module) => ({ default: module.ConsolePage })),
);

export function App() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-mist" />}>
      <Routes>
        <Route path="/console" element={<ConsolePage />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </Suspense>
  );
}

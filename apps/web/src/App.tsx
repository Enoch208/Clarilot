import { Route, Routes } from "react-router";
import { Landing } from "@/components/landing/Landing";

export function App() {
  return (
    <Routes>
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

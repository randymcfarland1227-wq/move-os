import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MoveOS } from "../app/move-os";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MoveOS />
  </StrictMode>,
);

import "../../shared/styles.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App.tsx"
import { Open } from "./Open.tsx"

// `open.html` and `open-ssr.html` draw the second page.
const open = location.pathname.includes("open")
// In StrictMode, which a development build acts on (`dist/strict`): every effect runs, is
// undone and runs again, and every ref is handed over twice, as in a user's app while they
// write it. Nothing may depend on running once.
createRoot(document.getElementById("root")!).render(
  <StrictMode>{open ? <Open /> : <App />}</StrictMode>
)

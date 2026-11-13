import "../../shared/styles.css"
import { StrictMode } from "react"
import { hydrateRoot } from "react-dom/client"

import { App } from "./App.tsx"
import { Open } from "./Open.tsx"

// The page the server rendered (`ssr.html`), taken over where it stands.
// `open.html` and `open-ssr.html` draw the second page.
const open = location.pathname.includes("open")
hydrateRoot(document.getElementById("root")!, <StrictMode>{open ? <Open /> : <App />}</StrictMode>)

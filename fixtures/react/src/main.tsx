import "../../shared/styles.css"
import { createRoot } from "react-dom/client"

import { App } from "./App.tsx"
import { Open } from "./Open.tsx"

// `open.html` and `open-ssr.html` draw the second page.
const open = location.pathname.includes("open")
createRoot(document.getElementById("root")!).render(open ? <Open /> : <App />)

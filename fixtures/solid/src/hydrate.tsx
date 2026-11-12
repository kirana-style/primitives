import "../../shared/styles.css"
import { hydrate } from "solid-js/web"

import { App } from "./App.tsx"
import { Open } from "./Open.tsx"

// The page the server rendered (`ssr.html`), taken over where it stands.
// `open.html` and `open-ssr.html` draw the second page.
const open = location.pathname.includes("open")
hydrate(() => (open ? <Open /> : <App />), document.getElementById("root")!)

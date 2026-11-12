import "../../shared/styles.css"
import { hydrate } from "svelte"

import App from "./App.svelte"
import Open from "./Open.svelte"

// The page the server rendered (`ssr.html`), taken over where it stands.
// `open.html` and `open-ssr.html` draw the second page.
const open = location.pathname.includes("open")
hydrate(open ? Open : App, { target: document.getElementById("root")! })

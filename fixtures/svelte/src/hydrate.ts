import "../../shared/styles.css"
import { hydrate } from "svelte"

import App from "./App.svelte"

// The page the server rendered (`ssr.html`), taken over where it stands.
hydrate(App, { target: document.getElementById("root")! })

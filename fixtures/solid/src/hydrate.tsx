import "../../shared/styles.css"
import { hydrate } from "solid-js/web"

import { App } from "./App.tsx"

// The page the server rendered (`ssr.html`), taken over where it stands.
hydrate(() => <App />, document.getElementById("root")!)

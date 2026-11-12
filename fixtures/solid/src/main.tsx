import "../../shared/styles.css"
import { render } from "solid-js/web"

import { App } from "./App.tsx"
import { Open } from "./Open.tsx"

// `open.html` and `open-ssr.html` draw the second page.
const open = location.pathname.includes("open")
render(() => (open ? <Open /> : <App />), document.getElementById("root")!)

import "../../shared/styles.css"
import { mount } from "svelte"

import App from "./App.svelte"
import Open from "./Open.svelte"

// `open.html` and `open-ssr.html` draw the second page.
const open = location.pathname.includes("open")
mount(open ? Open : App, { target: document.getElementById("root")! })

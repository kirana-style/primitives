import "../../shared/styles.css"
import { createSSRApp } from "vue"

import App from "./App.vue"
import Open from "./Open.vue"

// The page the server rendered (`ssr.html`), taken over where it stands.
// `open.html` and `open-ssr.html` draw the second page.
const open = location.pathname.includes("open")
createSSRApp(open ? Open : App).mount("#root")

import "../../shared/styles.css"
import { createApp } from "vue"

import App from "./App.vue"
import Open from "./Open.vue"

// `open.html` and `open-ssr.html` draw the second page.
const open = location.pathname.includes("open")
createApp(open ? Open : App).mount("#root")

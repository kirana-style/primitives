import "../../shared/styles.css"
import { createSSRApp } from "vue"

import App from "./App.vue"

// The page the server rendered (`ssr.html`), taken over where it stands.
createSSRApp(App).mount("#root")

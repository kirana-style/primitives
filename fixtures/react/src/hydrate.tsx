import "../../shared/styles.css"
import { hydrateRoot } from "react-dom/client"

import { App } from "./App.tsx"

// The page the server rendered (`ssr.html`), taken over where it stands.
hydrateRoot(document.getElementById("root")!, <App />)

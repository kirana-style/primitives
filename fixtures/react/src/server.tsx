import { renderToString } from "react-dom/server"

import { App } from "./App.tsx"
import { Open } from "./Open.tsx"

/** The page as a server renders it: no DOM, no effects. */
export const render = (page?: string) => renderToString(page === "open" ? <Open /> : <App />)

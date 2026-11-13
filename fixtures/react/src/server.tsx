import { StrictMode } from "react"
import { renderToString } from "react-dom/server"

import { App } from "./App.tsx"
import { Open } from "./Open.tsx"

/** The page as a server renders it: no DOM, no effects. */
export const render = (page?: string) =>
  renderToString(<StrictMode>{page === "open" ? <Open /> : <App />}</StrictMode>)

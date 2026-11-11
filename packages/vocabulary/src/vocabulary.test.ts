import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vite-plus/test"

import { build, files } from "../../../scripts/vocabulary.ts"
import { Collapsible, Popover, exclusive } from "./keys.ts"

describe("the vocabulary", () => {
  // What is published is what the core's parts write: a part definition that changes without
  // `vp run vocabulary` fails here, and the diff of the generated files is the review.
  it("is the one the core's part definitions generate", () => {
    for (const [path, content] of Object.entries(files())) {
      expect(readFileSync(join(import.meta.dirname, "..", path), "utf8"), path).toBe(content)
    }
  })

  it("gives each state as a selector, by component and part", () => {
    expect(Collapsible.Panel.startingStyle).toBe("[data-starting-style]")
    expect(Popover.Popup.side.top).toBe('[data-side="top"]')
    expect(exclusive).toContainEqual(["[data-open]", "[data-closed]"])
  })

  it("names every state an exclusive group lists, and describes everything", () => {
    for (const { parts } of Object.values(build().components)) {
      for (const part of Object.values(parts)) {
        expect(part.description).not.toBe("")
        for (const group of part.exclusive) {
          for (const name of group) expect(part.states[name]?.selector, name).toBeDefined()
        }
        for (const state of Object.values(part.states)) expect(state.description).not.toBe("")
        for (const description of Object.values(part.variables)) expect(description).not.toBe("")
      }
    }
  })
})

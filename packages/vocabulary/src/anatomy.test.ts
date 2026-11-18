import { describe, expect, it } from "vite-plus/test"

import { FIXTURES, misplaced, placed, tree, unplaced } from "../../../scripts/anatomy.ts"
import type { Placed } from "../../../scripts/anatomy.ts"
import { vocabulary } from "./index.ts"
import { vocabulary as defined } from "../../core/src/vocabulary.ts"

const pascal = (name: string) => name[0]!.toUpperCase() + name.slice(1)

describe("the anatomy", () => {
  // A part with no place cannot be written from the data: every part names what it is inside,
  // and each component has one part that is inside nothing.
  it("gives every part of every component a place", () => {
    for (const [component, parts] of Object.entries(defined)) {
      expect(unplaced(pascal(component), parts), component).toEqual([])
      const drawn = new Set<string>()
      const walk = (branch: ReturnType<typeof tree>) => {
        if (!branch) return
        drawn.add(branch.part)
        branch.branches.forEach(walk)
      }
      walk(tree(parts))
      expect([...drawn].sort(), component).toEqual(Object.keys(parts).sort())
    }
  })

  it("is published with the vocabulary", () => {
    const { tabs, menu, select } = vocabulary.components
    expect(tabs.parts.tab.inside).toEqual(["list"])
    expect(tabs.parts.tab.repeated).toBe(true)
    expect(tabs.parts.root.inside).toEqual([])
    expect(menu.parts.portal.inside).toEqual(["root", "submenuRoot"])
    expect(select.parts.list.optional).toBe(true)
  })

  // The data is held against how the library's own pages are written: each fixture's source,
  // read with its framework's parser. A part written outside what the vocabulary says it is
  // inside fails here, and the fixture is the evidence: the conformance run plays it.
  for (const adapter of FIXTURES) {
    it(`is how the ${adapter} fixture writes its parts`, { timeout: 120_000 }, async () => {
      const all = await placed(adapter)
      expect(all.length).toBeGreaterThan(600)
      expect(misplaced(all)).toEqual([])
    })
  }

  it("says which part is misplaced, and where", () => {
    const part = (written: string, at: string, parent?: Placed): Placed => {
      const [component = "", name = ""] = written.split(".")
      return {
        adapter: "react",
        at,
        written,
        names: [{ component, part: name[0]!.toLowerCase() + name.slice(1) }],
        parent,
      }
    }
    const root = part("Tabs.Root", "page.tsx:1")
    const list = part("Tabs.List", "page.tsx:2", root)
    const panel = part("Tabs.Panel", "page.tsx:5", root)
    const fine = [root, list, part("Tabs.Tab", "page.tsx:3", list), panel]
    expect(misplaced(fine)).toEqual([])
    expect(misplaced([...fine, part("Tabs.Tab", "page.tsx:6", panel)])).toEqual([
      "page.tsx:6  Tabs.Tab: it is in Tabs's panel (page.tsx:5), and the vocabulary says list",
    ])
    // A part that is not said to be repeated is written once where it is.
    expect(misplaced([...fine, part("Tabs.List", "page.tsx:7", root)])).toEqual([
      "page.tsx:7  Tabs.List: written 2 times in one Tabs.Root (page.tsx:1), and the vocabulary does not say Tabs.list is repeated",
    ])
    // A component begins again inside itself.
    expect(misplaced([...fine, part("Tabs.Root", "page.tsx:8", panel)])).toEqual([])
  })
})

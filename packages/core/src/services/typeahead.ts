/** How long after the last letter the next one starts a new word, in milliseconds. */
export const TYPEAHEAD_RESET = 500

export interface Typeahead {
  /**
   * Adds a typed character and answers the candidate it names, if one does. `current` is the
   * index of the candidate the search starts from (the highlighted row, the chosen value), `-1`
   * for none.
   */
  match<Candidate extends { label: string }>(
    key: string,
    candidates: readonly Candidate[],
    current: number
  ): Candidate | undefined
  /** Forgets what was typed. */
  reset(): void
  /** Whether a word is being typed: the next key, a space too, goes on with it. */
  typing(): boolean
}

/**
 * An element's text as a person reads it: without what is `hidden`, and without what is hidden
 * from assistive technology (`aria-hidden`), such as a shortcut drawn beside a row's name. It is
 * what typing searches, and what a trigger shows for the row once it is chosen.
 */
export function textOf(element: Element): string {
  let text = ""
  for (const node of element.childNodes) {
    if (node.nodeType === 3) text += node.nodeValue ?? ""
    else if (
      node instanceof Element &&
      !node.hasAttribute("hidden") &&
      node.getAttribute("aria-hidden") !== "true"
    )
      text += textOf(node)
  }
  return text.replace(/\s+/g, " ").trim()
}

/** Whether a key press is a character to search with: not Space, not a shortcut. */
export function printable(event: KeyboardEvent): boolean {
  return (
    event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey
  )
}

/**
 * Finding a row by typing its name, as a native `<select>` and a menu do. Letters typed close
 * together make a word, matched against the start of each label without regard to case. A first
 * letter looks after the current row, so the row it is on is not found again; the same letter
 * repeated walks through the rows that start with it; a longer word stays on the current row
 * while it still matches.
 */
export function createTypeahead(): Typeahead {
  let typed = ""
  // On the clock that only goes forward: the wall clock can be set back between two keys.
  let typedAt = -Infinity

  return {
    match(key, candidates, current) {
      const now = performance.now()
      if (now - typedAt > TYPEAHEAD_RESET) typed = ""
      typedAt = now
      typed += key.toLowerCase()
      const repeated = typed.replaceAll(typed[0]!, "") === ""
      const query = repeated ? typed[0]! : typed
      const after = [...candidates.slice(current + 1), ...candidates.slice(0, current + 1)]
      const order =
        repeated || typed.length === 1 || current < 0 ? after : [candidates[current]!, ...after]
      return order.find((each) => each.label.toLowerCase().startsWith(query))
    },
    reset() {
      typed = ""
      typedAt = -Infinity
    },
    typing: () => typed !== "" && performance.now() - typedAt <= TYPEAHEAD_RESET,
  }
}

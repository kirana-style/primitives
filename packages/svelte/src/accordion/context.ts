import type { Accordion, AccordionItem } from "@kirana-ui/core/accordion"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Accordion")

export const provide = (controller: Accordion): Accordion => setContext(KEY, controller)

export function useAccordion(): Accordion {
  const controller = getContext<Accordion | undefined>(KEY)
  if (!controller) throw new Error("A Accordion part must be inside <Accordion.Root>")
  return controller
}

const ITEM = Symbol("AccordionItem")

export const provideItem = (item: AccordionItem): AccordionItem => setContext(ITEM, item)

export function useItem(): AccordionItem {
  const item = getContext<AccordionItem | undefined>(ITEM)
  if (!item) throw new Error("An Accordion part must be inside <Accordion.Item>")
  return item
}

import { defineComponent } from "./part.ts"
import { DISABLED, TRANSITION, state, valued } from "./states.ts"

const ORIENTATION = valued(
  "data-orientation",
  ["horizontal", "vertical"],
  "The way the tabs are laid out."
)

const DIRECTION = valued(
  "data-activation-direction",
  ["left", "right", "up", "down", "none"],
  "Where the newly active tab is from the one before, for a panel or a mark that slides."
)

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const tabsVocabulary = defineComponent({
  root: {
    description: "Groups the tabs and their panels.",
    states: { orientation: ORIENTATION, activationDirection: DIRECTION },
  },
  list: {
    description: "The row of tabs. The arrows move between them.",
    states: { orientation: ORIENTATION, activationDirection: DIRECTION },
  },
  tab: {
    description: "A button that shows its panel.",
    states: {
      active: state("data-active", "Present on the tab whose panel is shown."),
      disabled: DISABLED,
      orientation: ORIENTATION,
    },
  },
  indicator: {
    description: "A mark for the active tab: it carries that tab's position and size.",
    states: { orientation: ORIENTATION, activationDirection: DIRECTION },
    variables: {
      "--active-tab-left": "The active tab's distance from the list's left edge.",
      "--active-tab-right": "The active tab's distance from the list's right edge.",
      "--active-tab-top": "The active tab's distance from the list's top edge.",
      "--active-tab-bottom": "The active tab's distance from the list's bottom edge.",
      "--active-tab-width": "The active tab's width.",
      "--active-tab-height": "The active tab's height.",
    },
  },
  panel: {
    description: "A tab's content. In the page while its tab is active, and through its exit.",
    states: {
      hidden: state("data-hidden", "Present while its tab is not the active one."),
      orientation: ORIENTATION,
      activationDirection: DIRECTION,
      startingStyle: TRANSITION.startingStyle,
      endingStyle: TRANSITION.endingStyle,
    },
    exclusive: [["startingStyle", "endingStyle"]],
  },
})

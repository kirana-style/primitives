import { defineComponent } from "./part.ts"
import { state, valued } from "./states.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const avatarVocabulary = defineComponent({
  root: {
    description: "The frame the image and its stand-in share.",
    states: {
      imageLoadingStatus: valued(
        "data-image-loading-status",
        ["idle", "loading", "loaded", "error"],
        "Where the picture is in its loading: `idle` while it has no address."
      ),
    },
  },
  image: {
    inside: "root",
    description:
      "The picture. In the page once it has loaded; with `keepMounted` (on Angular, the attribute form) in the page all along, `aria-hidden` until it has loaded.",
    states: {
      loading: state(
        "data-loading",
        "Present while the picture loads, on an image kept in the page."
      ),
      error: state(
        "data-error",
        "Present when the picture cannot load, on an image kept in the page."
      ),
    },
  },
  fallback: {
    inside: "root",
    description:
      "What shows until the picture has loaded, or when it cannot; after its `delay`, when it has one.",
  },
})

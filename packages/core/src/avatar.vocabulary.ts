import { defineComponent } from "./part.ts"

// The component's parts as data, apart from its controller: a page that uses the component does
// not carry these descriptions.
export const avatarVocabulary = defineComponent({
  root: { description: "The frame the image and its stand-in share." },
  image: { inside: "root", description: "The picture. In the page once it has loaded." },
  fallback: {
    inside: "root",
    description: "What shows until the picture has loaded, or when it cannot.",
  },
})

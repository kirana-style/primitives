import type { AutocompleteProps } from "@kirana-ui/core/autocomplete"

import type { Renderless } from "../types.ts"

// Its parts are a combobox's.
export type {
  ClearProps,
  CollectionProps,
  EmptyProps,
  GroupLabelProps,
  GroupProps,
  InputProps,
  ItemProps,
  ListProps,
  PopupProps,
  PortalProps,
  PositionerProps,
  SeparatorProps,
  StatusProps,
  TriggerProps,
} from "../combobox/types.ts"

/** A combobox whose text is the value: `bind:value` is the text. It draws nothing. */
export type RootProps = Renderless<AutocompleteProps>

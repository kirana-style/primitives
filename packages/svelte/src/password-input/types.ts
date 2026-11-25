import type { PasswordInputProps } from "@kirana-ui/core/password-input"

import type { PartAttributes, StateFor } from "../types.ts"

/** `bind:visible` is whether the password can be read. Inside a `<Field.Root>` its input is the field's control. */
export type RootProps = PartAttributes<"div", StateFor<"passwordInput", "root">, PasswordInputProps>

/** It takes what an `<input>` takes (`value`, `autocomplete`). */
export type InputProps = PartAttributes<"input", StateFor<"passwordInput", "input">>

export type ToggleProps = PartAttributes<"button", StateFor<"passwordInput", "toggle">>

export type IndicatorProps = PartAttributes<"span", StateFor<"passwordInput", "indicator">>

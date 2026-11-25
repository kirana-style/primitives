import {
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { effect } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createEditable } from "@kirana-ui/core/editable"
import type { Editable, EditableProps } from "@kirana-ui/core/editable"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import { KP_FIELD } from "./field-token"
import { KpIds, hostPart, inputsSignal, mounted, onServer, ownText, statePart } from "./runtime"

/**
 * On the element that holds the editable's parts. `[(value)]` is the text, `[(editing)]` whether
 * it is being edited. With a name, its input is what a form reads.
 */
@Directive({ selector: "[kpEditable]", exportAs: "kpEditable" })
export class KpEditable implements OnInit {
  readonly value = model<string | undefined>(undefined)
  readonly defaultValue = input<string>()
  readonly editing = model<boolean | undefined>(undefined)
  readonly defaultEditing = input(false, { transform: booleanAttribute })
  /** What the preview shows while the text is empty. */
  readonly placeholder = input<string>()
  /** What on the preview starts an edit. Default `"focus"`. */
  readonly activation = input<EditableProps["activation"]>()
  /** Whether focus leaving the input keeps the edit (the default) or drops it. */
  readonly submitOnBlur = input(undefined, {
    transform: (value: unknown) => (value == null ? undefined : booleanAttribute(value)),
  })
  /** Whether the text is selected as editing starts. Default `true`. */
  readonly selectOnFocus = input(undefined, {
    transform: (value: unknown) => (value == null ? undefined : booleanAttribute(value)),
  })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  /** Needed: in a field, leaving it empty is then invalid. */
  readonly required = input(false, { transform: booleanAttribute })
  /** The name it is submitted under; in a field, the field's by default. */
  readonly name = input<string>()
  /** The id of the form the input belongs to, when it is not inside it. */
  readonly form = input<string>()
  /** The input's id, which a `<label for>` names. Inside a field, the field's id unless the input has one of its own. */
  readonly kpId = input<string>()
  /** An edit about to be kept; `details.cancel()` keeps the text, and the edit open. */
  readonly valueChanged = output<{ value: string; details: ChangeDetails }>()
  /** Editing about to start or end; `details.cancel()` keeps it as it was. */
  readonly editingChanged = output<{ editing: boolean; details: ChangeDetails }>()

  controller!: Editable
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    editing: this.editing(),
    defaultEditing: this.defaultEditing(),
    placeholder: this.placeholder(),
    activation: this.activation(),
    submitOnBlur: this.submitOnBlur(),
    selectOnFocus: this.selectOnFocus(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    onValueChange: (value: string, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
    onEditingChange: (editing: boolean, details: ChangeDetails) => {
      this.editingChanged.emit({ editing, details })
      if (!details.canceled) {
        this.editing.set(editing)
        this.props.sync()
      }
    },
  }))
  private readonly part = statePart<StateOf<Vocabulary["editable"]["root"]>>()
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.part.state
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createEditable(this.props(), { field: this.field?.controller })
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

/** Says the text, or the placeholder while there is none, unless the element has content of its own. */
@Directive({ selector: "[kpEditablePreview]" })
export class KpEditablePreview implements OnInit {
  private readonly root = inject(KpEditable)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly destroy = inject(DestroyRef)
  private readonly part = hostPart()
  private readonly server = onServer()

  ngOnInit(): void {
    this.part(this.root.controller.preview)
    // Content of the element's own is what it says.
    const text = ownText(this.element, this.server)
    if (!text) return
    this.destroy.onDestroy(
      effect(() => {
        text.data = this.root.controller.text.get()
      })
    )
  }
}

function part(name: "editTrigger" | "submitTrigger" | "cancelTrigger") {
  const root = inject(KpEditable)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** `<input kpEditableInput>` or `<textarea kpEditableInput>`: in the page always, hidden unless editing. */
@Directive({ selector: "[kpEditableInput]" })
export class KpEditableInput implements OnInit {
  private readonly root = inject(KpEditable)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.input)
  }
}

@Directive({ selector: "[kpEditableEditTrigger]" })
export class KpEditableEditTrigger implements OnInit {
  private readonly init = part("editTrigger")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpEditableSubmitTrigger]" })
export class KpEditableSubmitTrigger implements OnInit {
  private readonly init = part("submitTrigger")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpEditableCancelTrigger]" })
export class KpEditableCancelTrigger implements OnInit {
  private readonly init = part("cancelTrigger")

  ngOnInit(): void {
    this.init()
  }
}

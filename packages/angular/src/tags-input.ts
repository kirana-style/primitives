import {
  DestroyRef,
  Directive,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from "@angular/core"
import type { EmbeddedViewRef, OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { effect } from "@kirana-ui/core"
import { createTagsInput } from "@kirana-ui/core/tags-input"
import type { TagsInput, TagsInputEntry } from "@kirana-ui/core/tags-input"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import { KP_DIRECTION } from "./direction-token"
import { KP_FIELD } from "./field-token"
import {
  KpIds,
  drawing,
  hostPart,
  innerPart,
  inputsSignal,
  mounted,
  onServer,
  ownText,
  statePart,
} from "./runtime"

type Parts = Vocabulary["tagsInput"]

const optionalNumber = (value: unknown) => (value == null ? undefined : numberAttribute(value))
const optionalBoolean = (value: unknown) => (value == null ? undefined : booleanAttribute(value))

/**
 * On the element that holds the tags' parts. `[(value)]` is the tags, in order. It draws the
 * hidden input a form reads as its last child; with a name, each tag is submitted under it.
 */
@Directive({ selector: "[kpTagsInput]", exportAs: "kpTagsInput" })
export class KpTagsInput implements OnInit {
  readonly value = model<readonly string[] | undefined>(undefined)
  readonly defaultValue = input<readonly string[]>()
  /** Whether a text may be a tag. Asked after the text is trimmed, and not for an empty one. */
  readonly validate = input<(text: string, value: readonly string[]) => boolean>()
  /** How many tags it holds at most. */
  readonly max = input(undefined, { transform: optionalNumber })
  /** Whether the same text may be a tag twice. Default `false`. */
  readonly allowDuplicates = input(undefined, { transform: optionalBoolean })
  /** What ends a tag as it is typed or pasted, beside Enter. Default `","`. `null` for nothing. */
  readonly delimiter = input<string | RegExp | null>()
  /** Whether what is typed becomes a tag as focus leaves the input. Default `false`. */
  readonly addOnBlur = input(undefined, { transform: optionalBoolean })
  /** Whether a pasted text is cut into tags at its delimiters and line ends. Default `true`. */
  readonly addOnPaste = input(undefined, { transform: optionalBoolean })
  /** Whether a tag can be edited in place, by two presses or Enter on it. Default `true`. */
  readonly editable = input(undefined, { transform: optionalBoolean })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly kpId = input<string>()
  /** The tags about to change; `details.cancel()` keeps them as they were. */
  readonly valueChanged = output<{ value: string[]; details: ChangeDetails }>()
  /** A text that was not made a tag, and why. */
  readonly valueInvalid = output<{ text: string; reason: "duplicate" | "max" | "invalid" }>()

  controller!: TagsInput
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    validate: this.validate(),
    max: this.max(),
    allowDuplicates: this.allowDuplicates(),
    delimiter: this.delimiter(),
    addOnBlur: this.addOnBlur(),
    addOnPaste: this.addOnPaste(),
    editable: this.editable(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    onValueChange: (value: string[], details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      // Written back only to a caller who holds it.
      if (!details.canceled && this.value() !== undefined) {
        this.value.set(value)
        this.props.sync()
      }
    },
    onValueInvalid: (text: string, reason: "duplicate" | "max" | "invalid") =>
      this.valueInvalid.emit({ text, reason }),
  }))
  private readonly part = statePart<StateOf<Parts["root"]>>()
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.part.state
  private readonly inner = innerPart("input")
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createTagsInput(this.props(), {
      field: this.field?.controller,
      direction: this.around?.direction,
    })
    this.part(this.controller.root)
    this.inner(this.controller.hiddenInput)
    this.mount(this.controller)
  }
}

function part(name: "list" | "input" | "clear") {
  const root = inject(KpTagsInput)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** What holds the tags: a list. */
@Directive({ selector: "[kpTagsInputList]" })
export class KpTagsInputList implements OnInit {
  private readonly init = part("list")

  ngOnInit(): void {
    this.init()
  }
}

type Drawn = EmbeddedViewRef<{ $implicit: TagsInputEntry }>

/** `<span *kpTagsInputItems="let entry">`: once for each tag, kept by the tag's key. */
@Directive({ selector: "[kpTagsInputItems]" })
export class KpTagsInputItems implements OnInit {
  private readonly root = inject(KpTagsInput)
  private readonly template = inject<TemplateRef<{ $implicit: TagsInputEntry }>>(TemplateRef)
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)
  private readonly server = onServer()
  private readonly views = new Map<string, Drawn>()

  ngOnInit(): void {
    const draw = (entries: readonly TagsInputEntry[]) => {
      // By key: a tag that stays keeps its element, and focus with it.
      const wanted = new Set(entries.map((each) => each.key))
      for (const [key, view] of this.views) {
        if (wanted.has(key)) continue
        view.destroy()
        this.views.delete(key)
      }
      entries.forEach((entry, at) => {
        let view = this.views.get(entry.key)
        if (!view) {
          view = this.container.createEmbeddedView(this.template, { $implicit: entry }, at)
          this.views.set(entry.key, view)
        } else {
          view.context.$implicit = entry
          // Only a twin's key can change places; anything else that stays is already in order.
          if (this.container.indexOf(view) !== at) this.container.move(view, at)
        }
        view.detectChanges()
      })
    }
    if (this.server) return draw(this.root.controller.entries.peek())
    this.destroy.onDestroy(
      effect(() => {
        const entries = this.root.controller.entries.get()
        drawing(() => draw(entries))
      })
    )
  }

  static ngTemplateContextGuard(
    _directive: KpTagsInputItems,
    _context: unknown
  ): _context is { $implicit: TagsInputEntry } {
    return true
  }
}

/**
 * A tag, on the element `*kpTagsInputItems` draws for it. `state()` is its state, for the
 * template (`#tag="kpTagsInputItem"`, `tag.state().editing`).
 */
@Directive({ selector: "[kpTagsInputItem]", exportAs: "kpTagsInputItem" })
export class KpTagsInputItem implements OnInit {
  /** The tag it is, as `*kpTagsInputItems` gave it. */
  readonly entry = input.required<TagsInputEntry>()
  readonly root = inject(KpTagsInput)
  private readonly put = statePart<StateOf<Parts["item"]>>()
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.put.state

  ngOnInit(): void {
    this.put(this.root.controller.item(this.entry().key))
  }
}

/** A part of the tag its `kpTagsInputItem` is. */
function inItem(name: "itemInput" | "itemRemove") {
  const item = inject(KpTagsInputItem)
  const put = hostPart()
  return () => put(item.root.controller[name](item.entry().key))
}

/** Says the tag's text unless the element has content of its own. Hidden while the tag is edited. */
@Directive({ selector: "[kpTagsInputItemText]" })
export class KpTagsInputItemText implements OnInit {
  private readonly item = inject(KpTagsInputItem)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly put = hostPart()
  private readonly server = onServer()

  ngOnInit(): void {
    const entry = this.item.entry()
    this.put(this.item.root.controller.itemText(entry.key))
    // A tag's key is its text: the text never changes while the element is there.
    const text = ownText(this.element, this.server)
    if (text) text.data = entry.value
  }
}

/** `<input kpTagsInputItemInput>`: where a tag is edited in place, hidden unless it is. */
@Directive({ selector: "input[kpTagsInputItemInput]" })
export class KpTagsInputItemInput implements OnInit {
  private readonly init = inItem("itemInput")

  ngOnInit(): void {
    this.init()
  }
}

/** A tag's button that takes it away. */
@Directive({ selector: "[kpTagsInputItemRemove]" })
export class KpTagsInputItemRemove implements OnInit {
  private readonly init = inItem("itemRemove")

  ngOnInit(): void {
    this.init()
  }
}

/** `<input kpTagsInputInput>`: where a new tag is typed. */
@Directive({ selector: "input[kpTagsInputInput]" })
export class KpTagsInputInput implements OnInit {
  private readonly init = part("input")

  ngOnInit(): void {
    this.init()
  }
}

/** Takes every tag away: hidden while there is none. */
@Directive({ selector: "[kpTagsInputClear]" })
export class KpTagsInputClear implements OnInit {
  private readonly init = part("clear")

  ngOnInit(): void {
    this.init()
  }
}

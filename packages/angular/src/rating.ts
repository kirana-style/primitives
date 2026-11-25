import {
  DestroyRef,
  Directive,
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
import { effect } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createRating } from "@kirana-ui/core/rating"
import type { Rating } from "@kirana-ui/core/rating"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import { KP_DIRECTION } from "./direction-token"
import { KP_FIELD } from "./field-token"
import { KpIds, drawing, innerPart, inputsSignal, mounted, onServer, statePart } from "./runtime"

type Parts = Vocabulary["rating"]

const optionalNumber = (value: unknown) => (value == null ? undefined : numberAttribute(value))

/**
 * On the element that holds the items. `[(value)]` is how much is given, from 0 to `count`. It
 * draws the hidden input a form reads, as its last child.
 */
@Directive({ selector: "[kpRating]", exportAs: "kpRating" })
export class KpRating implements OnInit {
  readonly value = model<number | undefined>(undefined)
  readonly defaultValue = input(undefined, { transform: optionalNumber })
  /** How many items there are. Default 5. */
  readonly count = input(undefined, { transform: optionalNumber })
  readonly allowHalf = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly kpId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly valueChanged = output<{ value: number; details: ChangeDetails }>()
  /** The value the pointer is over, and `null` as it leaves: nothing is chosen by it. */
  readonly hoverChanged = output<number | null>()

  controller!: Rating
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    count: this.count(),
    allowHalf: this.allowHalf(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    onValueChange: (value: number, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
    onHoverChange: (value: number | null) => this.hoverChanged.emit(value),
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
    this.controller = createRating(this.props(), {
      field: this.field?.controller,
      direction: this.around?.direction,
    })
    this.part(this.controller.root)
    this.inner(this.controller.input)
    this.mount(this.controller)
  }
}

type Drawn = EmbeddedViewRef<{ $implicit: number }>

/** `<ng-container *kpRatingItems="let place">`: once for each item, from 1 to `count`. */
@Directive({ selector: "[kpRatingItems]" })
export class KpRatingItems implements OnInit {
  private readonly root = inject(KpRating)
  private readonly template = inject<TemplateRef<{ $implicit: number }>>(TemplateRef)
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)
  private readonly server = onServer()
  private readonly views = new Map<number, Drawn>()

  ngOnInit(): void {
    const draw = (places: readonly number[]) => {
      // By place: an item that stays keeps its element, and focus with it.
      const wanted = new Set(places)
      for (const [place, view] of this.views) {
        if (wanted.has(place)) continue
        view.destroy()
        this.views.delete(place)
      }
      // Places only ever ascend from 1, so what stays is in order and only the new are added.
      places.forEach((place, at) => {
        let view = this.views.get(place)
        if (!view) {
          view = this.container.createEmbeddedView(this.template, { $implicit: place }, at)
          this.views.set(place, view)
        }
        view.detectChanges()
      })
    }
    if (this.server) return draw(this.root.controller.places.peek())
    this.destroy.onDestroy(
      effect(() => {
        const places = this.root.controller.places.get()
        drawing(() => draw(places))
      })
    )
  }

  static ngTemplateContextGuard(
    _directive: KpRatingItems,
    _context: unknown
  ): _context is { $implicit: number } {
    return true
  }
}

/**
 * One item, at its `place`. `state()` is its state, for the template: `#star="kpRatingItem"`,
 * then `@if (star.state().half) { … }`.
 */
@Directive({ selector: "[kpRatingItem]", exportAs: "kpRatingItem" })
export class KpRatingItem implements OnInit {
  /** Its place among the items, from 1. */
  readonly place = input.required({ transform: numberAttribute })
  private readonly root = inject(KpRating)
  private readonly put = statePart<StateOf<Parts["item"]>>()
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.put.state

  ngOnInit(): void {
    this.put(this.root.controller.item(this.place()))
  }
}

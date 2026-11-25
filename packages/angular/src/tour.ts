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
import { createTour } from "@kirana-ui/core/tour"
import type { Tour, TourStep } from "@kirana-ui/core/tour"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import { KP_DIRECTION } from "./direction-token"
import {
  KpIds,
  KpPositioner,
  binder,
  drawing,
  hostPart,
  inputsSignal,
  mounted,
  presentWhile,
  statePart,
} from "./runtime"

const optionalNumber = (value: unknown) => (value == null ? undefined : numberAttribute(value))

/**
 * `<ng-container kpTour [steps]="steps" [(open)]="touring">`: a tour of the page, a step at a
 * time. It draws no element of its own. `[(step)]` is the index of the step asked for, from 0.
 */
@Directive({ selector: "[kpTour]", exportAs: "kpTour" })
export class KpTour<Step extends TourStep = TourStep> implements OnInit {
  /**
   * The steps, in order: each a `TourStep` (an `id`, and a `target`, `side` and `align` where it
   * has them) with whatever else the page draws it from, such as
   * `[{ id: "search", target: "#search", title: "Find anything" }]`.
   */
  readonly steps = input.required<readonly Step[]>()
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly step = model<number | undefined>(undefined)
  /** The step it starts at, when the caller does not hold `step`. Read once. Default 0. */
  readonly defaultStep = input(undefined, { transform: optionalNumber })
  /** How long a step waits for a target that is not in the page, in milliseconds. Default 1000. */
  readonly waitForTarget = input(undefined, { transform: optionalNumber })
  /** The room between the target and the edge of the spotlight's hole, in pixels. Default 4. */
  readonly spotlightPadding = input(undefined, { transform: optionalNumber })
  /** Whether a press on the dimmed page ends the tour. Default `false`. */
  readonly closeOnOutsidePress = input(false, { transform: booleanAttribute })
  /** Whether the target can be used while its step is shown. Default `false`. */
  readonly interactive = input(false, { transform: booleanAttribute })
  /** Whether ArrowRight and ArrowLeft go on and back a step. Default `true`. */
  readonly keyboardNavigation = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  readonly kpId = input<string>()
  /** As it is about to open or close; `details.cancel()` keeps it as it was. */
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()
  /** As another step is about to be shown; `details.cancel()` keeps it as it was. */
  readonly stepChanged = output<{ step: number; details: ChangeDetails }>()

  controller!: Tour<Step>
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    steps: this.steps(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    step: this.step(),
    defaultStep: this.defaultStep(),
    waitForTarget: this.waitForTarget(),
    spotlightPadding: this.spotlightPadding(),
    closeOnOutsidePress: this.closeOnOutsidePress(),
    interactive: this.interactive(),
    keyboardNavigation: this.keyboardNavigation(),
    onOpenChange: (open: boolean, details: ChangeDetails) => {
      this.openChanged.emit({ open, details })
      if (!details.canceled) {
        this.open.set(open)
        this.props.sync()
      }
    },
    onStepChange: (step: number, details: ChangeDetails) => {
      this.stepChanged.emit({ step, details })
      if (!details.canceled) {
        this.step.set(step)
        this.props.sync()
      }
    },
  }))
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createTour(this.props(), { direction: this.around?.direction })
    this.mount(this.controller)
  }
}

/** `<ng-container *kpTourPortal>`: what it holds is drawn at the end of `<body>` while a step is shown. */
@Directive({ selector: "[kpTourPortal]" })
export class KpTourPortal implements OnInit {
  private readonly root = inject(KpTour)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

@Directive({ selector: "[kpTourPositioner]" })
export class KpTourPositioner extends KpPositioner {
  private readonly root = inject(KpTour)

  protected placed() {
    return this.root.controller
  }
}

/** What the popup's template is told of the step it shows, to draw it. */
export interface TourShownStep<Step extends TourStep = TourStep> {
  /** The step shown, as the page gave it; `undefined` while none is. */
  step: Step | undefined
  /** Its index, from 0. */
  index: number
  /** Its place, from 1: the "2" of "2 of 5". */
  current: number
  /** How many steps there are: the "5" of "2 of 5". */
  total: number
}

/** The popup's template context: the step shown, whole and by its names. */
export type TourPopupContext<Step extends TourStep = TourStep> = TourShownStep<Step> & {
  $implicit: TourShownStep<Step>
}

/**
 * `<div *kpTourPopup="let shown">`: the step, drawn by its template from the step shown
 * (`shown.step`, `shown.index`, `shown.current`, `shown.total`, each also given by its name:
 * `let current = current`).
 */
@Directive({ selector: "[kpTourPopup]" })
export class KpTourPopup implements OnInit {
  private readonly root = inject(KpTour)
  private readonly template = inject<TemplateRef<TourPopupContext>>(TemplateRef)
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)
  private readonly put = binder()

  ngOnInit(): void {
    const { controller } = this.root
    let view: EmbeddedViewRef<TourPopupContext> | undefined
    let unbind: (() => void) | undefined
    this.destroy.onDestroy(() => unbind?.())
    this.destroy.onDestroy(
      effect(() => {
        const shown: TourShownStep = {
          step: controller.shown.get(),
          index: controller.index.get(),
          current: controller.current.get(),
          total: controller.total.get(),
        }
        const context: TourPopupContext = { ...shown, $implicit: shown }
        if (view) {
          Object.assign(view.context, context)
          const kept = view
          drawing(() => kept.detectChanges())
          return
        }
        drawing(() => {
          const made = this.container.createEmbeddedView(this.template, context)
          view = made
          // The content first, then the part, as every part a template draws.
          made.detectChanges()
          const element = (made.rootNodes as Node[]).find(
            (each): each is HTMLElement => each.nodeType === 1
          )
          if (element) unbind = this.put(element, controller.popup)
        })
      })
    )
  }

  static ngTemplateContextGuard(
    _directive: KpTourPopup,
    _context: unknown
  ): _context is TourPopupContext {
    return true
  }
}

function part(name: "spotlight" | "arrow" | "title" | "description" | "previous" | "close") {
  const root = inject(KpTour)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** A layer over the page with a hole over the target. */
@Directive({ selector: "[kpTourSpotlight]" })
export class KpTourSpotlight implements OnInit {
  private readonly init = part("spotlight")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpTourArrow]" })
export class KpTourArrow implements OnInit {
  private readonly init = part("arrow")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpTourTitle]" })
export class KpTourTitle implements OnInit {
  private readonly init = part("title")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpTourDescription]" })
export class KpTourDescription implements OnInit {
  private readonly init = part("description")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpTourPrevious]" })
export class KpTourPrevious implements OnInit {
  private readonly init = part("previous")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * Goes on a step; on the last, it finishes the tour. `state()` is its state, for the template:
 * `#next="kpTourNext"`, then `@if (next.state().last) { Finish } @else { Next }`.
 */
@Directive({ selector: "[kpTourNext]", exportAs: "kpTourNext" })
export class KpTourNext implements OnInit {
  private readonly root = inject(KpTour)
  private readonly put = statePart<StateOf<Vocabulary["tour"]["next"]>>()
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.put.state

  ngOnInit(): void {
    this.put(this.root.controller.next)
  }
}

@Directive({ selector: "[kpTourClose]" })
export class KpTourClose implements OnInit {
  private readonly init = part("close")

  ngOnInit(): void {
    this.init()
  }
}

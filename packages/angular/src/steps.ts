import {
  Directive,
  booleanAttribute,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails, Orientation, StateOf } from "@kirana-ui/core"
import { createSteps } from "@kirana-ui/core/steps"
import type { Steps, StepsItem } from "@kirana-ui/core/steps"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import { KP_DIRECTION } from "./direction-token"
import { KpIds, hostPart, inputsSignal, mounted, statePart } from "./runtime"

type Parts = Vocabulary["steps"]

const optionalNumber = (value: unknown) => (value == null ? undefined : numberAttribute(value))

/**
 * On the element that holds the steps. `[(step)]` is the step shown, from 0; equal to `count`,
 * every step is done. `state()` is its state, for the template (`#steps="kpSteps"`).
 */
@Directive({ selector: "[kpSteps]", exportAs: "kpSteps" })
export class KpSteps implements OnInit {
  readonly step = model<number | undefined>(undefined)
  readonly defaultStep = input(undefined, { transform: optionalNumber })
  /**
   * How many steps there are. Left out, the items in the page, once they are there; until then
   * (and on a server) none is the last.
   */
  readonly count = input(undefined, { transform: optionalNumber })
  /** In order only: a step that is not done yet cannot be gone to by its trigger. */
  readonly linear = input(false, { transform: booleanAttribute })
  readonly orientation = input<Orientation>()
  readonly kpId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the step. */
  readonly stepChanged = output<{ step: number; details: ChangeDetails }>()

  controller!: Steps
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    step: this.step(),
    defaultStep: this.defaultStep(),
    count: this.count(),
    linear: this.linear(),
    orientation: this.orientation(),
    onStepChange: (step: number, details: ChangeDetails) => {
      this.stepChanged.emit({ step, details })
      if (!details.canceled) {
        this.step.set(step)
        this.props.sync()
      }
    },
  }))
  private readonly part = statePart<StateOf<Parts["root"]>>()
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.part.state
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createSteps(this.props(), { direction: this.around?.direction })
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

function part(name: "list" | "completed" | "previous" | "next") {
  const root = inject(KpSteps)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** The row of steps. */
@Directive({ selector: "[kpStepsList]" })
export class KpStepsList implements OnInit {
  private readonly init = part("list")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * One step of the row, around its trigger and its separator. `state()` is its state, for the
 * template (`#step="kpStepsItem"`, `step.state().complete`).
 */
@Directive({ selector: "[kpStepsItem]", exportAs: "kpStepsItem" })
export class KpStepsItem implements OnInit {
  /**
   * Which step it is, from 0. Left out, its place among the items in the page, once it is
   * there: give it on a page a server draws, which cannot count them.
   */
  readonly index = input(undefined, { transform: optionalNumber })
  readonly root = inject(KpSteps)
  item!: StepsItem
  private readonly put = statePart<StateOf<Parts["item"]>>()
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.put.state

  ngOnInit(): void {
    this.item = this.root.controller.item(this.index())
    this.put(this.item)
  }
}

/** A part of the step its `kpStepsItem` is, its state given to the template too. */
function inItem<State extends object>(name: "trigger" | "indicator") {
  const item = inject(KpStepsItem)
  const put = statePart<State>()
  return Object.assign(() => put(item.root.controller[name](item.item.index)), {
    state: put.state,
  })
}

/** What names a step and goes to it. `state()` is its state, for the template. */
@Directive({ selector: "[kpStepsTrigger]", exportAs: "kpStepsTrigger" })
export class KpStepsTrigger implements OnInit {
  private readonly init = inItem<StateOf<Parts["trigger"]>>("trigger")
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.init.state

  ngOnInit(): void {
    this.init()
  }
}

/**
 * A step's mark: its number, or a tick once it is done. `state()` is its state, for the
 * template: `<span kpStepsIndicator #mark="kpStepsIndicator">`, then
 * `@if (mark.state().complete) { … }`.
 */
@Directive({ selector: "[kpStepsIndicator]", exportAs: "kpStepsIndicator" })
export class KpStepsIndicator implements OnInit {
  private readonly init = inItem<StateOf<Parts["indicator"]>>("indicator")
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.init.state

  ngOnInit(): void {
    this.init()
  }
}

/** The line from a step to the next. */
@Directive({ selector: "[kpStepsSeparator]" })
export class KpStepsSeparator implements OnInit {
  private readonly item = inject(KpStepsItem)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.item.root.controller.separator(this.item.item.index))
  }
}

/** What a step shows: in the page always, hidden unless its step is the one shown. */
@Directive({ selector: "[kpStepsContent]" })
export class KpStepsContent implements OnInit {
  /** The step it is shown for, from 0. */
  readonly index = input.required({ transform: numberAttribute })
  private readonly root = inject(KpSteps)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.content(this.index()))
  }
}

/** What is shown once every step is done. */
@Directive({ selector: "[kpStepsCompleted]" })
export class KpStepsCompleted implements OnInit {
  private readonly init = part("completed")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpStepsPrevious]" })
export class KpStepsPrevious implements OnInit {
  private readonly init = part("previous")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpStepsNext]" })
export class KpStepsNext implements OnInit {
  private readonly init = part("next")

  ngOnInit(): void {
    this.init()
  }
}

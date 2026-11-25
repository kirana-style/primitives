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
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createSteps } from "@kirana-ui/core/steps"
import type { Steps } from "@kirana-ui/core/steps"

import { KP_DIRECTION } from "./direction-token"
import { KpIds, hostPart, inputsSignal, mounted } from "./runtime"

const optionalNumber = (value: unknown) => (value == null ? undefined : numberAttribute(value))

/** On the element that holds the steps. `[(step)]` is the step shown, from 0; equal to `count`, every step is done. */
@Directive({ selector: "[kpSteps]", exportAs: "kpSteps" })
export class KpSteps implements OnInit {
  readonly step = model<number | undefined>(undefined)
  readonly defaultStep = input(undefined, { transform: optionalNumber })
  /** How many steps there are. */
  readonly count = input.required({ transform: numberAttribute })
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
  private readonly part = hostPart()
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

/** One step of the row, around its trigger and its separator. */
@Directive({ selector: "[kpStepsItem]" })
export class KpStepsItem implements OnInit {
  /** Which step it is, from 0. */
  readonly index = input.required({ transform: numberAttribute })
  readonly root = inject(KpSteps)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.item(this.index()))
  }
}

/** A part of the step its `kpStepsItem` is. */
function inItem(name: "trigger" | "indicator" | "separator") {
  const item = inject(KpStepsItem)
  const put = hostPart()
  return () => put(item.root.controller[name](item.index()))
}

/** What names a step and goes to it. */
@Directive({ selector: "[kpStepsTrigger]" })
export class KpStepsTrigger implements OnInit {
  private readonly init = inItem("trigger")

  ngOnInit(): void {
    this.init()
  }
}

/** A step's mark: its number, or a tick once it is done. */
@Directive({ selector: "[kpStepsIndicator]" })
export class KpStepsIndicator implements OnInit {
  private readonly init = inItem("indicator")

  ngOnInit(): void {
    this.init()
  }
}

/** The line from a step to the next. */
@Directive({ selector: "[kpStepsSeparator]" })
export class KpStepsSeparator implements OnInit {
  private readonly init = inItem("separator")

  ngOnInit(): void {
    this.init()
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

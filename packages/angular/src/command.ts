import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCommand } from "@kirana-ui/core/command"
import type { Command, CommandGroup, CommandProps } from "@kirana-ui/core/command"

import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiCommand]", exportAs: "kuiCommand" })
export class KuiCommand implements OnInit {
  readonly inputValue = model<string | undefined>(undefined)
  readonly defaultInputValue = input<string>()
  /** Whether an item is shown for what was typed; `null` shows every item. */
  readonly filter = input<CommandProps["filter"]>()
  readonly loop = input(false, { transform: booleanAttribute })
  /** Whether the first item shown is highlighted from the start. Default: `true`. */
  readonly autoHighlight = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  readonly inputValueChanged = output<{ value: string; details: ChangeDetails }>()
  /** An item was chosen. */
  readonly itemSelected = output<{ value: string; details: ChangeDetails }>()

  controller!: Command
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kuiId() ?? this.generated,
    inputValue: this.inputValue(),
    defaultInputValue: this.defaultInputValue(),
    filter: this.filter(),
    loop: this.loop(),
    autoHighlight: this.autoHighlight(),
    disabled: this.disabled(),
    onInputValueChange: (value: string, details: ChangeDetails) => {
      this.inputValueChanged.emit({ value, details })
      if (details.canceled) return
      this.inputValue.set(value)
      this.props.sync()
    },
    onSelect: (value: string, details: ChangeDetails) => this.itemSelected.emit({ value, details }),
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createCommand(this.props())
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

function part(name: "input" | "list") {
  const root = inject(KuiCommand)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiCommandInput]" })
export class KuiCommandInput implements OnInit {
  private readonly init = part("input")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiCommandList]" })
export class KuiCommandList implements OnInit {
  private readonly init = part("list")

  ngOnInit(): void {
    this.init()
  }
}

/** `<div *kuiCommandEmpty>`: in the page while no item is shown for what was typed. */
@Directive({ selector: "[kuiCommandEmpty]" })
export class KuiCommandEmpty implements OnInit {
  private readonly root = inject(KuiCommand)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.present(this.root.controller.empty, this.root.controller.emptyPart)
  }
}

/** Items under a `kuiCommandGroupHeading`. Hidden while none of them is shown. */
@Directive({ selector: "[kuiCommandGroup]" })
export class KuiCommandGroup implements OnInit {
  readonly kuiId = input<string>()
  group!: CommandGroup
  private readonly root = inject(KuiCommand)
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.group = this.root.controller.group(this.kuiId() ?? this.generated)
    this.put(this.group.part)
  }
}

@Directive({ selector: "[kuiCommandGroupHeading]" })
export class KuiCommandGroupHeading implements OnInit {
  private readonly root = inject(KuiCommand)
  private readonly within = inject(KuiCommandGroup, { optional: true })
  private readonly put = hostPart()

  ngOnInit(): void {
    // With no group around it, a line of text and nothing more.
    this.put(this.within?.group.heading ?? this.root.controller.heading)
  }
}

@Directive({ selector: "[kuiCommandItem]" })
export class KuiCommandItem implements OnInit {
  /** What `itemSelected` is told. */
  readonly value = input.required<string>()
  readonly disabled = input(false, { transform: booleanAttribute })
  /** What is filtered; the item's text when left out. */
  readonly label = input<string>()
  /** Other words the item answers to. */
  readonly keywords = input<readonly string[]>()
  readonly kuiId = input<string>()
  private readonly root = inject(KuiCommand)
  private readonly within = inject(KuiCommandGroup, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({
    disabled: this.disabled(),
    label: this.label(),
    keywords: this.keywords(),
    id: this.kuiId() ?? this.generated,
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.item(this.value(), () => options.get(), this.within?.group))
  }
}

/** A line between groups: gone while something is typed, unless `alwaysRender`. */
@Directive({ selector: "[kuiCommandSeparator]" })
export class KuiCommandSeparator implements OnInit {
  readonly alwaysRender = input(false, { transform: booleanAttribute })
  private readonly root = inject(KuiCommand)
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({ alwaysRender: this.alwaysRender() }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.separator(() => options.get().alwaysRender))
  }
}

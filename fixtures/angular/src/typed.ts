import { Component, Directive, booleanAttribute, computed, input, signal } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import type { DateRange } from "@kirana-ui/core/calendar"
import {
  KuiAccordion,
  KuiAccordionItem,
  KuiAccordionPanel,
  KuiCalendar,
  KuiCalendarWeekdays,
  KuiCalendarWeeks,
  KuiCollapsible,
  KuiCollapsiblePanel,
  KuiCombobox,
  KuiDateField,
  KuiDateFieldSegments,
  KuiField,
  KuiFieldError,
  KuiFieldValidity,
  KuiListbox,
  KuiMenu,
  KuiMenuPopup,
  KuiMenuRadioGroup,
  KuiNavigationMenu,
  KuiPagination,
  KuiPaginationItems,
  KuiRadioGroup,
  KuiScrollArea,
  KuiScrollAreaScrollbar,
  KuiSelect,
  KuiSelectValue,
  KuiSlider,
  KuiTabs,
  KuiTabsPanel,
  KuiTabsTab,
  KuiToastList,
  KuiToastViewport,
  KuiToggleGroup,
  createToaster,
  KuiCommand,
  KuiComboboxItem,
  KuiTooltip,
  hostInputs,
} from "@kirana-ui/angular"
import type { ToastRecord, InputsOf } from "@kirana-ui/angular"

import { DsDialog } from "./design-system"

/** What a change tells: the value as its caller holds it, and why. */
interface Told<Value> {
  value: Value
  details: ChangeDetails
}

/**
 * Never drawn: what a caller writes, for Angular's compiler to check (`ngc`, the first step of
 * this fixture's build). A value's type comes from what is bound, a change tells that type, and
 * a template's variable is what its directive hands it. Each line here was refused, or was
 * `any`, before the adapter's types said so.
 */
@Component({
  selector: "typed-usages",
  imports: [
    KuiAccordion,
    KuiAccordionItem,
    KuiAccordionPanel,
    KuiCalendar,
    KuiCalendarWeekdays,
    KuiCalendarWeeks,
    KuiCollapsible,
    KuiCollapsiblePanel,
    KuiCombobox,
    KuiDateField,
    KuiDateFieldSegments,
    KuiField,
    KuiFieldError,
    KuiFieldValidity,
    KuiListbox,
    KuiMenu,
    KuiMenuPopup,
    KuiMenuRadioGroup,
    KuiNavigationMenu,
    KuiPagination,
    KuiPaginationItems,
    KuiRadioGroup,
    KuiScrollArea,
    KuiScrollAreaScrollbar,
    KuiSelect,
    KuiSelectValue,
    KuiSlider,
    KuiTabs,
    KuiTabsPanel,
    KuiTabsTab,
    KuiToastList,
    KuiToastViewport,
    KuiToggleGroup,
  ],
  template: `
    <!-- One value, never "none": the caller's own signal, and a change that tells its type. -->
    <div kuiTabs [(value)]="position" (valueChanged)="text($event)">
      <button kuiTabsTab [value]="'top'">Top</button>
      <div *kuiTabsPanel="'top'">Top</div>
      <div *kuiTabsPanel="'bottom'; keepMounted: true">Bottom</div>
    </div>
    <!-- Bound one way, the same. With only a default the compiler gives up: the change is any. -->
    <div kuiTabs [value]="position()" (valueChanged)="text($event)"></div>
    <div kuiTabs [defaultValue]="1" (valueChanged)="count($event)"></div>
    <div kuiMenu>
      <div *kuiMenuPopup>
        <div kuiMenuRadioGroup [(value)]="position" (valueChanged)="text($event)"></div>
      </div>
    </div>

    <!-- A slider tells what it was given: a number, or a range's list. -->
    <div kuiSlider [(value)]="level" (valueChanged)="count($event)"></div>
    <div kuiSlider [(value)]="sizes" (valueCommitted)="counts($event)"></div>

    <!-- One value that can be "none": the caller holds the value or null. -->
    <div kuiRadioGroup [(value)]="plan" (valueChanged)="textOrNone($event)"></div>
    <ng-container kuiSelect [(value)]="plan" [items]="plans" (valueChanged)="textOrNone($event)">
      <span *kuiSelectValue="let shown">{{ known(shown.label) }} {{ known(shown.labels) }}</span>
    </ng-container>
    <ng-container kuiCombobox [(value)]="plan" (valueChanged)="textOrNone($event)" />
    <nav kuiNavigationMenu [(value)]="plan" (valueChanged)="textOrNone($event)"></nav>

    <!-- Several values. -->
    <div kuiAccordion [(value)]="open" (valueChanged)="texts($event)">
      <div kuiAccordionItem [value]="'a'">
        <div *kuiAccordionPanel>A</div>
        <div *kuiAccordionPanel="{ keepMounted: true }">A</div>
      </div>
    </div>
    <div kuiToggleGroup [(value)]="open" (valueChanged)="texts($event)"></div>
    <div kuiListbox [(value)]="sizes" [defaultValue]="[1, 2]" (valueChanged)="counts($event)"></div>
    <ng-container kuiSelect multiple [(values)]="sizes" (valuesChanged)="known($event.values)" />
    <ng-container kuiCombobox multiple [(values)]="open" (valuesChanged)="known($event.values)" />

    <!-- A calendar's value is its mode's: a day, a range, or a list of days. -->
    <div kuiCalendar [mode]="'multiple'" (valueChanged)="days($event)"></div>
    <div kuiCalendar [mode]="'range'" (valueChanged)="stay($event)"></div>
    <div kuiCalendar [mode]="'single'" (valueChanged)="textOrNone($event)"></div>

    <!-- What a template is handed. -->
    <div kuiCalendar>
      <span *kuiCalendarWeekdays="let weekday">{{ known(weekday).short }}</span>
      <span *kuiCalendarWeeks="let week">{{ known(week)[0]?.date }}</span>
    </div>
    <div kuiDateField>
      <span *kuiDateFieldSegments="let segment">{{ known(segment).literal }}</span>
    </div>
    <nav kuiPagination [count]="40">
      <ng-container *kuiPaginationItems="let entry">{{ known(entry).key }}</ng-container>
    </nav>
    <div kuiToastViewport [toaster]="toaster">
      <div *kuiToastList="let toast">{{ record(toast).id }}</div>
    </div>
    <div kuiField>
      <ng-container *kuiFieldValidity="let validity">{{ known(validity).valid }}</ng-container>
      <div *kuiFieldError></div>
      <div *kuiFieldError="'valueMissing'"></div>
      <div *kuiFieldError="true"></div>
    </div>

    <!-- The bare attribute, and what it takes when it is given something. -->
    <div kuiCollapsible>
      <div *kuiCollapsiblePanel></div>
      <div *kuiCollapsiblePanel="{ keepMounted: true }"></div>
    </div>
    <div kuiScrollArea>
      <div *kuiScrollAreaScrollbar></div>
      <div *kuiScrollAreaScrollbar="'horizontal'"></div>
    </div>
  `,
})
export class TypedUsages {
  protected readonly position = signal("bottom")
  protected readonly plan = signal<string | null>(null)
  protected readonly plans = [{ value: "pro", label: "Pro" }]
  protected readonly open = signal(["a"])
  protected readonly sizes = signal<number[]>([])
  protected readonly level = signal(40)
  protected readonly toaster = createToaster()

  protected text(_change: Told<string>): void {}
  protected count(_change: Told<number>): void {}
  protected textOrNone(_change: Told<string | null>): void {}
  protected texts(_change: Told<string[]>): void {}
  protected counts(_change: Told<number[]>): void {}
  protected days(_change: Told<readonly string[]>): void {}
  protected stay(_change: Told<DateRange | null>): void {}
  protected record(toast: ToastRecord): ToastRecord {
    return toast
  }

  /** Refuses a value the compiler knows nothing of: `any` is given to nothing typed `never`. */
  protected known<Value>(value: 0 extends 1 & Value ? never : Value): Value {
    return value
  }
}

/*
 * A design system's directives that give the primitives they host what they work out from their
 * own inputs (`hostInputs`), where a subclass of the primitive standing in for it was needed:
 * never drawn, for Angular's compiler to check the inputs given against the primitive's.
 */

/** A combobox whose items are the design system's, given as labels, and its one default value. */
@Directive({
  selector: "[dsCombobox]",
  hostDirectives: [{ directive: KuiCombobox, inputs: ["multiple", "disabled"] }],
})
export class DsCombobox {
  readonly options = input<readonly { value: string; label: string }[]>([])
  readonly initial = input<string | readonly string[]>()

  constructor() {
    const many = (value: string | readonly string[] | undefined) =>
      typeof value === "string" ? [value] : value
    hostInputs(KuiCombobox, {
      items: computed(() => this.options()),
      defaultValue: computed(() => {
        const value = this.initial()
        return typeof value === "string" ? value : null
      }),
      defaultValues: computed(() => many(this.initial())),
    })
  }
}

/** Its item, named by the design system's own way of naming a value. */
@Directive({
  selector: "[dsComboboxItem]",
  hostDirectives: [{ directive: KuiComboboxItem, inputs: ["value", "disabled"] }],
})
export class DsComboboxItem {
  readonly named = input<string>()

  constructor() {
    hostInputs(KuiComboboxItem, { label: this.named })
  }
}

/** A command menu that leaves the filtering to its caller while `shouldFilter` is false. */
@Directive({ selector: "[dsCommand]", hostDirectives: [KuiCommand] })
export class DsCommand {
  readonly shouldFilter = input(true, { transform: booleanAttribute })

  constructor() {
    hostInputs(KuiCommand, { filter: computed(() => (this.shouldFilter() ? undefined : null)) })
  }
}

/** A slider whose thumbs stay inside its track at the ends. */
@Directive({
  selector: "[dsSlider]",
  hostDirectives: [{ directive: KuiSlider, inputs: ["value", "defaultValue", "min", "max"] }],
})
export class DsSlider {
  constructor() {
    hostInputs(KuiSlider, { thumbAlignment: () => "edge" })
  }
}

/** A tooltip shown only while its sidebar is collapsed. */
@Directive({ selector: "[dsSidebarTip]", hostDirectives: [KuiTooltip] })
export class DsSidebarTip {
  readonly collapsed = input(false, { transform: booleanAttribute })

  constructor() {
    hostInputs(KuiTooltip, { delay: () => 0, disabled: computed(() => !this.collapsed()) })
  }
}

/** A design system's dialog, its change heard through the primitive's model. */
@Component({
  selector: "typed-design",
  imports: [DsDialog],
  template: `<ng-container dsDialog (openChange)="heard($event)"></ng-container>`,
})
export class TypedDesign {
  /** A model's change output carries its type: `boolean | undefined` for a dialog's `open`. */
  protected heard(open: boolean | undefined): void {
    void open
  }
}

// What is given is what the input reads, after its transform.
type Expect<Type extends true> = Type
type Same<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
export type InputTypes = [
  Expect<Same<InputsOf<KuiTooltip>["delay"], number | undefined>>,
  Expect<Same<InputsOf<KuiTooltip>["disabled"], boolean>>,
  Expect<Same<InputsOf<KuiTooltip>["open"], boolean | undefined>>,
]
// @ts-expect-error what is not an input is not given: a directive's controller is its own
export const notAnInput: Expect<Same<keyof InputsOf<KuiTooltip>, keyof KuiTooltip>> = true

/** Never called: what `hostInputs` refuses. */
export function refusedInputs(): void {
  // @ts-expect-error a tooltip's delay is a number
  hostInputs(KuiTooltip, { delay: () => "soon" })
  // @ts-expect-error a command has no such input
  hostInputs(KuiCommand, { delay: () => 0 })
}

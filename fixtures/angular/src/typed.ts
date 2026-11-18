import { Component, signal } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
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
} from "@kirana-ui/angular"
import type { ToastRecord } from "@kirana-ui/angular"

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
  protected record(toast: ToastRecord): ToastRecord {
    return toast
  }

  /** Refuses a value the compiler knows nothing of: `any` is given to nothing typed `never`. */
  protected known<Value>(value: 0 extends 1 & Value ? never : Value): Value {
    return value
  }
}

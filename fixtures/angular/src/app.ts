import { Component, signal } from "@angular/core"
import {
  KuiCheckbox,
  KuiCheckboxIndicator,
  KuiCollapsible,
  KuiCollapsiblePanel,
  KuiCollapsibleTrigger,
  KuiDialog,
  KuiDialogBackdrop,
  KuiDialogClose,
  KuiDialogDescription,
  KuiDialogPopup,
  KuiDialogPortal,
  KuiDialogTitle,
  KuiDialogTrigger,
  KuiPopover,
  KuiPopoverClose,
  KuiPopoverDescription,
  KuiPopoverPopup,
  KuiPopoverPortal,
  KuiPopoverPositioner,
  KuiPopoverTitle,
  KuiPopoverTrigger,
  KuiRadioGroup,
  KuiRadioGroupIndicator,
  KuiRadioGroupItem,
  KuiSelect,
  KuiSelectInput,
  KuiSelectItem,
  KuiSelectItemIndicator,
  KuiSelectItemText,
  KuiSelectPopup,
  KuiSelectPortal,
  KuiSelectPositioner,
  KuiSelectTrigger,
  KuiSelectValue,
  KuiSwitch,
  KuiSwitchThumb,
} from "@kirana-ui/angular"

/**
 * The page every adapter draws, element for element: the conformance run walks it and compares
 * the DOM of each state across adapters. Change it in all three fixtures at once.
 *
 * An input is bound (`[kuiId]="'c1'"`), not written as an attribute: Angular leaves a static
 * attribute on the element beside the input that reads it.
 */
@Component({
  selector: "app-root",
  imports: [
    KuiCheckbox,
    KuiCheckboxIndicator,
    KuiRadioGroup,
    KuiRadioGroupIndicator,
    KuiRadioGroupItem,
    KuiSwitch,
    KuiSwitchThumb,
    KuiCollapsible,
    KuiCollapsiblePanel,
    KuiCollapsibleTrigger,
    KuiDialog,
    KuiDialogBackdrop,
    KuiDialogClose,
    KuiDialogDescription,
    KuiDialogPopup,
    KuiDialogPortal,
    KuiDialogTitle,
    KuiDialogTrigger,
    KuiPopover,
    KuiPopoverClose,
    KuiPopoverDescription,
    KuiPopoverPopup,
    KuiPopoverPortal,
    KuiPopoverPositioner,
    KuiPopoverTitle,
    KuiPopoverTrigger,
    KuiSelect,
    KuiSelectInput,
    KuiSelectItem,
    KuiSelectItemIndicator,
    KuiSelectItemText,
    KuiSelectPopup,
    KuiSelectPortal,
    KuiSelectPositioner,
    KuiSelectTrigger,
    KuiSelectValue,
  ],
  template: `
    <main>
      <section data-fixture="collapsible">
        <div kuiCollapsible [kuiId]="'c1'">
          <button kuiCollapsibleTrigger data-testid="c1-trigger">Details</button>
          <div *kuiCollapsiblePanel class="panel" data-testid="c1-panel">
            <p>Panel content</p>
            <div kuiCollapsible [kuiId]="'c2'">
              <button kuiCollapsibleTrigger data-testid="c2-trigger">Nested</button>
              <div *kuiCollapsiblePanel class="panel" data-testid="c2-panel">
                <p>Nested content</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-fixture="collapsible-controlled">
        <button data-testid="c3-outside" (click)="controlled.set(!controlled())">
          Toggle from outside
        </button>
        <div kuiCollapsible [kuiId]="'c3'" [(open)]="controlled">
          <button kuiCollapsibleTrigger data-testid="c3-trigger">Controlled</button>
          <div *kuiCollapsiblePanel="{ keepMounted: true }" class="panel" data-testid="c3-panel">
            <p>Kept in the page</p>
          </div>
        </div>
        <div kuiCollapsible [kuiId]="'c4'" [defaultOpen]="true" [disabled]="true">
          <button kuiCollapsibleTrigger data-testid="c4-trigger">Disabled, open</button>
          <div *kuiCollapsiblePanel class="panel" data-testid="c4-panel">
            <p>Open from the start</p>
          </div>
        </div>
      </section>

      <section data-fixture="composition">
        <label>
          <input
            type="checkbox"
            data-testid="k1-lock"
            [checked]="locked()"
            (change)="locked.set($any($event.target).checked)"
          />
          Lock
        </label>
        <div kuiCollapsible [kuiId]="'k1'">
          <button
            kuiCollapsibleTrigger
            class="mine"
            type="submit"
            aria-expanded="true"
            data-testid="k1-trigger"
            (click)="press($event)"
          >
            Composed {{ presses() }}
          </button>
          <div
            *kuiCollapsiblePanel
            class="panel"
            data-testid="k1-panel"
            [style.color]="presses() % 2 ? 'red' : 'blue'"
          >
            <p>Composed content</p>
          </div>
        </div>
      </section>

      <section data-fixture="controls">
        <form data-testid="f1-form">
          <label data-testid="x1-label">
            <span kuiCheckbox [kuiId]="'x1'" [name]="'terms'" class="box" data-testid="x1">
              <span *kuiCheckboxIndicator class="mark">✓</span>
            </span>
            Accept
          </label>
          <span
            kuiCheckbox
            [kuiId]="'x2'"
            [defaultChecked]="true"
            [disabled]="true"
            class="box"
            data-testid="x2"
          >
            <span *kuiCheckboxIndicator class="mark">✓</span>
          </span>
          <span kuiCheckbox [kuiId]="'x3'" [indeterminate]="true" class="box" data-testid="x3">
            <span *kuiCheckboxIndicator class="mark">–</span>
          </span>
          <span
            kuiSwitch
            [kuiId]="'w1'"
            [name]="'alerts'"
            [(checked)]="alerts"
            class="switch"
            data-testid="w1"
          >
            <span kuiSwitchThumb class="thumb"></span>
          </span>
          <label for="w1" data-testid="w1-label">Alerts</label>
          <div kuiRadioGroup [kuiId]="'r1'" [name]="'plan'" [defaultValue]="'pro'" data-testid="r1">
            @for (each of plans; track each) {
              <label>
                <span
                  kuiRadioGroupItem
                  [value]="each"
                  [disabled]="each === 'team'"
                  class="radio"
                  [attr.data-testid]="'r1-' + each"
                >
                  <span *kuiRadioGroupIndicator class="dot"></span>
                </span>
                {{ each }}
              </label>
            }
          </div>
        </form>
        <output data-testid="w1-output">{{ alerts() ? "on" : "off" }}</output>
      </section>

      <section data-fixture="dialog">
        <ng-container kuiDialog [kuiId]="'d1'">
          <button kuiDialogTrigger data-testid="d1-trigger">Open dialog</button>
          <ng-template kuiDialogPortal>
            <div kuiDialogBackdrop class="backdrop" data-testid="d1-backdrop"></div>
            <div kuiDialogPopup class="dialog" data-testid="d1-popup">
              <h2 kuiDialogTitle>Edit profile</h2>
              <p kuiDialogDescription>Change your name.</p>
              <input data-testid="d1-input" aria-label="Name" />
              <ng-container kuiDialog [kuiId]="'d2'">
                <button kuiDialogTrigger data-testid="d2-trigger">Open nested</button>
                <ng-template kuiDialogPortal>
                  <div kuiDialogBackdrop class="backdrop" data-testid="d2-backdrop"></div>
                  <div kuiDialogPopup class="dialog" data-testid="d2-popup">
                    <h2 kuiDialogTitle>Are you sure?</h2>
                    <button kuiDialogClose data-testid="d2-close">Back</button>
                  </div>
                </ng-template>
              </ng-container>
              <button kuiDialogClose data-testid="d1-close">Close</button>
            </div>
          </ng-template>
        </ng-container>
      </section>

      <section data-fixture="popover">
        <ng-container kuiPopover [kuiId]="'p1'">
          <button kuiPopoverTrigger data-testid="p1-trigger">Open popover</button>
          <ng-template kuiPopoverPortal>
            <div
              kuiPopoverPositioner
              [sideOffset]="8"
              [align]="'start'"
              data-testid="p1-positioner"
            >
              <div kuiPopoverPopup class="popup" data-testid="p1-popup">
                <h2 kuiPopoverTitle>Notifications</h2>
                <p kuiPopoverDescription>You are all caught up.</p>
                <button kuiPopoverClose data-testid="p1-close">Close</button>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>

      <section data-fixture="select">
        <form data-testid="s1-form">
          <ng-container kuiSelect [kuiId]="'s1'" [name]="'fruit'" [(value)]="fruit">
            <button kuiSelectTrigger data-testid="s1-trigger">
              <span kuiSelectValue [placeholder]="'Pick a fruit'" data-testid="s1-value"></span>
            </button>
            <ng-template kuiSelectPortal>
              <div kuiSelectPositioner [sideOffset]="4" data-testid="s1-positioner">
                <div kuiSelectPopup class="popup" data-testid="s1-popup">
                  @for (each of fruits; track each) {
                    <div
                      kuiSelectItem
                      [value]="each"
                      [disabled]="each === 'Blueberry'"
                      class="item"
                      [attr.data-testid]="'s1-' + each"
                    >
                      <span kuiSelectItemText>{{ each }}</span>
                      <span *kuiSelectItemIndicator>✓</span>
                    </div>
                  }
                </div>
              </div>
            </ng-template>
            <input kuiSelectInput />
          </ng-container>
        </form>
        <output data-testid="s1-output">{{ fruit() ?? "none" }}</output>
      </section>
    </main>
  `,
})
export class App {
  protected readonly fruits = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape"]
  protected readonly controlled = signal<boolean | undefined>(false)
  protected readonly fruit = signal<unknown>("Banana")
  protected readonly presses = signal(0)
  protected readonly locked = signal(false)
  protected readonly alerts = signal<boolean | undefined>(false)
  protected readonly plans = ["free", "pro", "team", "max"]

  protected press(event: Event): void {
    this.presses.update((count) => count + 1)
    if (this.locked()) (event as Event & { preventKiranaHandler(): void }).preventKiranaHandler()
  }
}

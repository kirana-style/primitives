import { Component, afterNextRender, signal } from "@angular/core"
import {
  KpAccordion,
  KpAccordionHeader,
  KpAccordionItem,
  KpAccordionPanel,
  KpAccordionTrigger,
  KpCheckbox,
  KpCheckboxIndicator,
  KpCollapsible,
  KpCollapsiblePanel,
  KpCollapsibleTrigger,
  KpField,
  KpFieldControl,
  KpFieldDescription,
  KpFieldLabel,
  KpPopover,
  KpPopoverClose,
  KpPopoverDescription,
  KpPopoverPopup,
  KpPopoverPortal,
  KpPopoverPositioner,
  KpPopoverTitle,
  KpPopoverTrigger,
  KpTabs,
  KpTabsList,
  KpTabsPanel,
  KpTabsTab,
} from "@kirana-ui/angular"

// The second page: no part is given an id, and a popover is open when the page is first drawn.
// What a server and a client must agree on without help: an accordion's items are given no
// value either, and each makes its own. The same in all five fixtures.
// Then what only shows once the page is in a browser: a panel its caller opens as the page
// mounts, a box in a `<fieldset disabled>`, an input whose caller rewrites what is typed.
@Component({
  selector: "app-root",
  imports: [
    KpAccordion,
    KpAccordionHeader,
    KpAccordionItem,
    KpAccordionPanel,
    KpAccordionTrigger,
    KpCheckbox,
    KpCheckboxIndicator,
    KpCollapsible,
    KpCollapsiblePanel,
    KpCollapsibleTrigger,
    KpField,
    KpFieldControl,
    KpFieldDescription,
    KpFieldLabel,
    KpPopover,
    KpPopoverClose,
    KpPopoverDescription,
    KpPopoverPopup,
    KpPopoverPortal,
    KpPopoverPositioner,
    KpPopoverTitle,
    KpPopoverTrigger,
    KpTabs,
    KpTabsList,
    KpTabsPanel,
    KpTabsTab,
  ],
  template: `
    <main data-generated-ids="">
      <section data-fixture="ids">
        <div kpCollapsible [defaultOpen]="true">
          <button kpCollapsibleTrigger data-testid="o-c-trigger">Details</button>
          <div *kpCollapsiblePanel class="panel" data-testid="o-c-panel">
            <p>Panel content</p>
          </div>
        </div>
        <div kpTabs [defaultValue]="'one'">
          <div kpTabsList class="tabs">
            <button kpTabsTab [value]="'one'" data-testid="o-t-one">One</button>
            <button kpTabsTab [value]="'two'" data-testid="o-t-two">Two</button>
          </div>
          <div *kpTabsPanel="'one'" data-testid="o-t-panel-one">First</div>
          <div *kpTabsPanel="'two'" data-testid="o-t-panel-two">Second</div>
        </div>
        <div kpField [name]="'email'">
          <label kpFieldLabel data-testid="o-f-label">Email</label>
          <input kpFieldControl type="email" data-testid="o-f-control" />
          <p kpFieldDescription data-testid="o-f-description">Your work address</p>
        </div>
        <div kpAccordion>
          @for (each of ["first", "second"]; track each) {
            <div kpAccordionItem [attr.data-testid]="'o-a-' + each">
              <h3 kpAccordionHeader>
                <button kpAccordionTrigger [attr.data-testid]="'o-a-' + each + '-trigger'">
                  Item {{ each }}
                </button>
              </h3>
              <div *kpAccordionPanel class="fold" [attr.data-testid]="'o-a-' + each + '-panel'">
                <p>Content {{ each }}</p>
              </div>
            </div>
          }
        </div>
      </section>
      <section data-fixture="open-popup">
        <ng-container kpPopover [defaultOpen]="true">
          <button kpPopoverTrigger data-testid="o-p-trigger">Open popover</button>
          <ng-template kpPopoverPortal>
            <div
              kpPopoverPositioner
              [sideOffset]="8"
              [align]="'start'"
              data-testid="o-p-positioner"
            >
              <div kpPopoverPopup class="popup" data-testid="o-p-popup">
                <h2 kpPopoverTitle>Notifications</h2>
                <p kpPopoverDescription>You are all caught up.</p>
                <button kpPopoverClose data-testid="o-p-close">Close</button>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="late">
        <div kpCollapsible [(open)]="late">
          <button kpCollapsibleTrigger data-testid="o-l-trigger">Late</button>
          <div *kpCollapsiblePanel class="panel" data-testid="o-l-panel">
            <p>Opened as the page mounted</p>
          </div>
        </div>
        <fieldset [disabled]="!unlocked()" data-testid="o-s-set">
          <span kpCheckbox [name]="'terms'" class="box" data-testid="o-s-box">
            <span *kpCheckboxIndicator class="mark">✓</span>
          </span>
        </fieldset>
        <button data-testid="o-s-unlock" (click)="unlocked.set(!unlocked())">Unlock</button>
        <div kpField [name]="'nick'">
          <label kpFieldLabel>Nickname</label>
          <input
            kpFieldControl
            [value]="nick()"
            (input)="nick.set($any($event.currentTarget).value.toUpperCase())"
            data-testid="o-h-control"
          />
        </div>
        <output data-testid="o-h-output">{{ nick() }}</output>
      </section>
    </main>
  `,
})
export class Open {
  protected readonly late = signal<boolean | undefined>(false)
  protected readonly unlocked = signal(false)
  protected readonly nick = signal("")

  constructor() {
    // In a browser only, as the other four's mount: a server draws the panel closed.
    afterNextRender(() => this.late.set(true))
  }
}

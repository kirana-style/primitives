import { Component } from "@angular/core"
import {
  KuiCollapsible,
  KuiCollapsiblePanel,
  KuiCollapsibleTrigger,
  KuiField,
  KuiFieldControl,
  KuiFieldDescription,
  KuiFieldLabel,
  KuiPopover,
  KuiPopoverClose,
  KuiPopoverDescription,
  KuiPopoverPopup,
  KuiPopoverPortal,
  KuiPopoverPositioner,
  KuiPopoverTitle,
  KuiPopoverTrigger,
  KuiTabs,
  KuiTabsList,
  KuiTabsPanel,
  KuiTabsTab,
} from "@kirana-ui/angular"

// The second page: no part is given an id, and a popover is open when the page is first drawn.
// What a server and a client must agree on without help. The same in all five fixtures.
@Component({
  selector: "app-root",
  imports: [
    KuiCollapsible,
    KuiCollapsiblePanel,
    KuiCollapsibleTrigger,
    KuiField,
    KuiFieldControl,
    KuiFieldDescription,
    KuiFieldLabel,
    KuiPopover,
    KuiPopoverClose,
    KuiPopoverDescription,
    KuiPopoverPopup,
    KuiPopoverPortal,
    KuiPopoverPositioner,
    KuiPopoverTitle,
    KuiPopoverTrigger,
    KuiTabs,
    KuiTabsList,
    KuiTabsPanel,
    KuiTabsTab,
  ],
  template: `
    <main data-generated-ids="">
      <section data-fixture="ids">
        <div kuiCollapsible [defaultOpen]="true">
          <button kuiCollapsibleTrigger data-testid="o-c-trigger">Details</button>
          <div *kuiCollapsiblePanel class="panel" data-testid="o-c-panel">
            <p>Panel content</p>
          </div>
        </div>
        <div kuiTabs [defaultValue]="'one'">
          <div kuiTabsList class="tabs">
            <button kuiTabsTab [value]="'one'" data-testid="o-t-one">One</button>
            <button kuiTabsTab [value]="'two'" data-testid="o-t-two">Two</button>
          </div>
          <div *kuiTabsPanel="'one'" data-testid="o-t-panel-one">First</div>
          <div *kuiTabsPanel="'two'" data-testid="o-t-panel-two">Second</div>
        </div>
        <div kuiField [name]="'email'">
          <label kuiFieldLabel data-testid="o-f-label">Email</label>
          <input kuiFieldControl type="email" data-testid="o-f-control" />
          <p kuiFieldDescription data-testid="o-f-description">Your work address</p>
        </div>
      </section>
      <section data-fixture="open-popup">
        <ng-container kuiPopover [defaultOpen]="true">
          <button kuiPopoverTrigger data-testid="o-p-trigger">Open popover</button>
          <ng-template kuiPopoverPortal>
            <div
              kuiPopoverPositioner
              [sideOffset]="8"
              [align]="'start'"
              data-testid="o-p-positioner"
            >
              <div kuiPopoverPopup class="popup" data-testid="o-p-popup">
                <h2 kuiPopoverTitle>Notifications</h2>
                <p kuiPopoverDescription>You are all caught up.</p>
                <button kuiPopoverClose data-testid="o-p-close">Close</button>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
    </main>
  `,
})
export class Open {}

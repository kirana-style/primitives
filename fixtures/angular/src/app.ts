import { Component, signal } from "@angular/core"
import {
  KuiAccordion,
  KuiAccordionHeader,
  KuiAccordionItem,
  KuiAccordionPanel,
  KuiAccordionTrigger,
  KuiAvatar,
  KuiAvatarFallback,
  KuiAvatarImage,
  KuiButton,
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
  KuiHoverCard,
  KuiHoverCardPopup,
  KuiHoverCardPortal,
  KuiHoverCardPositioner,
  KuiHoverCardTrigger,
  KuiCombobox,
  KuiComboboxEmpty,
  KuiComboboxHiddenInput,
  KuiComboboxInput,
  KuiComboboxItem,
  KuiComboboxItemIndicator,
  KuiComboboxPopup,
  KuiComboboxPortal,
  KuiComboboxPositioner,
  KuiComboboxTrigger,
  KuiContextMenuTrigger,
  KuiListbox,
  KuiListboxGroup,
  KuiListboxGroupLabel,
  KuiListboxItem,
  KuiListboxItemIndicator,
  KuiMenu,
  KuiMenubar,
  KuiMenuCheckboxItem,
  KuiMenuCheckboxItemIndicator,
  KuiMenuGroup,
  KuiMenuGroupLabel,
  KuiMenuItem,
  KuiMenuLinkItem,
  KuiMenuPopup,
  KuiMenuPortal,
  KuiMenuPositioner,
  KuiMenuRadioGroup,
  KuiMenuRadioItem,
  KuiMenuRadioItemIndicator,
  KuiMenuSeparator,
  KuiMenuSubmenuRoot,
  KuiMenuSubmenuTrigger,
  KuiMenuTrigger,
  KuiMeter,
  KuiNavigationMenu,
  KuiNavigationMenuContent,
  KuiNavigationMenuIcon,
  KuiNavigationMenuItem,
  KuiNavigationMenuLink,
  KuiNavigationMenuList,
  KuiNavigationMenuPopup,
  KuiNavigationMenuPortal,
  KuiNavigationMenuPositioner,
  KuiNavigationMenuTrigger,
  KuiNavigationMenuViewport,
  KuiMeterIndicator,
  KuiMeterLabel,
  KuiMeterTrack,
  KuiMeterValue,
  KuiPopover,
  KuiPopoverClose,
  KuiPopoverDescription,
  KuiPopoverPopup,
  KuiPopoverPortal,
  KuiPopoverPositioner,
  KuiPopoverTitle,
  KuiPopoverTrigger,
  KuiProgress,
  KuiProgressIndicator,
  KuiProgressLabel,
  KuiProgressTrack,
  KuiProgressValue,
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
  KuiField,
  KuiFieldControl,
  KuiFieldDescription,
  KuiFieldError,
  KuiFieldLabel,
  KuiFieldValidity,
  KuiFieldset,
  KuiFieldsetLegend,
  KuiForm,
  KuiDirection,
  KuiSeparator,
  KuiSlider,
  KuiSliderControl,
  KuiSliderIndicator,
  KuiSliderThumb,
  KuiSliderTrack,
  KuiSliderValue,
  KuiSwitch,
  KuiSwitchThumb,
  KuiTabs,
  KuiTabsIndicator,
  KuiTabsList,
  KuiTabsPanel,
  KuiTabsTab,
  KuiScrollArea,
  KuiScrollAreaContent,
  KuiScrollAreaCorner,
  KuiScrollAreaScrollbar,
  KuiScrollAreaThumb,
  KuiScrollAreaViewport,
  KuiToggle,
  KuiToggleGroup,
  KuiToolbar,
  KuiToolbarButton,
  KuiToolbarGroup,
  KuiToolbarInput,
  KuiToolbarLink,
  KuiToolbarSeparator,
  KuiTooltip,
  KuiTooltipArrow,
  KuiTooltipPopup,
  KuiTooltipPortal,
  KuiTooltipPositioner,
  KuiTooltipTrigger,
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
    KuiAccordion,
    KuiAccordionHeader,
    KuiAccordionItem,
    KuiAccordionPanel,
    KuiAccordionTrigger,
    KuiAvatar,
    KuiAvatarFallback,
    KuiAvatarImage,
    KuiButton,
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
    KuiHoverCard,
    KuiHoverCardPopup,
    KuiHoverCardPortal,
    KuiHoverCardPositioner,
    KuiHoverCardTrigger,
    KuiCombobox,
    KuiComboboxEmpty,
    KuiComboboxHiddenInput,
    KuiComboboxInput,
    KuiComboboxItem,
    KuiComboboxItemIndicator,
    KuiComboboxPopup,
    KuiComboboxPortal,
    KuiComboboxPositioner,
    KuiComboboxTrigger,
    KuiContextMenuTrigger,
    KuiListbox,
    KuiListboxGroup,
    KuiListboxGroupLabel,
    KuiListboxItem,
    KuiListboxItemIndicator,
    KuiMenu,
    KuiMenubar,
    KuiMenuCheckboxItem,
    KuiMenuCheckboxItemIndicator,
    KuiMenuGroup,
    KuiMenuGroupLabel,
    KuiMenuItem,
    KuiMenuLinkItem,
    KuiMenuPopup,
    KuiMenuPortal,
    KuiMenuPositioner,
    KuiMenuRadioGroup,
    KuiMenuRadioItem,
    KuiMenuRadioItemIndicator,
    KuiMenuSeparator,
    KuiMenuSubmenuRoot,
    KuiMenuSubmenuTrigger,
    KuiMenuTrigger,
    KuiMeter,
    KuiNavigationMenu,
    KuiNavigationMenuContent,
    KuiNavigationMenuIcon,
    KuiNavigationMenuItem,
    KuiNavigationMenuLink,
    KuiNavigationMenuList,
    KuiNavigationMenuPopup,
    KuiNavigationMenuPortal,
    KuiNavigationMenuPositioner,
    KuiNavigationMenuTrigger,
    KuiNavigationMenuViewport,
    KuiMeterIndicator,
    KuiMeterLabel,
    KuiMeterTrack,
    KuiMeterValue,
    KuiPopover,
    KuiPopoverClose,
    KuiPopoverDescription,
    KuiPopoverPopup,
    KuiPopoverPortal,
    KuiPopoverPositioner,
    KuiPopoverTitle,
    KuiPopoverTrigger,
    KuiProgress,
    KuiProgressIndicator,
    KuiProgressLabel,
    KuiProgressTrack,
    KuiProgressValue,
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
    KuiField,
    KuiFieldControl,
    KuiFieldDescription,
    KuiFieldError,
    KuiFieldLabel,
    KuiFieldValidity,
    KuiFieldset,
    KuiFieldsetLegend,
    KuiForm,
    KuiDirection,
    KuiSeparator,
    KuiSlider,
    KuiSliderControl,
    KuiSliderIndicator,
    KuiSliderThumb,
    KuiSliderTrack,
    KuiSliderValue,
    KuiSwitch,
    KuiSwitchThumb,
    KuiTabs,
    KuiTabsIndicator,
    KuiTabsList,
    KuiTabsPanel,
    KuiTabsTab,
    KuiScrollArea,
    KuiScrollAreaContent,
    KuiScrollAreaCorner,
    KuiScrollAreaScrollbar,
    KuiScrollAreaThumb,
    KuiScrollAreaViewport,
    KuiToggle,
    KuiToggleGroup,
    KuiToolbar,
    KuiToolbarButton,
    KuiToolbarGroup,
    KuiToolbarInput,
    KuiToolbarLink,
    KuiToolbarSeparator,
    KuiTooltip,
    KuiTooltipArrow,
    KuiTooltipPopup,
    KuiTooltipPortal,
    KuiTooltipPositioner,
    KuiTooltipTrigger,
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
          <button type="reset" data-testid="f1-reset">Reset</button>
        </form>
        <output data-testid="w1-output">{{ alerts() ? "on" : "off" }}</output>
      </section>

      <section data-fixture="tabs">
        <div kuiTabs [kuiId]="'t1'" [defaultValue]="'account'" data-testid="t1">
          <div kuiTabsList class="tabs" data-testid="t1-list">
            <button kuiTabsTab [value]="'account'" data-testid="t1-account">Account</button>
            <button kuiTabsTab [value]="'password'" data-testid="t1-password">Password</button>
            <button kuiTabsTab [value]="'billing'" [disabled]="true" data-testid="t1-billing">
              Billing
            </button>
            <button kuiTabsTab [value]="'team'" data-testid="t1-team">Team</button>
            <span kuiTabsIndicator class="tab-mark" data-testid="t1-mark"></span>
          </div>
          <div *kuiTabsPanel="'account'" data-testid="t1-panel-account">
            <p>Account settings</p>
            <div kuiTabs [kuiId]="'t2'" [defaultValue]="'one'" data-testid="t2">
              <div kuiTabsList class="tabs" data-testid="t2-list">
                <button kuiTabsTab [value]="'one'" data-testid="t2-one">One</button>
                <button kuiTabsTab [value]="'two'" data-testid="t2-two">Two</button>
              </div>
              <div *kuiTabsPanel="'one'" data-testid="t2-panel-one">First</div>
              <div *kuiTabsPanel="'two'" data-testid="t2-panel-two">Second</div>
            </div>
          </div>
          <div *kuiTabsPanel="'password'" data-testid="t1-panel-password">
            <p>Password settings</p>
          </div>
          <div *kuiTabsPanel="'billing'" data-testid="t1-panel-billing">
            <p>Billing settings</p>
          </div>
          <div *kuiTabsPanel="'team'" data-testid="t1-panel-team">
            <p>Team settings</p>
          </div>
        </div>
      </section>

      <section data-fixture="accordion">
        <div kuiAccordion [kuiId]="'a1'" data-testid="a1">
          @for (each of sections; track each) {
            <div
              kuiAccordionItem
              [value]="each"
              [disabled]="each === 'three'"
              [attr.data-testid]="'a1-' + each"
            >
              <h3 kuiAccordionHeader>
                <button kuiAccordionTrigger [attr.data-testid]="'a1-' + each + '-trigger'">
                  Section {{ each }}
                </button>
              </h3>
              <div *kuiAccordionPanel class="fold" [attr.data-testid]="'a1-' + each + '-panel'">
                <p>Content {{ each }}</p>
              </div>
            </div>
          }
        </div>
        <div kuiAccordion [kuiId]="'a2'" [multiple]="true" [defaultValue]="['x']" data-testid="a2">
          @for (each of ["x", "y"]; track each) {
            <div kuiAccordionItem [value]="each" [attr.data-testid]="'a2-' + each">
              <h3 kuiAccordionHeader>
                <button kuiAccordionTrigger [attr.data-testid]="'a2-' + each + '-trigger'">
                  Part {{ each }}
                </button>
              </h3>
              <div *kuiAccordionPanel class="fold" [attr.data-testid]="'a2-' + each + '-panel'">
                <p>Content {{ each }}</p>
              </div>
            </div>
          }
        </div>
      </section>

      <section data-fixture="hover">
        <button data-testid="h0">Before</button>
        <ng-container kuiTooltip [kuiId]="'h1'" [delay]="100">
          <button kuiTooltipTrigger data-testid="h1-trigger">Save</button>
          <ng-template kuiTooltipPortal>
            <div kuiTooltipPositioner [sideOffset]="8" data-testid="h1-positioner">
              <div kuiTooltipPopup class="tip" data-testid="h1-popup">
                Save the file
                <div kuiTooltipArrow class="arrow" data-testid="h1-arrow"></div>
              </div>
            </div>
          </ng-template>
        </ng-container>
        <ng-container kuiTooltip [kuiId]="'h2'" [delay]="100">
          <button kuiTooltipTrigger data-testid="h2-trigger">Open</button>
          <ng-template kuiTooltipPortal>
            <div kuiTooltipPositioner [sideOffset]="8" data-testid="h2-positioner">
              <div kuiTooltipPopup class="tip" data-testid="h2-popup">Open a file</div>
            </div>
          </ng-template>
        </ng-container>
        <ng-container kuiHoverCard [kuiId]="'v1'" [delay]="100" [closeDelay]="100">
          <a kuiHoverCardTrigger href="#profile" data-testid="v1-trigger">&#64;kirana</a>
          <ng-template kuiHoverCardPortal>
            <div
              kuiHoverCardPositioner
              [side]="'bottom'"
              [sideOffset]="8"
              data-testid="v1-positioner"
            >
              <div kuiHoverCardPopup class="tip" data-testid="v1-popup">
                <p>Styles, compiled.</p>
                <a href="#follow" data-testid="v1-link">Follow</a>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>

      <section data-fixture="simple">
        <button kuiButton data-testid="b1" (click)="count.set(count() + 1)">
          Count {{ count() }}
        </button>
        <button kuiButton [disabled]="true" [focusableWhenDisabled]="true" data-testid="b2">
          Disabled, in the tab order
        </button>
        <span kuiButton [nativeButton]="false" data-testid="b3" (click)="count.set(count() + 1)">
          Not a button element
        </span>
        <button kuiToggle aria-label="Bold" data-testid="g1">B</button>
        <div kuiSeparator data-testid="sp1"></div>
        <div kuiSeparator [orientation]="'vertical'" data-testid="sp2"></div>
        <button data-testid="pr1-more" (click)="done.set(100)">Finish</button>
        <div kuiProgress [kuiId]="'pr1'" [value]="done()" data-testid="pr1">
          <span kuiProgressLabel>Upload</span>
          <div kuiProgressTrack class="track">
            <div kuiProgressIndicator class="fill" data-testid="pr1-fill"></div>
          </div>
          <span kuiProgressValue data-testid="pr1-value"></span>
        </div>
        <div kuiProgress [kuiId]="'pr2'" [value]="null" data-testid="pr2">
          <div kuiProgressTrack class="track">
            <div kuiProgressIndicator class="fill" data-testid="pr2-fill"></div>
          </div>
        </div>
        <div kuiMeter [kuiId]="'m1'" [value]="30" [max]="60" data-testid="m1">
          <span kuiMeterLabel>Disk</span>
          <div kuiMeterTrack class="track">
            <div kuiMeterIndicator class="fill" data-testid="m1-fill"></div>
          </div>
          <span kuiMeterValue data-testid="m1-value"></span>
        </div>
        <button data-testid="av-load" (click)="pictures.set(true)">Load pictures</button>
        <span kuiAvatar class="avatar" data-testid="av1">
          <img
            *kuiAvatarImage="pictures() ? pixel : undefined"
            alt="Kirana"
            data-testid="av1-image"
          />
          <span *kuiAvatarFallback data-testid="av1-fallback">K</span>
        </span>
        <span kuiAvatar class="avatar" data-testid="av2">
          <img
            *kuiAvatarImage="pictures() ? broken : undefined"
            alt="Nobody"
            data-testid="av2-image"
          />
          <span *kuiAvatarFallback data-testid="av2-fallback">N</span>
        </span>
        <ng-container kuiAlertDialog [kuiId]="'ad1'">
          <button kuiDialogTrigger data-testid="ad1-trigger">Delete</button>
          <ng-template kuiDialogPortal>
            <div kuiDialogBackdrop class="backdrop" data-testid="ad1-backdrop"></div>
            <div kuiDialogPopup class="dialog" data-testid="ad1-popup">
              <h2 kuiDialogTitle>Delete the file?</h2>
              <p kuiDialogDescription>This cannot be undone.</p>
              <button kuiDialogClose data-testid="ad1-cancel">Cancel</button>
            </div>
          </ng-template>
        </ng-container>
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
      <section data-fixture="menu">
        <ng-container kuiMenu [kuiId]="'mn1'">
          <button kuiMenuTrigger data-testid="mn1-trigger">File</button>
          <ng-template kuiMenuPortal>
            <div kuiMenuPositioner [sideOffset]="4" data-testid="mn1-positioner">
              <div kuiMenuPopup class="popup" data-testid="mn1-popup">
                <div kuiMenuGroupLabel data-testid="mn1-lone">Document</div>
                <div kuiMenuItem class="item" data-testid="mn1-new" (click)="action.set('new')">
                  <span>New</span><kbd aria-hidden="true">⌘N</kbd>
                </div>
                <div kuiMenuItem class="item" [disabled]="true" data-testid="mn1-open">Open</div>
                <div kuiMenuItem class="item" data-testid="mn1-print" (click)="action.set('print')">
                  Print
                </div>
                <div kuiMenuSeparator data-testid="mn1-separator"></div>
                <div
                  kuiMenuCheckboxItem
                  class="item"
                  [defaultChecked]="true"
                  data-testid="mn1-wrap"
                >
                  <span *kuiMenuCheckboxItemIndicator>✓</span>
                  <span>Word wrap</span>
                </div>
                <div kuiMenuGroup [kuiId]="'mn1-g'" data-testid="mn1-group">
                  <div kuiMenuGroupLabel data-testid="mn1-label">View</div>
                  <div kuiMenuRadioGroup [(value)]="view" data-testid="mn1-views">
                    <div kuiMenuRadioItem [value]="'list'" class="item" data-testid="mn1-list">
                      <span *kuiMenuRadioItemIndicator>•</span>
                      <span>List</span>
                    </div>
                    <div kuiMenuRadioItem [value]="'grid'" class="item" data-testid="mn1-grid">
                      <span *kuiMenuRadioItemIndicator>•</span>
                      <span>Grid</span>
                    </div>
                  </div>
                </div>
                <ng-container kuiMenuSubmenuRoot [kuiId]="'mn1s'">
                  <div kuiMenuSubmenuTrigger class="item" data-testid="mn1-share">Share</div>
                  <ng-template kuiMenuPortal>
                    <div kuiMenuPositioner data-testid="mn1s-positioner">
                      <div kuiMenuPopup class="popup" data-testid="mn1s-popup">
                        <div
                          kuiMenuItem
                          class="item"
                          data-testid="mn1s-mail"
                          (click)="action.set('mail')"
                        >
                          Mail
                        </div>
                        <div
                          kuiMenuItem
                          class="item"
                          data-testid="mn1s-link"
                          (click)="action.set('link')"
                        >
                          Link
                        </div>
                      </div>
                    </div>
                  </ng-template>
                </ng-container>
              </div>
            </div>
          </ng-template>
        </ng-container>
        <output data-testid="mn1-output">{{ action() }} {{ view() }}</output>
      </section>
      <section data-fixture="context-menu">
        <ng-container kuiContextMenu [kuiId]="'cm1'">
          <div kuiContextMenuTrigger class="area" data-testid="cm1-area">Press here</div>
          <ng-template kuiMenuPortal>
            <div kuiMenuPositioner data-testid="cm1-positioner">
              <div kuiMenuPopup class="popup" aria-label="Actions" data-testid="cm1-popup">
                <div
                  kuiMenuItem
                  class="item"
                  data-testid="cm1-copy"
                  (click)="picked.set('cm1-copy')"
                >
                  Copy
                </div>
                <div
                  kuiMenuItem
                  class="item"
                  data-testid="cm1-paste"
                  (click)="picked.set('cm1-paste')"
                >
                  Paste
                </div>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="menubar">
        <div kuiMenubar [kuiId]="'mb1'" class="bar" data-testid="mb1">
          <ng-container kuiMenu [kuiId]="'mb1f'">
            <button kuiMenuTrigger data-testid="mb1-file">File</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="mb1f-positioner">
                <div kuiMenuPopup class="popup" data-testid="mb1f-popup">
                  <div
                    kuiMenuItem
                    class="item"
                    data-testid="mb1f-new"
                    (click)="picked.set('mb1f-new')"
                  >
                    New
                  </div>
                  <div
                    kuiMenuItem
                    class="item"
                    data-testid="mb1f-save"
                    (click)="picked.set('mb1f-save')"
                  >
                    Save
                  </div>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kuiMenu [kuiId]="'mb1e'">
            <button kuiMenuTrigger data-testid="mb1-edit">Edit</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="mb1e-positioner">
                <div kuiMenuPopup class="popup" data-testid="mb1e-popup">
                  <div
                    kuiMenuItem
                    class="item"
                    data-testid="mb1e-undo"
                    (click)="picked.set('mb1e-undo')"
                  >
                    Undo
                  </div>
                  <ng-container kuiMenuSubmenuRoot [kuiId]="'mb1em'">
                    <div kuiMenuSubmenuTrigger class="item" data-testid="mb1e-find">Find</div>
                    <ng-template kuiMenuPortal>
                      <div kuiMenuPositioner data-testid="mb1em-positioner">
                        <div kuiMenuPopup class="popup" data-testid="mb1em-popup">
                          <div
                            kuiMenuItem
                            class="item"
                            data-testid="mb1em-next"
                            (click)="picked.set('mb1em-next')"
                          >
                            Next
                          </div>
                        </div>
                      </div>
                    </ng-template>
                  </ng-container>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kuiMenu [kuiId]="'mb1v'" [disabled]="true">
            <button kuiMenuTrigger data-testid="mb1-view">View</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="mb1v-positioner">
                <div kuiMenuPopup class="popup" data-testid="mb1v-popup">
                  <div
                    kuiMenuItem
                    class="item"
                    data-testid="mb1v-zoom"
                    (click)="picked.set('mb1v-zoom')"
                  >
                    Zoom
                  </div>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kuiMenu [kuiId]="'mb1h'">
            <button kuiMenuTrigger data-testid="mb1-help">Help</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="mb1h-positioner">
                <div kuiMenuPopup class="popup" data-testid="mb1h-popup">
                  <div
                    kuiMenuItem
                    class="item"
                    data-testid="mb1h-about"
                    (click)="picked.set('mb1h-about')"
                  >
                    About
                  </div>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <output data-testid="mb1-output">{{ picked() }}</output>
      </section>
      <section data-fixture="listbox">
        <div kuiListbox [kuiId]="'lb1'" aria-label="Fruit" [(value)]="chosen" data-testid="lb1">
          @for (each of fruits; track each) {
            <div
              kuiListboxItem
              [value]="each"
              [disabled]="each === 'Blueberry'"
              class="item"
              [attr.data-testid]="'lb1-' + each"
            >
              <span>{{ each }}</span>
              <span *kuiListboxItemIndicator>✓</span>
            </div>
          }
        </div>
        <div kuiListbox [kuiId]="'lb2'" aria-label="Plans" [multiple]="true" data-testid="lb2">
          <div kuiListboxGroup [kuiId]="'lb2-g'" data-testid="lb2-group">
            <div kuiListboxGroupLabel data-testid="lb2-label">Plans</div>
            @for (each of plans; track each) {
              <div kuiListboxItem [value]="each" class="item" [attr.data-testid]="'lb2-' + each">
                <span>{{ each }}</span>
              </div>
            }
          </div>
        </div>
        <output data-testid="lb1-output">{{ chosen()?.join(",") }}</output>
      </section>
      <section data-fixture="combobox">
        <form data-testid="cb1-form">
          <ng-container kuiCombobox [kuiId]="'cb1'" [name]="'pick'" [(value)]="pick">
            <input kuiComboboxInput aria-label="Fruit" data-testid="cb1-input" />
            <button kuiComboboxTrigger aria-label="Show fruits" data-testid="cb1-trigger">▾</button>
            <ng-template kuiComboboxPortal>
              <div kuiComboboxPositioner [sideOffset]="4" data-testid="cb1-positioner">
                <div kuiComboboxPopup class="popup" aria-label="Fruits" data-testid="cb1-popup">
                  @for (each of fruits; track each) {
                    <div
                      kuiComboboxItem
                      [value]="each"
                      [kuiId]="'cb1-' + each"
                      [disabled]="each === 'Blueberry'"
                      class="item"
                      [attr.data-testid]="'cb1-' + each"
                    >
                      <span>{{ each }}</span>
                      <span *kuiComboboxItemIndicator>✓</span>
                    </div>
                  }
                  <div *kuiComboboxEmpty data-testid="cb1-empty">No fruit</div>
                </div>
              </div>
            </ng-template>
            <input kuiComboboxHiddenInput />
          </ng-container>
        </form>
        <output data-testid="cb1-output">{{ pick() ?? "none" }}</output>
      </section>
      <section data-fixture="menu-more">
        <div class="bar">
          <button type="button" data-testid="mm1-outside" (click)="outside.set(outside() + 1)">
            Outside
          </button>
          <ng-container kuiMenu [kuiId]="'mm1'" [modal]="true">
            <button kuiMenuTrigger data-testid="mm1-trigger">Modal</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="mm1-positioner">
                <div kuiMenuPopup class="popup" data-testid="mm1-popup">
                  <div kuiMenuItem class="item" data-testid="mm1-plain">Plain</div>
                  <a kuiMenuLinkItem class="item" href="#mm1-linked" data-testid="mm1-link">Link</a>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <div kuiMenubar [kuiId]="'vb1'" [orientation]="'vertical'" class="column" data-testid="vb1">
          <ng-container kuiMenu [kuiId]="'vb1a'">
            <button kuiMenuTrigger data-testid="vb1-one">One</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="vb1a-positioner">
                <div kuiMenuPopup class="popup" data-testid="vb1a-popup">
                  <div kuiMenuItem class="item" data-testid="vb1a-x">Alpha</div>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kuiMenu [kuiId]="'vb1b'">
            <button kuiMenuTrigger data-testid="vb1-two">Two</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="vb1b-positioner">
                <div kuiMenuPopup class="popup" data-testid="vb1b-popup">
                  <div kuiMenuItem class="item" data-testid="vb1b-x">Beta</div>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <output data-testid="mm1-output">{{ outside() }}</output>
      </section>
      <section data-fixture="toolbar">
        <div kuiToggleGroup aria-label="Alignment" [(value)]="align" class="bar" data-testid="tg1">
          <button kuiToggle [value]="'left'" data-testid="tg1-left">Left</button>
          <button kuiToggle [value]="'centre'" data-testid="tg1-centre">Centre</button>
          <button kuiToggle [value]="'justify'" [disabled]="true" data-testid="tg1-justify">
            Justify
          </button>
          <button kuiToggle [value]="'right'" data-testid="tg1-right">Right</button>
        </div>
        <output data-testid="tg1-output">{{ align()?.join(",") }}</output>
        <div kuiToolbar aria-label="Editing" class="bar" data-testid="tb1">
          <button kuiToolbarButton data-testid="tb1-save">Save</button>
          <button kuiToolbarButton [disabled]="true" data-testid="tb1-gone">Gone</button>
          <a kuiToolbarLink href="#tb1-help" data-testid="tb1-link">Help</a>
          <div kuiToolbarSeparator data-testid="tb1-line"></div>
          <input kuiToolbarInput aria-label="Zoom" value="100" data-testid="tb1-zoom" />
          <div kuiToolbarGroup data-testid="tb1-group">
            <div
              kuiToggleGroup
              [multiple]="true"
              aria-label="Marks"
              class="bar"
              data-testid="tb1-marks"
            >
              <button kuiToggle [value]="'bold'" data-testid="tb1-bold">Bold</button>
              <button kuiToggle [value]="'italic'" data-testid="tb1-italic">Italic</button>
            </div>
          </div>
          <button kuiToggle data-testid="tb1-pin">Pin</button>
        </div>
      </section>
      <section data-fixture="scroll-area">
        <div kuiScrollArea class="scroll" data-testid="sa1">
          <div kuiScrollAreaViewport class="scroll-view" data-testid="sa1-view">
            <div kuiScrollAreaContent data-testid="sa1-content">
              <div [class]="tall() ? 'scroll-tall' : 'scroll-short'" data-testid="sa1-box">
                Content
              </div>
            </div>
          </div>
          <div *kuiScrollAreaScrollbar class="scroll-bar" data-testid="sa1-y">
            <div kuiScrollAreaThumb class="scroll-thumb" data-testid="sa1-y-thumb"></div>
          </div>
          <div *kuiScrollAreaScrollbar="'horizontal'" class="scroll-bar" data-testid="sa1-x">
            <div kuiScrollAreaThumb class="scroll-thumb" data-testid="sa1-x-thumb"></div>
          </div>
          <div *kuiScrollAreaCorner class="scroll-corner" data-testid="sa1-corner"></div>
        </div>
        <button type="button" data-testid="sa1-grow" (click)="tall.set(!tall())">Grow</button>
      </section>
      <section data-fixture="navigation-menu">
        <nav kuiNavigationMenu [kuiId]="'nm1'" aria-label="Site" data-testid="nm1">
          <ul kuiNavigationMenuList class="nav-list" data-testid="nm1-list">
            <li kuiNavigationMenuItem [value]="'products'">
              <button kuiNavigationMenuTrigger class="nav-trigger" data-testid="nm1-products">
                <span>Products</span>
                <span kuiNavigationMenuIcon>▾</span>
              </button>
              <div *kuiNavigationMenuContent class="nav-content" data-testid="nm1-products-content">
                <a kuiNavigationMenuLink href="#apps" data-testid="nm1-apps">apps</a>
                <a kuiNavigationMenuLink href="#tools" data-testid="nm1-tools">tools</a>
              </div>
            </li>
            <li kuiNavigationMenuItem [value]="'docs'">
              <button kuiNavigationMenuTrigger class="nav-trigger" data-testid="nm1-docs">
                <span>Docs</span>
                <span kuiNavigationMenuIcon>▾</span>
              </button>
              <div
                *kuiNavigationMenuContent
                class="nav-content nav-narrow"
                data-testid="nm1-docs-content"
              >
                <a kuiNavigationMenuLink href="#guide" data-testid="nm1-guide">guide</a>
              </div>
            </li>
            <li kuiNavigationMenuItem>
              <a kuiNavigationMenuLink href="#pricing" [active]="true" data-testid="nm1-pricing">
                Pricing
              </a>
            </li>
          </ul>
          <ng-template kuiNavigationMenuPortal>
            <div kuiNavigationMenuPositioner [sideOffset]="4" data-testid="nm1-positioner">
              <div kuiNavigationMenuPopup class="popup" data-testid="nm1-popup">
                <div kuiNavigationMenuViewport data-testid="nm1-viewport"></div>
              </div>
            </div>
          </ng-template>
        </nav>
      </section>
      <section data-fixture="slider">
        <div kuiSlider [kuiId]="'sl1'" [defaultValue]="40" [name]="'volume'" data-testid="sl1">
          <output kuiSliderValue data-testid="sl1-value"></output>
          <div kuiSliderControl class="slider" data-testid="sl1-control">
            <div kuiSliderTrack class="slider-track">
              <div kuiSliderIndicator class="fill" data-testid="sl1-fill"></div>
              <div kuiSliderThumb class="thumb" aria-label="Volume" data-testid="sl1-thumb"></div>
            </div>
          </div>
        </div>
        <div kuiSlider [kuiId]="'sl2'" [(value)]="span" [step]="5" data-testid="sl2">
          <output kuiSliderValue data-testid="sl2-value"></output>
          <div kuiSliderControl class="slider" data-testid="sl2-control">
            <div kuiSliderTrack class="slider-track">
              <div kuiSliderIndicator class="fill" data-testid="sl2-fill"></div>
              <div
                kuiSliderThumb
                [index]="0"
                class="thumb"
                aria-label="From"
                data-testid="sl2-from"
              ></div>
              <div
                kuiSliderThumb
                [index]="1"
                class="thumb"
                aria-label="To"
                data-testid="sl2-to"
              ></div>
            </div>
          </div>
        </div>
        <span data-testid="sl2-output">{{ list(span()).join(",") }}</span>
        <div
          kuiSlider
          [kuiId]="'sl3'"
          [defaultValue]="30"
          [orientation]="'vertical'"
          [disabled]="true"
          data-testid="sl3"
        >
          <div kuiSliderControl class="slider" data-testid="sl3-control">
            <div kuiSliderTrack class="slider-track">
              <div kuiSliderIndicator class="fill" data-testid="sl3-fill"></div>
              <div kuiSliderThumb class="thumb" aria-label="Level" data-testid="sl3-thumb"></div>
            </div>
          </div>
        </div>
      </section>
      <section data-fixture="field">
        <form
          kuiForm
          [errors]="rejected()"
          (formSubmit)="sent.set(json($event.values))"
          data-testid="f1"
        >
          <fieldset kuiFieldset [kuiId]="'fs1'" data-testid="fs1">
            <div kuiFieldsetLegend data-testid="fs1-legend">Account</div>
            <div kuiField [kuiId]="'fd1'" [name]="'email'" data-testid="fd1">
              <label kuiFieldLabel data-testid="fd1-label">Email</label>
              <input kuiFieldControl type="email" required data-testid="fd1-control" />
              <p kuiFieldDescription data-testid="fd1-description">Your work address</p>
              <div *kuiFieldError data-testid="fd1-error"></div>
              <ng-container *kuiFieldValidity="let validity">
                <span data-testid="fd1-validity">{{ word(validity.valid) }}</span>
              </ng-container>
            </div>
            <div
              kuiField
              [kuiId]="'fd2'"
              [name]="'user'"
              [validationMode]="'onBlur'"
              [validate]="taken"
              data-testid="fd2"
            >
              <label kuiFieldLabel>User</label>
              <input kuiFieldControl data-testid="fd2-control" />
              <div *kuiFieldError data-testid="fd2-error"></div>
            </div>
          </fieldset>
          <button type="submit" data-testid="f1-submit">Send</button>
        </form>
        <button data-testid="f1-reject" (click)="rejected.set({ user: 'Reserved' })">Reject</button>
        <span data-testid="f1-sent">{{ sent() }}</span>
      </section>
      <section data-fixture="field-controls">
        <form kuiForm (formSubmit)="sent2.set(json($event.values))" data-testid="f2">
          <div kuiField [kuiId]="'fc1'" [name]="'terms'" data-testid="fc1">
            <span kuiCheckbox [required]="true" class="box" data-testid="fc1-box">
              <span *kuiCheckboxIndicator class="mark">✓</span>
            </span>
            <label kuiFieldLabel data-testid="fc1-label">Accept</label>
            <div *kuiFieldError data-testid="fc1-error"></div>
          </div>
          <div kuiField [kuiId]="'fc2'" [name]="'plan'" data-testid="fc2">
            <label kuiFieldLabel data-testid="fc2-label">Plan</label>
            <div kuiRadioGroup [required]="true" data-testid="fc2-group">
              <span kuiRadioGroupItem [value]="'free'" class="radio" data-testid="fc2-free"></span>
              <span kuiRadioGroupItem [value]="'pro'" class="radio" data-testid="fc2-pro"></span>
            </div>
            <div *kuiFieldError data-testid="fc2-error"></div>
          </div>
          <div kuiField [kuiId]="'fc3'" [name]="'level'" [disabled]="true" data-testid="fc3">
            <label kuiFieldLabel>Level</label>
            <div kuiSlider [defaultValue]="10" data-testid="fc3-slider">
              <div kuiSliderControl class="slider">
                <div kuiSliderTrack class="slider-track">
                  <div kuiSliderThumb class="thumb" data-testid="fc3-thumb"></div>
                </div>
              </div>
            </div>
          </div>
          <div kuiField [kuiId]="'fc4'" [name]="'alerts'" data-testid="fc4">
            <label kuiFieldLabel data-testid="fc4-label">Alerts</label>
            <span kuiSwitch class="switch" data-testid="fc4-switch">
              <span kuiSwitchThumb class="thumb"></span>
            </span>
          </div>
          <div kuiField [kuiId]="'fc5'" [name]="'fruit'" data-testid="fc5">
            <label kuiFieldLabel data-testid="fc5-label">Fruit</label>
            <ng-container kuiSelect [kuiId]="'fc5s'" [required]="true">
              <button kuiSelectTrigger data-testid="fc5-trigger">
                <span kuiSelectValue [placeholder]="'Pick a fruit'"></span>
              </button>
              <ng-template kuiSelectPortal>
                <div kuiSelectPositioner [sideOffset]="4">
                  <div kuiSelectPopup class="popup" data-testid="fc5-popup">
                    <div kuiSelectItem [value]="'Apple'" class="item" data-testid="fc5-Apple">
                      <span kuiSelectItemText>Apple</span>
                    </div>
                  </div>
                </div>
              </ng-template>
              <input kuiSelectInput />
            </ng-container>
            <div *kuiFieldError data-testid="fc5-error"></div>
          </div>
          <button type="submit" data-testid="f2-submit">Send</button>
        </form>
        <span data-testid="f2-sent">{{ sent2() }}</span>
      </section>
      <section data-fixture="direction">
        <button
          type="button"
          data-testid="dir-turn"
          (click)="reading.set(reading() === 'rtl' ? 'ltr' : 'rtl')"
        >
          Turn
        </button>
        <div [kuiDirection]="reading()" [attr.dir]="reading()" data-testid="dir-box">
          <div kuiTabs [kuiId]="'dt1'" [defaultValue]="'one'" data-testid="dt1">
            <div kuiTabsList class="tabs" data-testid="dt1-list">
              <button kuiTabsTab [value]="'one'" data-testid="dt1-one">One</button>
              <button kuiTabsTab [value]="'two'" data-testid="dt1-two">Two</button>
            </div>
            <div *kuiTabsPanel="'one'">First</div>
            <div *kuiTabsPanel="'two'">Second</div>
          </div>
          <div kuiSlider [kuiId]="'ds1'" [defaultValue]="40" data-testid="ds1">
            <div kuiSliderControl class="slider" data-testid="ds1-control">
              <div kuiSliderTrack class="slider-track">
                <div kuiSliderIndicator class="fill"></div>
                <div kuiSliderThumb class="thumb" aria-label="Volume" data-testid="ds1-thumb"></div>
              </div>
            </div>
          </div>
          <ng-container kuiPopover [kuiId]="'dp1'">
            <button kuiPopoverTrigger data-testid="dp1-trigger">Open popover</button>
            <ng-template kuiPopoverPortal>
              <div
                kuiPopoverPositioner
                [sideOffset]="8"
                [align]="'start'"
                data-testid="dp1-positioner"
              >
                <div kuiPopoverPopup class="popup" data-testid="dp1-popup">
                  <h2 kuiPopoverTitle>Notifications</h2>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </section>
    </main>
  `,
})
export class App {
  protected readonly fruits = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape"]
  protected readonly controlled = signal<boolean | undefined>(false)
  protected readonly fruit = signal<unknown>("Banana")
  protected readonly action = signal("none")
  protected readonly picked = signal("none")
  protected readonly align = signal<readonly unknown[] | undefined>(["left"])
  protected readonly tall = signal(false)
  protected readonly chosen = signal<readonly unknown[] | undefined>(["Banana"])
  protected readonly pick = signal<unknown>(null)
  protected readonly outside = signal(0)
  protected readonly view = signal<unknown>("list")
  protected readonly presses = signal(0)
  protected readonly locked = signal(false)
  protected readonly count = signal(0)
  protected readonly done = signal<number | null>(40)
  protected readonly pictures = signal(false)
  protected readonly sent = signal("")
  protected readonly sent2 = signal("")
  protected readonly reading = signal<"ltr" | "rtl">("rtl")
  protected readonly rejected = signal<Record<string, string> | undefined>(undefined)
  protected readonly json = (values: unknown) => JSON.stringify(values)
  protected readonly word = (valid: boolean | null) =>
    valid === null ? "unchecked" : valid ? "valid" : "invalid"
  protected readonly taken = (value: string) => (value === "admin" ? "Taken" : null)
  protected readonly span = signal<number | readonly number[] | undefined>([20, 80])
  protected readonly list = (value: number | readonly number[] | undefined) =>
    typeof value === "number" ? [value] : (value ?? [])
  // A picture of one pixel, and an address that is not a picture.
  protected readonly pixel =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  protected readonly broken = "data:image/png;base64,AAAA"
  protected readonly alerts = signal<boolean | undefined>(false)
  protected readonly plans = ["free", "pro", "team", "max"]
  protected readonly sections = ["one", "two", "three", "four"]

  protected press(event: Event): void {
    this.presses.update((count) => count + 1)
    if (this.locked()) (event as Event & { preventKiranaHandler(): void }).preventKiranaHandler()
  }
}

import { ApplicationRef, Component, provideZonelessChangeDetection, signal } from "@angular/core"
import { bootstrapApplication } from "@angular/platform-browser"
import { KuiCollapsible, KuiCollapsiblePanel, KuiCollapsibleTrigger } from "@kirana-ui/angular"
import {
  NgpCollapsible,
  NgpCollapsibleContent,
  NgpCollapsibleTrigger,
} from "ng-primitives/collapsible"

/**
 * The bench page: `?lib=kirana|other&n=1000` mounts that many closed collapsibles and times it.
 * `other` is ng-primitives, the library Angular is measured against. (Its closed panel stays in
 * the page, hidden: that is its model.)
 */
const params = new URLSearchParams(location.search)
const lib = params.get("lib") ?? "kirana"
const count = Number(params.get("n") ?? 1000)

@Component({
  selector: "app-root",
  imports: [
    KuiCollapsible,
    KuiCollapsiblePanel,
    KuiCollapsibleTrigger,
    NgpCollapsible,
    NgpCollapsibleContent,
    NgpCollapsibleTrigger,
  ],
  template: `
    @if (shown()) {
      @if (other) {
        @for (index of rows; track index) {
          <div ngpCollapsible>
            <button ngpCollapsibleTrigger>Row {{ index }}</button>
            <div ngpCollapsibleContent>Content {{ index }}</div>
          </div>
        }
      } @else {
        @for (index of rows; track index) {
          <div kuiCollapsible>
            <button kuiCollapsibleTrigger>Row {{ index }}</button>
            <div *kuiCollapsiblePanel>Content {{ index }}</div>
          </div>
        }
      }
    }
  `,
})
class Bench {
  readonly shown = signal(false)
  protected readonly other = lib === "other"
  protected readonly rows = Array.from({ length: count }, (_, index) => index)
}

function timed(work: () => void): number {
  const start = performance.now()
  work()
  void document.body.offsetHeight
  return performance.now() - start
}

void bootstrapApplication(Bench, { providers: [provideZonelessChangeDetection()] }).then((app) => {
  const bench = app.components[0]!.instance as Bench
  const tick = () => app.injector.get(ApplicationRef).tick()
  Object.assign(window, {
    bench: {
      mount: () =>
        timed(() => {
          bench.shown.set(true)
          tick()
        }),
      toggle(howMany: number) {
        const triggers = [...document.querySelectorAll("button")].slice(0, howMany)
        return timed(() => {
          for (const each of triggers) {
            each.click()
            tick()
          }
        })
      },
      unmount: () =>
        timed(() => {
          bench.shown.set(false)
          tick()
        }),
    },
  })
})

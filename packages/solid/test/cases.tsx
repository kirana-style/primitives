// What `src/server.test.ts` renders on a server: Solid's JSX is compiled there, with Solid's
// own preset, as a project's build would.
import type { JSX } from "@solidjs/web"

import { Calendar } from "../src/calendar.tsx"
import { Checkbox } from "../src/checkbox.tsx"
import { Collapsible } from "../src/collapsible.tsx"
import { DateField } from "../src/date-field.tsx"
import { Meter } from "../src/meter.tsx"
import { NumberField } from "../src/number-field.tsx"
import { Primitive, mergeProps } from "../src/primitive.tsx"
import type { PrimitiveProps } from "../src/primitive.tsx"
import { Progress } from "../src/progress.tsx"
import { RadioGroup } from "../src/radio-group.tsx"
import { Select } from "../src/select.tsx"
import { Slider } from "../src/slider.tsx"
import { Switch } from "../src/switch.tsx"
import { Toast, createToaster } from "../src/toast.tsx"

type Drawn = "plain" | "as" | "render"

/** The five parts that hold a native input, each drawn as itself, as another tag, or by its caller. */
export const controls: Record<string, (drawn: Drawn) => JSX.Element> = {
  checkbox: (drawn) => (
    <Checkbox.Root
      id="c"
      name="agree"
      defaultChecked
      as={drawn === "as" ? "a" : undefined}
      render={drawn === "render" ? (props) => <a {...props()} href="/terms" /> : undefined}
    >
      <Checkbox.Indicator>on</Checkbox.Indicator>
    </Checkbox.Root>
  ),
  switch: (drawn) => (
    <Switch.Root
      id="s"
      name="alerts"
      as={drawn === "as" ? "a" : undefined}
      render={drawn === "render" ? (props) => <a {...props()} href="/alerts" /> : undefined}
    >
      <Switch.Thumb />
    </Switch.Root>
  ),
  radio: (drawn) => (
    <RadioGroup.Root id="r" name="size" defaultValue="small">
      <RadioGroup.Item
        value="small"
        as={drawn === "as" ? "a" : undefined}
        render={drawn === "render" ? (props) => <a {...props()} href="/small" /> : undefined}
      >
        Small
      </RadioGroup.Item>
    </RadioGroup.Root>
  ),
  slider: (drawn) => (
    <Slider.Root id="l" name="volume" defaultValue={40}>
      <Slider.Control>
        <Slider.Thumb
          as={drawn === "as" ? "a" : undefined}
          render={drawn === "render" ? (props) => <a {...props()} href="/volume" /> : undefined}
        />
      </Slider.Control>
    </Slider.Root>
  ),
  number: (drawn) => (
    <NumberField.Root
      id="n"
      name="count"
      defaultValue={3}
      as={drawn === "as" ? "section" : undefined}
      render={drawn === "render" ? (props) => <section {...props()} /> : undefined}
    >
      <NumberField.Input />
    </NumberField.Root>
  ),
}

/** A part with nothing of its own to hold: what it was given is the caller's element's. */
export const content = {
  handed: () => (
    <Collapsible.Root id="h">
      <Collapsible.Trigger render={(props) => <a {...props()} href="/more" />}>
        More
      </Collapsible.Trigger>
    </Collapsible.Root>
  ),
  // An element that writes children of its own draws those: the part's go where it puts them.
  placed: () => (
    <Collapsible.Root id="p">
      <Collapsible.Trigger
        render={(props, state) => (
          <a {...props()} href="/more">
            <b>{props().children as JSX.Element}</b>
            {state().panelOpen ? " less" : " more"}
          </a>
        )}
      >
        Read
      </Collapsible.Trigger>
    </Collapsible.Root>
  ),
  // A part that writes its own text hands it over as the children of the props.
  written: () => {
    const toaster = createToaster({ duration: Infinity })
    toaster.add({
      id: "t",
      title: "Saved",
      description: "To the cloud",
      action: { label: "Undo", onAction() {} },
    })
    return (
      <>
        <Meter.Root id="m" value={40}>
          <Meter.Value render={(props) => <b {...props()} class="meter" />} />
        </Meter.Root>
        <Progress.Root id="g" value={25}>
          <Progress.Value render={(props) => <b {...props()} class="progress" />} />
        </Progress.Root>
        <Slider.Root id="w" defaultValue={30}>
          <Slider.Value render={(props) => <b {...props()} class="slider" />} />
        </Slider.Root>
        <Select.Root id="s" defaultValue="kiwi" items={{ kiwi: "Kiwi" }}>
          <Select.Value render={(props) => <b {...props()} class="select" />} />
        </Select.Root>
        <Calendar.Root id="c" defaultValue="2026-03-09" locale="en-US">
          <Calendar.Heading render={(props) => <h2 {...props()} />} />
        </Calendar.Root>
        <DateField.Root id="d" defaultValue="2026-03-09" locale="en-US">
          <DateField.Segments>
            {(segment) => (
              <DateField.Segment segment={segment} render={(props) => <i {...props()} />} />
            )}
          </DateField.Segments>
        </DateField.Root>
        <Toast.Viewport id="ts" toaster={toaster}>
          <Toast.List>
            {(toast) => (
              <Toast.Root toast={toast()}>
                <Toast.Title render={(props) => <h3 {...props()} />} />
                <Toast.Description render={(props) => <p {...props()} />} />
                <Toast.Action render={(props) => <a {...props()} />} />
              </Toast.Root>
            )}
          </Toast.List>
        </Toast.Viewport>
      </>
    )
  },
  // A chosen day's cell, not disabled, whose element writes attributes of its own before the
  // props and after them.
  ordered: () => (
    <Calendar.Root id="o" defaultValue="2026-03-09" locale="en-US">
      <Calendar.Cell
        date="2026-03-09"
        render={(props) => (
          <td data-disabled="true" data-selected="true" {...props()} data-kind="before">
            9
          </td>
        )}
      />
      <Calendar.Cell
        date="2026-03-09"
        render={(props) => (
          <td {...props()} data-disabled="true" data-selected="true" data-kind="after">
            9
          </td>
        )}
      />
    </Calendar.Root>
  ),
  // The element's own `part` attribute, for `::part()`, is the caller's to write.
  named: () => (
    <Collapsible.Root id="n" part="root">
      <Collapsible.Trigger part="trigger">Open</Collapsible.Trigger>
      <Collapsible.Panel
        part="panel"
        keepMounted
        render={(props) => <section {...props()}>Held</section>}
      />
    </Collapsible.Root>
  ),
}

/** A design system's own element, composed as a part is: its props under its caller's. */
function Badge(props: PrimitiveProps<"span", { active: boolean }>) {
  return <Primitive as="span" {...mergeProps({ class: "badge", title: "own" }, props)} />
}

/** A plain element of one's own, drawn as itself, as another tag, or by its caller. */
export const primitive = {
  plain: () => (
    <Badge class="mine" state={{ active: true }} data-kind="new">
      New
    </Badge>
  ),
  as: () => (
    <Badge as="b" title="theirs" state={{ active: false }}>
      New
    </Badge>
  ),
  render: () => (
    <Badge
      class="mine"
      state={{ active: true }}
      render={(props, state) => (
        <a {...props()} href="/new">
          {state().active ? "On" : "Off"}
        </a>
      )}
    />
  ),
}

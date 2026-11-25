import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { agentTools, createAgent, registerTools } from "../../packages/core/src/agent.ts"
import { bind } from "../../packages/core/src/bind.ts"
import { createCollapsible } from "../../packages/core/src/collapsible.ts"
import { createInput } from "../../packages/core/src/input.ts"
import { createRadioGroup } from "../../packages/core/src/radio-group.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createSelect } from "../../packages/core/src/select.ts"
import type { SelectProps } from "../../packages/core/src/select.ts"
import { createSlider } from "../../packages/core/src/slider.ts"
import { createSwitch } from "../../packages/core/src/switch.ts"
import { faults, recorder } from "../../packages/core/src/testing.ts"
import { mount } from "./page.ts"

const PAGE = `
  <div class="page">
    <button class="switch" aria-label="Notifications"><input class="switch-input" /></button>
    <label for="name">Project name</label><input id="name" value="Apollo" />
    <input class="secret" type="password" aria-label="Password" value="hunter2" />
    <button class="more">Details</button>
    <button class="region" aria-label="Region"><span class="shown"></span></button>
    <div class="positioner"><div class="popup">
      <div class="option" data-v="Asia">Asia</div><div class="option" data-v="Europe">Europe</div>
    </div></div>
    <div class="control"><div class="thumb" aria-label="Volume"></div></div>
    <div data-agent-confirm="Deletes the project"><button class="delete">Delete</button></div>
    <div data-agent-hidden><button class="private">Private</button></div>
  </div>`

function page() {
  const root = mount(PAGE)
  const find = <T extends HTMLElement = HTMLElement>(name: string) => root.querySelector<T>(name)!
  const toggled = recorder<boolean>()
  const typed = recorder<string>()
  const picked = recorder<string | null>()
  const turned = recorder<number | number[]>()
  const pressed: string[] = []

  const made = createSwitch(signal({ id: "sw", onCheckedChange: toggled.listen }))
  onTestFinished(bind(find(".switch"), made.root))
  onTestFinished(bind(find(".switch-input"), made.input))
  onTestFinished(made.mount())

  const input = createInput(signal({ onValueChange: typed.listen }))
  onTestFinished(bind(find("#name"), input.input))

  const more = createCollapsible(signal({ id: "co" }))
  onTestFinished(bind(find(".more"), more.trigger))
  onTestFinished(more.mount())

  const select = createSelect(
    signal<SelectProps<string>>({ id: "se", defaultValue: "Asia", onValueChange: picked.listen })
  )
  onTestFinished(select.mount())
  onTestFinished(bind(find(".region"), select.trigger))
  onTestFinished(bind(find(".shown"), select.valuePart))
  for (const each of root.querySelectorAll<HTMLElement>(".option"))
    onTestFinished(bind(each, select.item(each.dataset.v!)))
  onTestFinished(bind(find(".positioner"), select.positioner))
  onTestFinished(bind(find(".popup"), select.popup))
  find(".shown").textContent = "Asia"

  const slider = createSlider(signal({ id: "sl", defaultValue: 40, onValueChange: turned.listen }))
  onTestFinished(bind(find(".control"), slider.control))
  onTestFinished(bind(find(".thumb"), slider.thumb(0)))

  find(".delete").addEventListener("click", () => pressed.push("delete"))
  const agent = createAgent({ root })
  return { root, find, agent, toggled, typed, picked, turned, pressed, select }
}

describe("the agent bridge", () => {
  it("lists the page's components: what each is, is called, holds and takes", () => {
    const { agent } = page()
    const seen = agent.snapshot().map(({ ref: _ref, ...rest }) => rest)
    expect(seen).toEqual([
      {
        component: "switch",
        label: "Notifications",
        checked: false,
        actions: ["setChecked", "toggle"],
      },
      {
        component: "input",
        label: "Project name",
        value: "Apollo",
        actions: ["setValue", "clear"],
      },
      // A password is never read out.
      {
        component: "input",
        label: "Password",
        value: "[redacted]",
        actions: ["setValue", "clear"],
      },
      { component: "disclosure", label: "Details", open: false, actions: ["open", "toggle"] },
      {
        component: "select",
        label: "Region",
        value: "Asia",
        open: false,
        actions: ["setValue", "open", "close"],
      },
      { component: "slider", label: "Volume", value: 40, min: 0, max: 100, actions: ["setValue"] },
      { component: "button", label: "Delete", confirm: "Deletes the project", actions: ["press"] },
    ])
  })

  it("asks through the component's own handlers: its callback hears an agent", async () => {
    const { agent, toggled, typed, find } = page()
    const result = await agent.act({
      steps: [
        { ref: "notifications", action: "setChecked", args: [true] },
        { ref: "Project name", action: "setValue", args: ["Atlas"] },
      ],
    })
    expect(result.ok).toBe(true)
    expect(result.steps.map((each) => each.now?.checked ?? each.now?.value)).toEqual([
      true,
      "Atlas",
    ])
    expect(toggled.calls.map((each) => `${each.value} ${each.source}`)).toEqual(["true agent"])
    expect(typed.calls).toEqual([{ value: "Atlas", reason: "input-change", source: "agent" }])
    expect(find<HTMLInputElement>("#name").value).toBe("Atlas")
    // Already so: nothing is pressed, and nothing is heard.
    await agent.act({ steps: [{ ref: "Notifications", action: "setChecked", args: [true] }] })
    expect(toggled.calls.length).toBe(1)
  })

  it("is refused by a callback like anyone else, and says what took effect", async () => {
    const { agent, toggled } = page()
    toggled.refuse()
    const result = await agent.act({ steps: [{ ref: "Notifications", action: "toggle" }] })
    expect(result.ok).toBe(true)
    expect(result.steps[0]!.now?.checked).toBe(false)
  })

  it("chooses from a list by its label, and reads a closed list's choices", async () => {
    const { agent, picked, select } = page()
    const [region] = await agent.query({ within: "Region" })
    expect(region!.items).toEqual([
      { value: "Asia", label: "Asia" },
      { value: "Europe", label: "Europe" },
    ])
    expect(select.open.peek()).toBe(false)
    const result = await agent.act({
      steps: [{ ref: "Region", action: "setValue", args: ["europe"] }],
    })
    expect(result.error).toBe(undefined)
    expect(picked.calls).toEqual([{ value: "Europe", reason: "item-press", source: "agent" }])
    expect(select.open.peek()).toBe(false)
    const none = await agent.act({ steps: [{ ref: "Region", action: "setValue", args: ["Mars"] }] })
    expect(none.error).toBe('Step 1 (Region): It has no choice "Mars"')
  })

  it("turns a slider by its own keys, held to its range", async () => {
    const { agent, turned } = page()
    await agent.act({ steps: [{ ref: "Volume", action: "setValue", args: [43] }] })
    expect(turned.calls.at(-1)).toEqual({
      value: 43,
      reason: turned.calls.at(-1)!.reason,
      source: "agent",
    })
    const far = await agent.act({ steps: [{ ref: "Volume", action: "setValue", args: [500] }] })
    expect(far.steps[0]!.now?.value).toBe(100)
  })

  it("needs a person where the page says so, whatever the policy allows", async () => {
    const { agent, root, pressed } = page()
    const alone = await agent.act({ steps: [{ ref: "Delete", action: "press" }] })
    expect(alone.error).toBe("Step 1 (Delete): Needs a person: Deletes the project")
    // A policy that allows everything is not a person's answer.
    const open = createAgent({ root, allow: () => true })
    const still = await open.act({ steps: [{ ref: "Delete", action: "press" }] })
    expect(still.error).toBe("Step 1 (Delete): Needs a person: Deletes the project")
    expect(pressed).toEqual([])
    const asked: string[] = []
    const answers = [false, true]
    const guarded = createAgent({
      root,
      allow(action) {
        asked.push(`allow ${action.component} ${action.label} ${action.action}`)
        return action.label === "Delete"
      },
      confirm(action) {
        asked.push(`confirm ${action.label}: ${action.confirm}`)
        return answers.shift()!
      },
    })
    const declined = await guarded.act({ steps: [{ ref: "Delete", action: "press" }] })
    expect(declined.error).toBe("Step 1 (Delete): Declined: Deletes the project")
    expect(pressed).toEqual([])
    expect((await guarded.act({ steps: [{ ref: "Delete", action: "press" }] })).ok).toBe(true)
    expect(pressed).toEqual(["delete"])
    // The policy is asked first, and what it refuses never reaches a person.
    const refused = await guarded.act({ steps: [{ ref: "Details", action: "open" }] })
    expect(refused.error).toBe("Step 1 (Details): Refused")
    expect(asked).toEqual([
      "allow button Delete press",
      "confirm Delete: Deletes the project",
      "allow button Delete press",
      "confirm Delete: Deletes the project",
      "allow disclosure Details open",
    ])
  })

  it("says what it cannot do, and stops at the step that failed", async () => {
    const { agent, find } = page()
    const result = await agent.act({
      steps: [
        { ref: "Details", action: "open" },
        { ref: "Nowhere", action: "press" },
        { ref: "Notifications", action: "toggle" },
      ],
    })
    expect(result.ok).toBe(false)
    expect(result.steps.length).toBe(1)
    expect(result.error).toBe('Step 2 (Nowhere): Nothing is called "Nowhere"')
    expect(find(".switch").getAttribute("aria-checked")).toBe("false")
    const wrong = await agent.act({ steps: [{ ref: "Volume", action: "press" }] })
    expect(wrong.error).toBe('Step 1 (Volume): A slider has no action "press" now: setValue')
  })

  it("keeps what it changed, and takes it back through the same handlers", async () => {
    const { agent, toggled, typed, find, pressed, root } = page()
    await agent.act({
      steps: [
        { ref: "Notifications", action: "toggle" },
        { ref: "Project name", action: "setValue", args: ["Atlas"] },
      ],
    })
    // A person's change is not the agent's to take back.
    find(".more").click()
    expect(
      agent.history().map((each) => `${each.before.label} ${each.action} ${each.undone}`)
    ).toEqual(["Notifications toggle false", "Project name setValue false"])
    expect((await agent.undo()).ok).toBe(true)
    expect(find<HTMLInputElement>("#name").value).toBe("Apollo")
    expect(typed.calls.at(-1)).toEqual({ value: "Apollo", reason: "input-change", source: "agent" })
    await agent.undo()
    expect(find(".switch").getAttribute("aria-checked")).toBe("false")
    expect(toggled.calls.map((each) => each.source)).toEqual(["agent", "agent"])
    expect((await agent.undo()).error).toBe("Nothing to take back")
    expect(agent.history().every((each) => each.undone)).toBe(true)
    // Again, and a new change forgets what was taken back after it.
    await agent.redo()
    expect(find(".switch").getAttribute("aria-checked")).toBe("true")
    await agent.act({ steps: [{ ref: "Volume", action: "setValue", args: [45] }] })
    expect(agent.history().map((each) => each.before.label)).toEqual(["Notifications", "Volume"])
    expect((await agent.redo()).error).toBe("Nothing to do again")
    // A press is not a state to go back to.
    const guarded = createAgent({ root, confirm: () => true })
    await guarded.act({ steps: [{ ref: "Delete", action: "press" }] })
    expect(pressed).toEqual(["delete"])
    expect(guarded.history()).toEqual([])
  })

  it("does not keep a change a callback refused", async () => {
    const { agent, toggled } = page()
    toggled.refuse()
    await agent.act({ steps: [{ ref: "Notifications", action: "toggle" }] })
    expect(agent.history()).toEqual([])
  })

  it("hears what changed, whoever changed it", async () => {
    const { agent, find } = page()
    const heard: string[] = []
    onTestFinished(
      agent.subscribe((changed) =>
        heard.push(...changed.map((each) => `${each.label} ${String(each.checked ?? each.open)}`))
      )
    )
    find(".switch").click()
    await expect.poll(() => heard).toEqual(["Notifications true"])
  })

  it("offers nothing a read-only control refuses, and says why not when asked", async () => {
    const root = mount(`
      <span class="box" aria-label="Terms"><input class="box-input" /></span>
      <button class="region" aria-label="Region"><span class="shown">Asia</span></button>
      <div class="positioner"><div class="popup"><div class="option">Europe</div></div></div>
      <div class="control"><div class="thumb" aria-label="Volume"></div></div>
      <input aria-label="Code" value="A1" readonly />`)
    const find = (name: string) => root.querySelector<HTMLElement>(name)!
    const picked = recorder<string | null>()
    const turned = recorder<number | number[]>()
    const box = createSwitch(signal({ id: "b", readOnly: true }))
    onTestFinished(bind(find(".box"), box.root))
    onTestFinished(bind(find(".box-input"), box.input))
    const select = createSelect(
      signal<SelectProps<string>>({
        id: "se",
        defaultValue: "Asia",
        readOnly: true,
        onValueChange: picked.listen,
      })
    )
    onTestFinished(select.mount())
    onTestFinished(bind(find(".region"), select.trigger))
    onTestFinished(bind(find(".option"), select.item("Europe")))
    onTestFinished(bind(find(".positioner"), select.positioner))
    onTestFinished(bind(find(".popup"), select.popup))
    const slider = createSlider(
      signal({ id: "sl", defaultValue: 40, readOnly: true, onValueChange: turned.listen })
    )
    onTestFinished(bind(find(".control"), slider.control))
    onTestFinished(bind(find(".thumb"), slider.thumb(0)))
    const agent = createAgent({ root })
    expect(agent.snapshot().map((each) => `${each.label}: ${each.actions.join(" ")}`)).toEqual([
      "Terms: ",
      // Its list still opens to be read.
      "Region: open close",
      "Volume: ",
      "Code: ",
    ])
    const refused = await agent.act({
      steps: [{ ref: "Volume", action: "setValue", args: [60] }],
    })
    expect(refused.ok).toBe(false)
    expect(refused.error).toContain('has no action "setValue" now')
    const [region] = await agent.query({ within: "Region" })
    expect(region!.items).toEqual([{ value: "Europe", label: "Europe" }])
    expect(
      (await agent.act({ steps: [{ ref: "Region", action: "setValue", args: ["Europe"] }] })).ok
    ).toBe(false)
    expect(picked.calls).toEqual([])
    expect(turned.calls).toEqual([])
  })

  it("gives its tools to a browser's own agent, each step asked for", async () => {
    const { agent, toggled } = page()
    const tools = new Map<
      string,
      { execute(input: unknown): Promise<unknown>; annotations: object }
    >()
    const fake = {
      registerTool: (tool: { name: string }) => void tools.set(tool.name, tool as never),
    }
    Object.defineProperty(document, "modelContext", { value: fake, configurable: true })
    onTestFinished(() => void delete (document as { modelContext?: unknown }).modelContext)
    const asked: string[] = []
    const remove = registerTools(agent, {
      allow: (step) => {
        asked.push(step.action)
        return step.action !== "press"
      },
    })
    expect([...tools.keys()]).toEqual(agentTools.map((each) => each.name))
    expect(tools.get("snapshot")!.annotations).toEqual({
      readOnlyHint: true,
      untrustedContentHint: true,
    })
    await tools.get("act")!.execute({ steps: [{ ref: "Notifications", action: "toggle" }] })
    expect(toggled.calls.length).toBe(1)
    const refused = (await tools.get("act")!.execute({
      steps: [{ ref: "Delete", action: "press" }],
    })) as { error: string }
    expect(refused.error).toBe("Step 1 (Delete): Refused")
    expect(asked).toEqual(["toggle", "press"])
    remove()
  })
})

describe("the agent bridge, on what a page really writes", () => {
  it("names a switch by the label of its hidden input, and the switch says so itself", async () => {
    const root = mount(`
      <span class="switch"><input class="input" /></span>
      <label for="alerts">Alerts</label>`)
    const toggled = recorder<boolean>()
    const made = createSwitch(signal({ id: "alerts", onCheckedChange: toggled.listen }))
    const box = root.querySelector<HTMLElement>(".switch")!
    onTestFinished(bind(box, made.root))
    onTestFinished(bind(root.querySelector<HTMLElement>(".input")!, made.input))
    const agent = createAgent({ root })
    expect(agent.snapshot()[0]).toMatchObject({ component: "switch", label: "Alerts" })
    // For a screen reader too: the element with the role points at the label.
    const label = root.querySelector("label")!
    expect(label.id).toBe("alerts-label")
    expect(box.getAttribute("aria-labelledby")).toBe("alerts-label")
    const done = await agent.act({ steps: [{ ref: "Alerts", action: "toggle" }] })
    expect(done.ok).toBe(true)
    expect(toggled.calls.at(-1)).toMatchObject({ value: true, source: "agent" })
  })

  it("leaves a switch the page named itself as it is named", () => {
    const root = mount(`
      <span class="switch" aria-label="Mute"><input class="input" /></span>
      <label for="mute">Sound off</label>`)
    const made = createSwitch(signal({ id: "mute" }))
    const box = root.querySelector<HTMLElement>(".switch")!
    onTestFinished(bind(box, made.root))
    onTestFinished(bind(root.querySelector<HTMLElement>(".input")!, made.input))
    expect(box.hasAttribute("aria-labelledby")).toBe(false)
    expect(root.querySelector("label")!.id).toBe("")
    expect(createAgent({ root }).snapshot()[0]!.label).toBe("Mute")
  })

  it("reads a radio group's choices by their labels, and chooses one", async () => {
    const root = mount(`
      <div class="group" aria-label="Plan">
        <span class="radio" data-v="free"><input /></span><label for="plan-free">Free</label>
        <label><span class="radio" data-v="pro"><input /></span>Pro</label>
      </div>`)
    const chosen = recorder<string | null>()
    const group = createRadioGroup<string>(
      signal({ id: "plan", defaultValue: "free", onValueChange: chosen.listen })
    )
    onTestFinished(bind(root.querySelector<HTMLElement>(".group")!, group.root))
    for (const each of root.querySelectorAll<HTMLElement>(".radio")) {
      const value = each.dataset.v!
      onTestFinished(bind(each, group.item(value)))
      onTestFinished(
        bind(
          each.querySelector("input")!,
          group.itemInput(value, () => ({ id: `plan-${value}` }))
        )
      )
    }
    const agent = createAgent({ root })
    expect(agent.snapshot()[0]).toMatchObject({
      component: "radio-group",
      label: "Plan",
      value: "Free",
      items: [
        { value: "Free", label: "Free" },
        { value: "Pro", label: "Pro" },
      ],
    })
    const radios = root.querySelectorAll(".radio")
    expect(radios[0]!.getAttribute("aria-labelledby")).toBe("plan-free-label")
    expect(radios[1]!.getAttribute("aria-labelledby")).toBe("plan-pro-label")
    const done = await agent.act({ steps: [{ ref: "Plan", action: "setValue", args: ["Pro"] }] })
    expect(done.steps[0]!.now?.value).toBe("Pro")
    expect(chosen.calls.at(-1)).toMatchObject({ value: "pro", source: "agent" })
  })

  it("sets a slider at once through its thumb's input, and names the thumb as its slider", async () => {
    const root = mount(`
      <div class="slider" aria-label="Retention">
        <div class="control"><div class="thumb"><input class="input" /></div></div>
      </div>`)
    const turned = recorder<number | number[]>()
    const slider = createSlider(
      signal({
        id: "rt",
        defaultValue: 30,
        min: 7,
        max: 365,
        step: 5,
        onValueChange: turned.listen,
      })
    )
    onTestFinished(bind(root.querySelector<HTMLElement>(".slider")!, slider.root))
    onTestFinished(bind(root.querySelector<HTMLElement>(".control")!, slider.control))
    onTestFinished(bind(root.querySelector<HTMLElement>(".thumb")!, slider.thumb(0)))
    onTestFinished(bind(root.querySelector<HTMLElement>(".input")!, slider.thumbInput(0)))
    const agent = createAgent({ root })
    expect(agent.snapshot()[0]).toMatchObject({ component: "slider", label: "Retention" })
    expect(root.querySelector(".thumb")!.getAttribute("aria-label")).toBe("Retention")
    const done = await agent.act({
      steps: [{ ref: "Retention", action: "setValue", args: [92] }],
    })
    expect(done.ok).toBe(true)
    expect(done.steps[0]!.now?.value).toBe(92)
    // One change, not sixty-two keys.
    expect(turned.calls).toHaveLength(1)
    expect(turned.calls[0]).toMatchObject({ value: 92, source: "agent" })
    // A value its step does not hold is said, with what it holds, and the change is kept.
    const off = await agent.act({ steps: [{ ref: "Retention", action: "setValue", args: [93] }] })
    expect(off.ok).toBe(false)
    expect(off.error).toContain("It holds")
    expect(off.steps[0]!.now?.value).not.toBe(93)
  })

  it("hides whatever is inside a secret mark, of any kind", async () => {
    const root = mount(`
      <div data-agent-secret>
        <button role="combobox" aria-label="Customer" aria-expanded="true" aria-controls="cust">Acme Ltd</button>
        <div id="cust" role="listbox"><div role="option">Acme Ltd</div></div>
        <button role="switch" aria-checked="true" aria-label="On probation"></button>
        <div role="slider" aria-label="Salary" aria-valuenow="70" aria-valuemin="0" aria-valuemax="100"></div>
        <input aria-label="Notes" value="private" />
      </div>
      <input aria-label="Open" value="public" />`)
    const read = Object.fromEntries(
      createAgent({ root })
        .snapshot()
        .map((each) => [each.label, each])
    )
    expect(read["Customer"]!.value).toBe("[redacted]")
    expect(read["Customer"]!.items).toBeUndefined()
    expect(read["On probation"]!.checked).toBeUndefined()
    expect(read["Salary"]!.value).toBe("[redacted]")
    expect(read["Notes"]!.value).toBe("[redacted]")
    expect(read["Open"]!.value).toBe("public")
    expect(JSON.stringify(read)).not.toContain("Acme")
    // And a change over what was not read is not put back as the word "redacted".
    const agent = createAgent({ root })
    await agent.act({ steps: [{ ref: "Notes", action: "setValue", args: ["new"] }] })
    expect((await agent.undo()).ok).toBe(false)
    expect(root.querySelector<HTMLInputElement>('[aria-label="Notes"]')!.value).toBe("new")
  })

  it("refuses a step that names nothing", async () => {
    const root = mount(`<button class="bare"></button><button>Save</button>`)
    let pressed = 0
    root.querySelector(".bare")!.addEventListener("click", () => pressed++)
    const agent = createAgent({ root })
    for (const ref of ["", "   "]) {
      const done = await agent.act({ steps: [{ ref, action: "press" }] })
      expect(done.ok).toBe(false)
      expect(done.error).toContain("by its ref or its label")
    }
    expect(pressed).toBe(0)
    // By its ref it is still reached.
    const bare = agent.snapshot().find((each) => each.label === undefined)!
    expect((await agent.act({ steps: [{ ref: bare.ref, action: "press" }] })).ok).toBe(true)
    expect(pressed).toBe(1)
  })

  it("sees what a narrowed root opened, drawn outside it and over it", async () => {
    const all = mount(`
      <div class="root" inert>
        <input aria-label="Project name" value="Apollo" />
        <button aria-haspopup="dialog" aria-expanded="true" aria-controls="confirm">Delete</button>
        <button aria-expanded="false" aria-controls="other">More</button>
      </div>
      <div id="confirm" role="dialog" aria-label="Delete the project?">
        <button>Cancel</button>
        <button aria-expanded="true" aria-controls="why">Reason</button>
      </div>
      <div id="why" role="menu"><div role="menuitem">Not needed</div></div>
      <div id="other" role="dialog" aria-label="Someone else's"><button>Theirs</button></div>
      <button>Outside</button>`)
    const agent = createAgent({ root: all.querySelector(".root")! })
    const seen = agent.snapshot().map((each) => each.label)
    // The form under the modal dialog is inert, as it is for a person.
    expect(seen).toEqual(["Delete the project?", "Cancel", "Reason", "Not needed"])
    const heard: string[] = []
    onTestFinished(
      agent.subscribe((changed) => heard.push(...changed.map((each) => String(each.label))))
    )
    all.querySelector("#confirm button")!.setAttribute("disabled", "")
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(heard).toContain("Cancel")
  })

  it("is not a fault to mark a page for an agent", () => {
    const root = mount(`
      <div data-agent-secret><button data-agent-confirm="Deletes it">Delete</button></div>
      <div data-agent-hidden></div><div data-mine></div>`)
    expect(faults(root)).toEqual([expect.stringContaining("data-mine")])
  })
})

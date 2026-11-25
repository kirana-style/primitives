import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { agentTools, createAgent, registerTools } from "../../packages/core/src/agent.ts"
import type { AgentEvent, AgentKind } from "../../packages/core/src/agent.ts"
import { bind } from "../../packages/core/src/bind.ts"
import { createCollapsible } from "../../packages/core/src/collapsible.ts"
import { createDateField } from "../../packages/core/src/date-field.ts"
import type { DateField } from "../../packages/core/src/date-field.ts"
import { createInput } from "../../packages/core/src/input.ts"
import { createPasswordInput } from "../../packages/core/src/password-input.ts"
import { createRadioGroup } from "../../packages/core/src/radio-group.ts"
import { effect, signal } from "../../packages/core/src/reactivity.ts"
import { createSelect } from "../../packages/core/src/select.ts"
import type { SelectProps } from "../../packages/core/src/select.ts"
import { createSlider } from "../../packages/core/src/slider.ts"
import { createSwitch } from "../../packages/core/src/switch.ts"
import { faults, recorder } from "../../packages/core/src/testing.ts"
import { createTimeField } from "../../packages/core/src/time-field.ts"
import type { TimeField } from "../../packages/core/src/time-field.ts"
import { createTree } from "../../packages/core/src/tree.ts"
import type { TreeProps } from "../../packages/core/src/tree.ts"
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
    // WebMCP's hint that a tool's actions may be significant or not taken back.
    expect(tools.get("act")!.annotations).toEqual({
      readOnlyHint: false,
      untrustedContentHint: true,
      consequentialHint: true,
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

  it("lists no choices of a secret control when asked for them, and opens nothing", async () => {
    const root = mount(`
      <div data-agent-secret>
        <button class="customer" aria-label="Secret customer"><span class="shown">Acme Ltd</span></button>
        <div role="radiogroup" aria-label="Tier">
          <button role="radio" aria-checked="true">Gold</button><button role="radio" aria-checked="false">Lead</button>
        </div>
        <div role="tablist" aria-label="Ledger">
          <button role="tab" aria-selected="true">Payroll</button><button role="tab" aria-selected="false">Bonuses</button>
        </div>
        <div role="listbox" aria-label="Debtors"><div role="option" aria-selected="true">Initech</div></div>
        <div role="tree" aria-label="Accounts"><div role="treeitem" aria-selected="true">Umbrella</div></div>
        <button role="combobox" aria-label="Partner" aria-expanded="true" aria-controls="partners">Hooli</button>
        <div id="partners" role="listbox"><div role="option">Hooli</div></div>
      </div>
      <div class="positioner"><div class="popup">
        <div class="option" data-v="acme">Acme Ltd</div><div class="option" data-v="globex">Globex</div>
      </div></div>`)
    const opened: boolean[] = []
    const select = createSelect(
      signal<SelectProps<string>>({
        id: "secret-select",
        defaultValue: "acme",
        onOpenChange: (open) => void opened.push(open),
      })
    )
    onTestFinished(select.mount())
    onTestFinished(bind(root.querySelector<HTMLElement>(".customer")!, select.trigger))
    onTestFinished(bind(root.querySelector<HTMLElement>(".shown")!, select.valuePart))
    for (const each of root.querySelectorAll<HTMLElement>(".option"))
      onTestFinished(bind(each, select.item(each.dataset.v!)))
    onTestFinished(bind(root.querySelector<HTMLElement>(".positioner")!, select.positioner))
    onTestFinished(bind(root.querySelector<HTMLElement>(".popup")!, select.popup))
    const agent = createAgent({ root })
    for (const name of ["Secret customer", "Tier", "Ledger", "Debtors", "Accounts", "Partner"]) {
      const [found] = await agent.query({ within: name })
      expect(found!.label).toBe(name)
      expect(found!.items).toBeUndefined()
      expect(found!.actions.length).toBeGreaterThan(0)
      const text = JSON.stringify(found)
      for (const word of [
        "Acme",
        "Globex",
        "Gold",
        "Lead",
        "Payroll",
        "Initech",
        "Umbrella",
        "Hooli",
      ])
        expect(text).not.toContain(word)
    }
    expect(opened).toEqual([])
    expect(select.open.peek()).toBe(false)
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

const wait = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms))

describe("the agent bridge, beside a person", () => {
  it("says of each change which state, from what, to what, and who made it", async () => {
    const { agent, find, toggled } = page()
    const heard: AgentEvent[] = []
    onTestFinished(agent.subscribe((_changed, changes) => void heard.push(...changes)))
    await agent.act({ steps: [{ ref: "Notifications", action: "toggle" }] })
    expect(heard.at(-1)).toMatchObject({
      label: "Notifications",
      key: "checked",
      value: true,
      previous: false,
      source: "agent",
      reason: "press",
    })
    // A person's press on the same switch: the part says what made it.
    find(".switch").dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" })
    )
    find(".switch").dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }))
    await wait()
    expect(heard.at(-1)).toMatchObject({ key: "checked", value: false, source: "mouse" })
    // And the switch's own callback: the press, not the hidden input's change, made it.
    expect(toggled.calls.at(-1)).toMatchObject({ value: false, source: "mouse" })
    // A control of no library, changed by the page's own code.
    const plainBox = document.createElement("button")
    plainBox.setAttribute("aria-pressed", "false")
    plainBox.setAttribute("aria-label", "Bold")
    find(".more").after(plainBox)
    await wait()
    plainBox.setAttribute("aria-pressed", "true")
    await wait()
    expect(heard.at(-1)).toMatchObject({ label: "Bold", key: "checked", source: "programmatic" })
    // What is not read back is never told.
    expect(JSON.stringify(heard)).not.toContain("hunter2")
  })

  it("keeps a person's changes beside its own, each as a sentence, typing as one", async () => {
    const { agent, find } = page()
    onTestFinished(agent.record())
    await agent.act({ steps: [{ ref: "Project name", action: "setValue", args: ["Atlas"] }] })
    const name = find<HTMLInputElement>("#name")
    for (const text of ["Atlas ", "Atlas V"]) {
      name.dispatchEvent(new KeyboardEvent("keydown", { key: "V", bubbles: true }))
      name.value = text
      name.dispatchEvent(new InputEvent("input", { bubbles: true }))
      await wait(50)
    }
    find(".switch").dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }))
    await wait()
    expect(agent.history().map((each) => [each.source, each.text])).toEqual([
      ["agent", 'The agent set Project name to "Atlas"'],
      ["keyboard", 'A person set Project name to "Atlas V"'],
      ["mouse", "A person turned Notifications on"],
    ])
  })

  it("takes back what one source did and leaves what someone else changed since", async () => {
    const { agent, find } = page()
    onTestFinished(agent.record())
    await agent.act({
      steps: [
        { ref: "Project name", action: "setValue", args: ["Atlas"] },
        { ref: "Notifications", action: "setChecked", args: [true] },
      ],
    })
    // A person goes on from the agent's name.
    const name = find<HTMLInputElement>("#name")
    name.dispatchEvent(new KeyboardEvent("keydown", { key: "s", bubbles: true }))
    name.value = "Atlas 2"
    name.dispatchEvent(new InputEvent("input", { bubbles: true }))
    await wait()
    const back = await agent.undoSource("agent")
    expect(find(".switch").getAttribute("aria-checked")).toBe("false")
    // The person's text is not undone with the agent's.
    expect(name.value).toBe("Atlas 2")
    expect(back.ok).toBe(false)
    expect(back.error).toContain("Project name")
    expect(agent.history().map((each) => each.undone)).toEqual([false, true, false])
  })

  it("goes to any point of what was done, back and forward", async () => {
    const { agent, find } = page()
    await agent.act({
      steps: [
        { ref: "Project name", action: "setValue", args: ["Atlas"] },
        { ref: "Notifications", action: "setChecked", args: [true] },
        { ref: "Project name", action: "setValue", args: ["Borealis"] },
      ],
    })
    const name = find<HTMLInputElement>("#name")
    expect((await agent.seek(1)).ok).toBe(true)
    expect(name.value).toBe("Atlas")
    expect(find(".switch").getAttribute("aria-checked")).toBe("false")
    expect((await agent.seek(0)).ok).toBe(true)
    expect(name.value).toBe("Apollo")
    expect((await agent.seek(3)).ok).toBe(true)
    expect(name.value).toBe("Borealis")
    expect(find(".switch").getAttribute("aria-checked")).toBe("true")
    expect(agent.history().every((each) => !each.undone)).toBe(true)
  })

  it("keeps a step that takes many events once while recording, and takes it back", async () => {
    const root = mount(`<div class="control"><div class="thumb" aria-label="Volume"></div></div>`)
    // A caller who holds the value and hands it back a moment later, as a framework does: the
    // slider has no input in its thumb, so the step moves it by its keys, waiting for each.
    const props = signal({
      id: "held",
      step: 10,
      value: 20,
      onValueChange: (value: number | number[]) =>
        void setTimeout(() => props.set({ ...props.peek(), value: value as number }), 40),
    })
    const slider = createSlider(props)
    onTestFinished(bind(root.querySelector<HTMLElement>(".control")!, slider.control))
    onTestFinished(bind(root.querySelector<HTMLElement>(".thumb")!, slider.thumb(0)))
    const agent = createAgent({ root })
    onTestFinished(agent.record())
    const volume = () => root.querySelector(".thumb")!.getAttribute("aria-valuenow")
    await agent.act({ steps: [{ ref: "Volume", action: "setValue", args: [50] }] })
    await agent.act({ steps: [{ ref: "Volume", action: "setValue", args: [80] }] })
    await wait()
    expect(volume()).toBe("80")
    expect(agent.history().map((each) => [each.source, each.text])).toEqual([
      ["agent", "The agent set Volume to 50"],
      ["agent", "The agent set Volume to 80"],
    ])
    expect((await agent.undo()).ok).toBe(true)
    await wait()
    expect(volume()).toBe("50")
    expect(agent.history().map((each) => each.undone)).toEqual([false, true])
    expect((await agent.seek(0)).ok).toBe(true)
    await wait()
    expect(volume()).toBe("20")
    expect(agent.history()).toHaveLength(2)
    expect(agent.history().every((each) => each.undone)).toBe(true)
  })

  it("shows a suggestion in the controls, and takes it back or keeps it", async () => {
    const { agent, find } = page()
    const steps = [
      { ref: "Project name", action: "setValue", args: ["Atlas"] },
      { ref: "Notifications", action: "toggle" },
    ]
    const shown = await agent.stage({ steps })
    expect(shown.ok).toBe(true)
    expect(shown.applied.map((each) => each.text)).toEqual([
      'The agent set Project name to "Atlas"',
      "The agent turned Notifications on",
    ])
    expect(find<HTMLInputElement>("#name").value).toBe("Atlas")
    expect(agent.history()).toHaveLength(0)
    expect((await shown.revert()).ok).toBe(true)
    expect(find<HTMLInputElement>("#name").value).toBe("Apollo")
    expect(find(".switch").getAttribute("aria-checked")).toBe("false")
    expect((await shown.revert()).ok).toBe(false)
    const kept = await agent.stage({ steps })
    kept.keep()
    expect(agent.history()).toHaveLength(2)
  })

  it("finds a control by a word of its label, by the text of its row, by a choice, by its kind", async () => {
    const root = mount(`
      <label for="pn">Project name</label><input id="pn" value="Apollo" />
      <div class="row"><span>Weekly digest</span><button role="switch" aria-checked="false"></button></div>
      <div role="radiogroup" aria-label="Plan">
        <button role="radio" aria-checked="true" aria-label="Free"></button>
        <button role="radio" aria-checked="false" aria-label="Pro"></button>
      </div>
      <button>Save changes</button><button>Save draft</button>`)
    const radios = root.querySelectorAll('[role="radio"]')
    for (const each of radios) {
      each.addEventListener("click", () => {
        for (const other of radios) other.setAttribute("aria-checked", String(other === each))
      })
    }
    const toggle = root.querySelector('[role="switch"]')!
    toggle.addEventListener("click", () => toggle.setAttribute("aria-checked", "true"))
    const agent = createAgent({ root })
    const run = (ref: string, action: string, args?: unknown[]) =>
      agent.act({ steps: [{ ref, action, ...(args ? { args } : {}) }] })
    expect((await run("name", "setValue", ["Atlas"])).ok).toBe(true)
    expect(root.querySelector<HTMLInputElement>("#pn")!.value).toBe("Atlas")
    expect((await run("Weekly digest", "toggle")).steps[0]!.now?.checked).toBe(true)
    expect((await run("Pro", "press")).steps[0]!.now?.value).toBe("Pro")
    expect((await run("the input", "clear")).ok).toBe(true)
    // A word two controls share is said with both, never guessed.
    const both = await run("Save", "press")
    expect(both.ok).toBe(false)
    expect(both.error).toMatch(
      /names 2 components: c\d+ \(button "Save changes"\), c\d+ \(button "Save draft"\)/
    )
  })

  it("opens a closed menu to press an item of it, and closes the ones it is not in", async () => {
    const root = mount(`
      <button id="file" aria-haspopup="menu" aria-expanded="false" aria-controls="file-menu">File</button>
      <div id="file-menu" role="menu" hidden><div role="menuitem">Open</div></div>
      <button id="edit" aria-haspopup="menu" aria-expanded="false" aria-controls="edit-menu">Edit</button>
      <div id="edit-menu" role="menu" hidden><div role="menuitem">Rename</div></div>`)
    const pressed: string[] = []
    for (const name of ["file", "edit"]) {
      const trigger = root.querySelector(`#${name}`)!
      const menu = root.querySelector<HTMLElement>(`#${name}-menu`)!
      const set = (open: boolean) => {
        trigger.setAttribute("aria-expanded", String(open))
        menu.hidden = !open
      }
      trigger.addEventListener("click", () => set(menu.hidden === true))
      root.addEventListener("keydown", (event) => {
        if ((event as KeyboardEvent).key === "Escape") set(false)
      })
      menu.addEventListener("click", (event) => {
        pressed.push(textOfItem(event.target))
        set(false)
      })
    }
    const opened: string[] = []
    const agent = createAgent({
      root,
      allow: (action) => {
        if (action.action === "open") opened.push(String(action.label))
        return true
      },
    })
    const done = await agent.act({ steps: [{ ref: "Rename", action: "press" }] })
    expect(done.ok).toBe(true)
    expect(pressed).toEqual(["Rename"])
    expect(opened).toEqual(["File", "Edit"])
    expect(root.querySelector("#file")!.getAttribute("aria-expanded")).toBe("false")
    expect((await agent.act({ steps: [{ ref: "Delete", action: "press" }] })).error).toContain(
      'Nothing is called "Delete"'
    )
  })

  it("says what a step opened, what came and what went, and keeps a ref through a redraw", async () => {
    const root = mount(`
      <button class="opener" aria-expanded="false" aria-controls="dlg">Settings</button>
      <span class="place"></span>`)
    const opener = root.querySelector(".opener")!
    const place = root.querySelector(".place")!
    opener.addEventListener("click", () => {
      const open = opener.getAttribute("aria-expanded") !== "true"
      opener.setAttribute("aria-expanded", String(open))
      place.innerHTML = open
        ? '<div id="dlg" role="dialog" aria-label="Settings panel"><input aria-label="Name" /></div>'
        : ""
    })
    const agent = createAgent({ root })
    const first = await agent.act({ steps: [{ ref: "Settings", action: "open" }] })
    expect(first.steps[0]!.opened).toEqual([
      { ref: expect.any(String), component: "dialog", label: "Settings panel" },
    ])
    expect(first.steps[0]!.appeared).toEqual([
      { ref: expect.any(String), component: "input", label: "Name" },
    ])
    const ref = first.steps[0]!.appeared![0]!.ref
    const closed = await agent.act({ steps: [{ ref: "Settings", action: "close" }] })
    expect(closed.steps[0]!.gone?.map((each) => each.label)).toEqual(["Settings panel", "Name"])
    // Drawn again on new elements: the input is asked for by the ref it had.
    await agent.act({ steps: [{ ref: "Settings", action: "open" }] })
    expect((await agent.act({ steps: [{ ref, action: "setValue", args: ["x"] }] })).ok).toBe(true)
    expect(root.querySelector<HTMLInputElement>("#dlg input")!.value).toBe("x")
  })

  it("stops at a signal, gives up on an answer that does not come, and checks what it is given", async () => {
    const root = mount(`
      <button role="switch" aria-checked="false" aria-label="Alerts"></button>
      <input type="number" aria-label="Seats" value="3" />`)
    const stopper = new AbortController()
    const slow = createAgent({ root, allow: () => new Promise<boolean>(() => {}), timeout: 60 })
    const late = await slow.act({ steps: [{ ref: "Alerts", action: "toggle" }] })
    expect(late.error).toContain("No answer")
    const waiting = createAgent({ root, allow: () => new Promise<boolean>(() => {}) })
    setTimeout(() => stopper.abort(), 30)
    const stopped = await waiting.act({
      steps: [{ ref: "Alerts", action: "toggle" }],
      signal: stopper.signal,
    })
    expect(stopped.error).toContain("Stopped")
    const agent = createAgent({ root })
    const wrong = await agent.act({
      steps: [{ ref: "Alerts", action: "setChecked", args: ["yes"] }],
    })
    expect(wrong.error).toContain("true or false")
    const text = await agent.act({ steps: [{ ref: "Seats", action: "setValue", args: ["many"] }] })
    expect(text.error).toContain("is not a number")
    expect(root.querySelector<HTMLInputElement>("input")!.value).toBe("3")
  })

  it("stops at a signal aborted before the wait for an answer begins", async () => {
    const root = mount(`
      <div data-agent-confirm="Resets every setting"><button>Reset settings</button></div>`)
    let pressed = 0
    root.querySelector("button")!.addEventListener("click", () => pressed++)
    const step = { ref: "Reset settings", action: "press" }
    // Stop pressed as the question opened, the page's own dialog still open.
    const asking = new AbortController()
    const asked = createAgent({
      root,
      confirm: () => {
        asking.abort()
        return new Promise<boolean>(() => {})
      },
    })
    const inConfirm = await asked.act({ steps: [step], signal: asking.signal })
    expect(inConfirm.error).toBe("Step 1 (Reset settings): Stopped")
    // A policy that stops the turn itself.
    const policy = new AbortController()
    const allowing = createAgent({
      root,
      allow: () => {
        policy.abort()
        return new Promise<boolean>(() => {})
      },
      confirm: () => true,
    })
    const inAllow = await allowing.act({ steps: [step], signal: policy.signal })
    expect(inAllow.error).toBe("Step 1 (Reset settings): Stopped")
    // An answer given at once after Stop is not taken either.
    const late = new AbortController()
    const answered = createAgent({
      root,
      confirm: () => {
        late.abort()
        return true
      },
    })
    const atOnce = await answered.act({ steps: [step], signal: late.signal })
    expect(atOnce.error).toBe("Step 1 (Reset settings): Stopped")
    expect(pressed).toBe(0)
  })

  it("caps a snapshot and says how many more there are", () => {
    const root = mount(
      Array.from({ length: 12 }, (_each, at) => `<button>B${at}</button>`).join("")
    )
    const list = createAgent({ root, limit: 5 }).snapshot()
    expect(list).toHaveLength(6)
    expect(list.at(-1)).toMatchObject({ ref: "more", component: "more", actions: [] })
    expect(list.at(-1)!.label).toContain("7 more")
  })

  it("reads a list of several choices, and sets them", async () => {
    const root = mount(`
      <div role="listbox" aria-label="Toppings" aria-multiselectable="true">
        <div role="option" aria-selected="true">Basil</div>
        <div role="option" aria-selected="false">Olives</div>
        <div role="option" aria-selected="false">Capers</div>
      </div>`)
    for (const each of root.querySelectorAll('[role="option"]')) {
      each.addEventListener("click", () =>
        each.setAttribute("aria-selected", String(each.getAttribute("aria-selected") !== "true"))
      )
    }
    const agent = createAgent({ root })
    expect(agent.snapshot()).toEqual([
      expect.objectContaining({ component: "listbox", label: "Toppings", values: ["Basil"] }),
    ])
    const done = await agent.act({
      steps: [{ ref: "Toppings", action: "setValue", args: [["Olives", "Capers"]] }],
    })
    expect(done.steps[0]!.now?.values).toEqual(["Olives", "Capers"])
    expect((await agent.undo()).steps[0]!.now?.values).toEqual(["Basil"])
    // A choice it does not have is said, beside one it has, and nothing is pressed.
    const none = await agent.act({
      steps: [{ ref: "Toppings", action: "setValue", args: [["Olives", "Anchovies"]] }],
    })
    expect(none.error).toBe('Step 1 (Toppings): It has no choice "Anchovies"')
    expect(agent.snapshot()[0]!.values).toEqual(["Basil"])
  })

  it("reads and uses a kind of component of your own", async () => {
    const root = mount(`
      <div class="rating" aria-label="Stars" data-value="2">
        <button>1</button><button>2</button><button>3</button>
      </div>`)
    const rating = root.querySelector<HTMLElement>(".rating")!
    for (const each of rating.querySelectorAll("button"))
      each.addEventListener("click", () => (rating.dataset.value = each.textContent))
    const kind: AgentKind = {
      component: "rating",
      selector: ".rating",
      read: (element) => ({
        value: Number((element as HTMLElement).dataset.value),
        min: 1,
        max: 3,
        actions: ["setValue"],
      }),
      perform(element, _action, [value]) {
        const star = [...element.querySelectorAll("button")].find(
          (each) => each.textContent === String(value)
        )
        if (!star) return `It has no ${String(value)}`
        star.click()
      },
    }
    const agent = createAgent({ root, kinds: [kind] })
    // Its own buttons are its own: one component, not four.
    expect(agent.snapshot()).toEqual([
      expect.objectContaining({ component: "rating", label: "Stars", value: 2 }),
    ])
    const done = await agent.act({ steps: [{ ref: "Stars", action: "setValue", args: [3] }] })
    expect(done.steps[0]!.now?.value).toBe(3)
    expect(
      (await agent.act({ steps: [{ ref: "Stars", action: "setValue", args: [9] }] })).error
    ).toContain("It has no 9")
    expect((await agent.undo()).steps[0]!.now?.value).toBe(2)
  })
})

/** A select of several values drawn in plain DOM, as the select's own tests draw one. */
function toppings() {
  const root = mount(`
    <button class="trigger" aria-label="Toppings"><span class="shown"></span></button>
    <div class="positioner"><div class="popup">
      <div class="option" data-v="Basil">Basil</div>
      <div class="option" data-v="Olives">Olives</div>
      <div class="option" data-v="Capers">Capers</div>
    </div></div>
    <button>Order</button>`)
  const find = (name: string) => root.querySelector<HTMLElement>(name)!
  const heard = recorder<string[]>()
  const made = createSelect(
    signal<SelectProps<string>>({
      id: "tp",
      multiple: true,
      defaultValues: ["Basil"],
      onValuesChange: heard.listen,
    })
  )
  const shown = find(".shown")
  onTestFinished(made.mount())
  onTestFinished(bind(find(".trigger"), made.trigger))
  onTestFinished(bind(shown, made.valuePart))
  onTestFinished(effect(() => void (shown.textContent = made.label.get() ?? "")))
  for (const each of root.querySelectorAll<HTMLElement>(".option"))
    onTestFinished(bind(each, made.item(each.dataset.v!)))
  onTestFinished(bind(find(".positioner"), made.positioner))
  onTestFinished(bind(find(".popup"), made.popup))
  return { root, made, heard }
}

/** A tree of files: Documents holds Work (which holds Report) and Letter; Notes is a leaf. */
function files(given: Partial<TreeProps<string>> = {}) {
  const root = mount(`
    <ul class="tree" aria-label="Files">
      <li data-v="docs"><span data-text>Documents</span>
        <ul data-group>
          <li data-v="work"><span data-text>Work</span>
            <ul data-group><li data-v="report"><span data-text>Report</span></li></ul>
          </li>
          <li data-v="letter"><span data-text>Letter</span></li>
        </ul>
      </li>
      <li data-v="notes"><span data-text>Notes</span></li>
    </ul>
    <button>Upload</button>`)
  const expanded = recorder<string[]>()
  const selected = recorder<string[]>()
  const made = createTree(
    signal<TreeProps<string>>({
      id: "files",
      onExpandedChange: expanded.listen,
      onSelectedChange: selected.listen,
      ...given,
    })
  )
  const branches = new Set(["docs", "work"])
  onTestFinished(bind(root.querySelector<HTMLElement>(".tree")!, made.root))
  for (const node of root.querySelectorAll<HTMLElement>("[data-v]")) {
    const value = node.dataset.v!
    const item = made.item(value, () => ({ branch: branches.has(value) }))
    onTestFinished(bind(node, item.root))
    onTestFinished(bind(node.querySelector<HTMLElement>(":scope > [data-text]")!, item.text))
    const group = node.querySelector<HTMLElement>(":scope > [data-group]")
    if (group) onTestFinished(bind(group, item.group))
    onTestFinished(item.mount())
  }
  onTestFinished(made.mount())
  return { root, made, expanded, selected }
}

/** A date or a time field drawn in plain DOM: a span for each piece, its text as it changes. */
function pieces(made: DateField | TimeField, label: string) {
  const root = mount(
    `<div class="group" aria-label="${label}"></div><input class="hidden" /><button>Save</button>`
  )
  const group = root.querySelector<HTMLElement>(".group")!
  onTestFinished(bind(group, made.root))
  onTestFinished(bind(root.querySelector<HTMLElement>(".hidden")!, made.input))
  onTestFinished(made.mount())
  for (const segment of made.segments.peek()) {
    const span = document.createElement("span")
    group.append(span)
    const { part, text } = (
      made.segment as (each: typeof segment) => ReturnType<DateField["segment"]>
    )(segment)
    onTestFinished(bind(span, part))
    onTestFinished(effect(() => void (span.textContent = text.get())))
  }
  return root
}

describe("the agent bridge, on more kinds", () => {
  it("reads a select of several values once its list is read, and sets them", async () => {
    const { root, made, heard } = toppings()
    const agent = createAgent({ root })
    // Closed and never opened, its list is not in the page: what it holds is not known yet.
    const first = agent.snapshot().find((each) => each.label === "Toppings")!
    expect(first).toMatchObject({ component: "select", value: "Basil", open: false })
    expect(first.values).toBeUndefined()
    const done = await agent.act({
      steps: [{ ref: "Toppings", action: "setValue", args: [["Olives", "Capers"]] }],
    })
    expect(done.error).toBe(undefined)
    expect(made.values.peek()).toEqual(["Olives", "Capers"])
    // Opened to be set, and closed again.
    expect(made.open.peek()).toBe(false)
    expect(done.steps[0]!.now).toMatchObject({ values: ["Olives", "Capers"], open: false })
    expect(heard.calls.map((each) => each.source)).toEqual(["agent", "agent", "agent"])
    // What it held as the step opened it is what is put back.
    expect(agent.history()[0]!.before.values).toEqual(["Basil"])
    expect((await agent.undo()).ok).toBe(true)
    expect(made.values.peek()).toEqual(["Basil"])
    expect(made.open.peek()).toBe(false)
    // Read by opening it, for an agent that never set it.
    const other = createAgent({ root })
    const [read] = await other.query({ within: "Toppings" })
    expect(read).toMatchObject({ values: ["Basil"], open: false })
    expect(read!.items!.map((each) => each.value)).toEqual(["Basil", "Olives", "Capers"])
    expect(other.snapshot().find((each) => each.label === "Toppings")!.values).toEqual(["Basil"])
    const none = await other.act({
      steps: [{ ref: "Toppings", action: "setValue", args: [["Basil", "Mars"]] }],
    })
    expect(none.error).toBe('Step 1 (Toppings): It has no choice "Mars"')
    expect(made.open.peek()).toBe(false)
    expect(made.values.peek()).toEqual(["Basil"])
  })

  it("reads and sets a select of several values in plain markup, its list kept in the page", async () => {
    const root = mount(`
      <button role="combobox" aria-label="Days" aria-expanded="false" aria-controls="days">Mon</button>
      <div id="days" role="listbox" aria-multiselectable="true" hidden>
        <div role="option" aria-selected="true">Mon</div>
        <div role="option" aria-selected="false">Tue</div>
        <div role="option" aria-selected="false">Wed</div>
      </div>`)
    const trigger = root.querySelector<HTMLElement>('[role="combobox"]')!
    const list = root.querySelector<HTMLElement>("#days")!
    trigger.addEventListener("click", () => {
      list.hidden = !list.hidden
      trigger.setAttribute("aria-expanded", String(!list.hidden))
    })
    for (const each of list.querySelectorAll('[role="option"]')) {
      each.addEventListener("click", () => {
        each.setAttribute("aria-selected", String(each.getAttribute("aria-selected") !== "true"))
        trigger.textContent = [...list.querySelectorAll('[aria-selected="true"]')]
          .map((option) => option.textContent)
          .join(", ")
      })
    }
    const agent = createAgent({ root })
    expect(agent.snapshot()).toEqual([
      expect.objectContaining({ component: "select", label: "Days", values: ["Mon"] }),
    ])
    const done = await agent.act({
      steps: [{ ref: "Days", action: "setValue", args: [["Tue", "Wed"]] }],
    })
    expect(done.steps[0]!.now).toMatchObject({ value: "Tue, Wed", values: ["Tue", "Wed"] })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect((await agent.undo()).steps[0]!.now?.values).toEqual(["Mon"])
  })

  it("keeps a select of one value as it was, and says it holds one", async () => {
    const { agent, picked } = page()
    const many = await agent.act({
      steps: [{ ref: "Region", action: "setValue", args: [["Asia", "Europe"]] }],
    })
    expect(many.error).toBe("Step 1 (Region): It holds one choice")
    const one = await agent.act({
      steps: [{ ref: "Region", action: "setValue", args: [["Europe"]] }],
    })
    expect(one.ok).toBe(true)
    expect(picked.calls.at(-1)).toMatchObject({ value: "Europe", source: "agent" })
    expect(agent.snapshot().find((each) => each.label === "Region")!.values).toBeUndefined()
  })

  it("tells the thumbs of a range apart, and asks which when named by the range", async () => {
    const root = mount(`
      <div class="slider" aria-label="Price">
        <div class="control">
          <div class="thumb"><input /></div><div class="thumb"><input /></div>
        </div>
      </div>
      <div role="group" aria-label="Hours">
        <div role="slider" aria-label="From" aria-valuenow="9" aria-valuemin="0" aria-valuemax="24"></div>
        <div role="slider" aria-label="To" aria-valuenow="17" aria-valuemin="0" aria-valuemax="24"></div>
      </div>`)
    const turned = recorder<number | number[]>()
    const slider = createSlider(
      signal({ id: "pr", defaultValue: [20, 80], onValueChange: turned.listen })
    )
    onTestFinished(bind(root.querySelector<HTMLElement>(".slider")!, slider.root))
    onTestFinished(bind(root.querySelector<HTMLElement>(".control")!, slider.control))
    const thumbs = root.querySelectorAll<HTMLElement>(".thumb")
    for (const [at, thumb] of [...thumbs].entries()) {
      onTestFinished(bind(thumb, slider.thumb(at)))
      onTestFinished(bind(thumb.querySelector("input")!, slider.thumbInput(at)))
    }
    const agent = createAgent({ root })
    expect(agent.snapshot().map((each) => `${each.label} ${each.value}`)).toEqual([
      "Price, 1 of 2 20",
      "Price, 2 of 2 80",
      // A thumb the page named itself keeps its name.
      "From 9",
      "To 17",
    ])
    const both = await agent.act({ steps: [{ ref: "Price", action: "setValue", args: [50] }] })
    expect(both.error).toMatch(/"Price" names 2 components: .*"Price, 1 of 2".*"Price, 2 of 2"/)
    const done = await agent.act({
      steps: [{ ref: "Price, 2 of 2", action: "setValue", args: [60] }],
    })
    expect(done.ok).toBe(true)
    expect(slider.values.peek()).toEqual([20, 60])
    expect(turned.calls.at(-1)).toMatchObject({ value: [20, 60], source: "agent" })
    expect((await agent.undo()).ok).toBe(true)
    expect(slider.values.peek()).toEqual([20, 80])
  })

  it("types a date part by part, and says a value a part does not take", async () => {
    const heard = recorder<string | null>()
    const made = createDateField(signal({ id: "df", locale: "en-US", onValueChange: heard.listen }))
    const root = pieces(made, "Start")
    const agent = createAgent({ root })
    expect(agent.snapshot().filter((each) => each.component === "spinbutton")).toEqual([
      expect.objectContaining({ label: "month", min: 1, max: 12, actions: ["setValue"] }),
      expect.objectContaining({ label: "day", min: 1, max: 31 }),
      expect.objectContaining({ label: "year", min: 1, max: 9999 }),
    ])
    // Empty, a part says nothing: its placeholder is not a value.
    expect(agent.snapshot()[0]!.value).toBeUndefined()
    const done = await agent.act({
      steps: [
        { ref: "month", action: "setValue", args: [3] },
        { ref: "day", action: "setValue", args: ["14"] },
        { ref: "year", action: "setValue", args: [2025] },
      ],
    })
    expect(done.error).toBe(undefined)
    expect(done.steps.map((each) => each.now?.value)).toEqual([3, 14, 2025])
    expect(made.value.peek()).toBe("2025-03-14")
    expect(heard.calls).toEqual([{ value: "2025-03-14", reason: "typed", source: "agent" }])
    // Beyond what the part takes: said with what it holds, and nothing typed.
    const far = await agent.act({ steps: [{ ref: "day", action: "setValue", args: [40] }] })
    expect(far.error).toBe("Step 1 (day): It holds 14, not 40")
    expect(made.value.peek()).toBe("2025-03-14")
    await agent.act({ steps: [{ ref: "month", action: "setValue", args: [11] }] })
    expect(made.value.peek()).toBe("2025-11-14")
    expect((await agent.undo()).ok).toBe(true)
    expect(made.value.peek()).toBe("2025-03-14")
  })

  it("types a time, its day period by its word, and a native spin button through its input", async () => {
    const heard = recorder<string | null>()
    const made = createTimeField(
      signal({ id: "tf", locale: "en-US", hourCycle: 12 as const, onValueChange: heard.listen })
    )
    const root = pieces(made, "Alarm")
    root.insertAdjacentHTML(
      "beforeend",
      '<input type="number" role="spinbutton" aria-label="Guests" min="1" max="8" value="2" />'
    )
    const guests = root.querySelector<HTMLInputElement>('[aria-label="Guests"]')!
    const typed: string[] = []
    guests.addEventListener("input", () => typed.push(guests.value))
    const agent = createAgent({ root })
    // Named as the locale names each part: asked for here by their refs.
    const parts = agent.snapshot().filter((each) => each.component === "spinbutton")
    expect(parts.map((each) => [each.min, each.max])).toEqual([
      [1, 12],
      [0, 59],
      [0, 1],
      [1, 8],
    ])
    const [hour, minute, period] = parts.map((each) => each.ref)
    const done = await agent.act({
      steps: [
        { ref: hour!, action: "setValue", args: [9] },
        { ref: minute!, action: "setValue", args: [30] },
        { ref: period!, action: "setValue", args: ["PM"] },
      ],
    })
    expect(done.error).toBe(undefined)
    expect(made.value.peek()).toBe("21:30")
    expect(heard.calls.every((each) => each.source === "agent")).toBe(true)
    // Asked for by its number, which typing does not take: its arrow keys then.
    await agent.act({ steps: [{ ref: period!, action: "setValue", args: [0] }] })
    expect(made.value.peek()).toBe("09:30")
    expect(agent.snapshot().find((each) => each.label === "Guests")).toMatchObject({
      component: "spinbutton",
      value: 2,
      min: 1,
      max: 8,
    })
    expect(
      (await agent.act({ steps: [{ ref: "Guests", action: "setValue", args: [5] }] })).ok
    ).toBe(true)
    expect(guests.value).toBe("5")
    expect(typed).toEqual(["5"])
    const many = await agent.act({ steps: [{ ref: "Guests", action: "setValue", args: [9] }] })
    expect(many.error).toBe("Step 1 (Guests): It holds 5, not 9")
  })

  it("reads a tree as one component, and chooses, opens and closes its nodes", async () => {
    const { root, made, expanded, selected } = files({ defaultExpandedValue: ["docs"] })
    await new Promise((resolve) => setTimeout(resolve, 0))
    const agent = createAgent({ root })
    // Its nodes are its own, not components of their own.
    expect(agent.snapshot().map(({ ref: _ref, ...rest }) => rest)).toEqual([
      {
        component: "tree",
        label: "Files",
        items: [
          { value: "Documents", label: "Documents", open: true },
          { value: "Work", label: "Work", level: 2, open: false },
          { value: "Letter", label: "Letter", level: 2 },
          { value: "Notes", label: "Notes" },
        ],
        actions: ["setValue", "open", "close"],
      },
      { component: "button", label: "Upload", actions: ["press"] },
    ])
    const hidden = await agent.act({
      steps: [{ ref: "Files", action: "setValue", args: ["Report"] }],
    })
    expect(hidden.error).toBe('Step 1 (Files): "Report" is in a closed branch: open it first')
    const done = await agent.act({
      steps: [
        { ref: "Files", action: "open", args: ["Work"] },
        { ref: "Files", action: "setValue", args: ["Report"] },
        // Named by a node alone: that node is chosen.
        { ref: "Letter", action: "press" },
      ],
    })
    expect(done.error).toBe(undefined)
    expect(made.expandedValue.peek()).toEqual(["docs", "work"])
    expect(made.selectedValue.peek()).toEqual(["letter"])
    expect(done.steps[2]!.now?.value).toBe("Letter")
    expect(done.steps[2]!.now?.items).toContainEqual({ value: "Report", label: "Report", level: 3 })
    expect([...expanded.calls, ...selected.calls].every((each) => each.source === "agent")).toBe(
      true
    )
    expect(agent.history().map((each) => each.text)).toEqual([
      "The agent opened Work in Files",
      'The agent set Files to "Report"',
      'The agent set Files to "Letter"',
    ])
    // Choosing a branch does not open or close it.
    await agent.act({ steps: [{ ref: "Files", action: "setValue", args: ["Documents"] }] })
    expect(made.expandedValue.peek()).toEqual(["docs", "work"])
    await agent.undo()
    await agent.undo()
    expect(made.selectedValue.peek()).toEqual(["report"])
    // Nothing was chosen before: that is not a value to put back.
    expect((await agent.undo()).ok).toBe(false)
    // A branch closed is opened again by its undo.
    await agent.act({ steps: [{ ref: "Files", action: "close", args: ["Documents"] }] })
    expect(made.expandedValue.peek()).toEqual(["work"])
    expect((await agent.undo()).ok).toBe(true)
    expect([...made.expandedValue.peek()].sort()).toEqual(["docs", "work"])
    expect((await agent.act({ steps: [{ ref: "Files", action: "close" }] })).error).toContain(
      "close takes the name of a node"
    )
    expect(
      (await agent.act({ steps: [{ ref: "Files", action: "open", args: ["Notes"] }] })).error
    ).toContain('"Notes" is not a branch')
  })

  it("chooses several nodes of a tree", async () => {
    const { root, made } = files({ selectionMode: "multiple", defaultExpandedValue: ["docs"] })
    await new Promise((resolve) => setTimeout(resolve, 0))
    const agent = createAgent({ root })
    expect(agent.snapshot()[0]).toMatchObject({ component: "tree", values: [] })
    const done = await agent.act({
      steps: [{ ref: "Files", action: "setValue", args: [["Notes", "Letter"]] }],
    })
    expect(done.steps[0]!.now?.values).toEqual(["Letter", "Notes"])
    expect(made.selectedValue.peek()).toEqual(["letter", "notes"])
    await agent.act({ steps: [{ ref: "Files", action: "setValue", args: [["Documents"]] }] })
    expect(made.selectedValue.peek()).toEqual(["docs"])
    expect((await agent.undo()).steps[0]!.now?.values).toEqual(["Letter", "Notes"])
  })

  it("reads a password's toggle as a button its name tells the state of", async () => {
    const root = mount(
      `<div class="root"><input class="input" value="hunter2" /><button class="toggle"></button></div>`
    )
    const made = createPasswordInput(signal({}))
    onTestFinished(bind(root.querySelector<HTMLElement>(".root")!, made.root))
    onTestFinished(bind(root.querySelector<HTMLElement>(".input")!, made.input))
    onTestFinished(bind(root.querySelector<HTMLElement>(".toggle")!, made.toggle))
    const agent = createAgent({ root })
    const toggle = () => agent.snapshot().find((each) => each.component === "button")
    expect(toggle()).toMatchObject({ label: "Show password", actions: ["press"] })
    expect(toggle()!.checked).toBeUndefined()
    const done = await agent.act({ steps: [{ ref: "Show password", action: "press" }] })
    expect(done.ok).toBe(true)
    expect(made.visible.peek()).toBe(true)
    expect(toggle()).toMatchObject({ label: "Hide password", actions: ["press"] })
  })

  it("hides what a secret mark holds of the new kinds", () => {
    const root = mount(`
      <div data-agent-secret>
        <button role="combobox" aria-label="Clients" aria-expanded="false" aria-controls="clients">Acme</button>
        <div id="clients" role="listbox" aria-multiselectable="true" hidden>
          <div role="option" aria-selected="true">Acme</div>
        </div>
        <div role="spinbutton" aria-label="Salary" aria-valuenow="90" aria-valuemin="0" aria-valuemax="999"></div>
        <div role="tree" aria-label="Accounts" aria-multiselectable="true">
          <div role="treeitem" aria-selected="true">Acme</div>
        </div>
      </div>`)
    const read = Object.fromEntries(
      createAgent({ root })
        .snapshot()
        .map((each) => [each.label, each])
    )
    expect(read["Clients"]!.values).toBeUndefined()
    expect(read["Salary"]!.value).toBe("[redacted]")
    expect(read["Accounts"]!.values).toBeUndefined()
    expect(read["Accounts"]!.items).toBeUndefined()
    expect(JSON.stringify(read)).not.toContain("Acme")
    expect(JSON.stringify(read)).not.toContain("90")
  })
})

function textOfItem(target: EventTarget | null): string {
  return (target as Element | null)?.textContent ?? ""
}

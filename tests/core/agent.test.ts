import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { agentTools, createAgent, registerTools } from "../../packages/core/src/agent.ts"
import { bind } from "../../packages/core/src/bind.ts"
import { createCollapsible } from "../../packages/core/src/collapsible.ts"
import { createInput } from "../../packages/core/src/input.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createSelect } from "../../packages/core/src/select.ts"
import type { SelectProps } from "../../packages/core/src/select.ts"
import { createSlider } from "../../packages/core/src/slider.ts"
import { createSwitch } from "../../packages/core/src/switch.ts"
import { recorder } from "../../packages/core/src/testing.ts"
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

  it("needs a person where the page says so, and asks `allow` when there is one", async () => {
    const { agent, root, pressed } = page()
    const alone = await agent.act({ steps: [{ ref: "Delete", action: "press" }] })
    expect(alone.error).toBe("Step 1 (Delete): Needs a person: Deletes the project")
    expect(pressed).toEqual([])
    const asked: string[] = []
    const guarded = createAgent({
      root,
      allow(action) {
        asked.push(`${action.component} ${action.label} ${action.action} ${action.confirm}`)
        return action.label === "Delete"
      },
    })
    expect((await guarded.act({ steps: [{ ref: "Delete", action: "press" }] })).ok).toBe(true)
    expect(pressed).toEqual(["delete"])
    const refused = await guarded.act({ steps: [{ ref: "Details", action: "open" }] })
    expect(refused.error).toBe("Step 1 (Details): Refused")
    expect(asked).toEqual([
      "button Delete press Deletes the project",
      "disclosure Details open undefined",
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
    const guarded = createAgent({ root, allow: () => true })
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

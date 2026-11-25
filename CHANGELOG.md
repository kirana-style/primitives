# Changelog

## [0.4.0](https://github.com/kirana-style/primitives/compare/v0.3.0...v0.4.0) (2026-11-25)


### ⚠ BREAKING CHANGES

* **solid:** the solid adapter on solid 2 ([#70](https://github.com/kirana-style/primitives/issues/70))
* a button drawn as a link stays a link: no button role, no keys ([#68](https://github.com/kirana-style/primitives/issues/68))
* an element keeps its own attributes and text where a part has none ([#63](https://github.com/kirana-style/primitives/issues/63))
* calendar copies drawn as chosen, and required to keep a day ([#62](https://github.com/kirana-style/primitives/issues/62))

### Features

* a primitive's element on svelte, optional item values, and hostInputs' rules ([#60](https://github.com/kirana-style/primitives/issues/60)) ([df5286e](https://github.com/kirana-style/primitives/commit/df5286e37b9ae40d9cbee3c0163539e9a23a3e72))
* base ui's prop names and the states it writes, on one ci build ([#78](https://github.com/kirana-style/primitives/issues/78)) ([a6c6020](https://github.com/kirana-style/primitives/commit/a6c6020ffa4a2dc2be505e6d69227354d25f534e))
* calendar copies drawn as chosen, and required to keep a day ([#62](https://github.com/kirana-style/primitives/issues/62)) ([da040c8](https://github.com/kirana-style/primitives/commit/da040c8562d4cd3ee9e05625941a2413e7d26b0f))
* **solid:** the solid adapter on solid 2 ([#70](https://github.com/kirana-style/primitives/issues/70)) ([fa80536](https://github.com/kirana-style/primitives/commit/fa80536e2fac79b7f3c49e7a3da1909fc9a8521c))
* ten components, and the agent bridge reads the kinds it lacked ([#74](https://github.com/kirana-style/primitives/issues/74)) ([7c9553c](https://github.com/kirana-style/primitives/commit/7c9553ccb8e2c4d1e765c9cdefb24ef152dd4722))
* the agent bridge says who changed what, and takes back by source ([#73](https://github.com/kirana-style/primitives/issues/73)) ([29533a8](https://github.com/kirana-style/primitives/commit/29533a887691449bdb059d8a99ee2c0a6c29a636))
* the gaps in the date, combobox, field and popup components ([#77](https://github.com/kirana-style/primitives/issues/77)) ([417014e](https://github.com/kirana-style/primitives/commit/417014efd0c30ba8cbaa91a5b2aa8d7f4eace16b))


### Bug fixes

* a button drawn as a link stays a link: no button role, no keys ([#68](https://github.com/kirana-style/primitives/issues/68)) ([3341659](https://github.com/kirana-style/primitives/commit/3341659199f30d09f80db749999f01bedcb12d3b))
* a calendar keeps its days, and focus, when its caller holds the value ([#58](https://github.com/kirana-style/primitives/issues/58)) ([50354ce](https://github.com/kirana-style/primitives/commit/50354cef64ea1b3e743cd2dd4d867f9a15e8a116))
* a hover popup unmounted while open no longer skips the next one's wait ([#59](https://github.com/kirana-style/primitives/issues/59)) ([b3eb8e5](https://github.com/kirana-style/primitives/commit/b3eb8e5fe407f683813afac6fabd44b2b3641b97))
* a part writes type="button" only on a button, and a caller's type wins ([#61](https://github.com/kirana-style/primitives/issues/61)) ([8598a75](https://github.com/kirana-style/primitives/commit/8598a75bab4bf3d97079ac3f0dd49d7e77014d96))
* a popup closes in a document with no web animations, as in jsdom ([#66](https://github.com/kirana-style/primitives/issues/66)) ([ca4e888](https://github.com/kirana-style/primitives/commit/ca4e8889dc579d75632f5a55c94b13fff2c21562))
* a select's list opened over its trigger holds the page's scroll ([#67](https://github.com/kirana-style/primitives/issues/67)) ([4277f61](https://github.com/kirana-style/primitives/commit/4277f61c0d50fe4f3f8d8f7a447e5410c3d53af4))
* an element keeps its own attributes and text where a part has none ([#63](https://github.com/kirana-style/primitives/issues/63)) ([73367e0](https://github.com/kirana-style/primitives/commit/73367e0bfe564ea02561281e88974cd07d5dbc51))
* the agent bridge and the names it reads, as a consumer found them ([#72](https://github.com/kirana-style/primitives/issues/72)) ([8dc7537](https://github.com/kirana-style/primitives/commit/8dc7537cefdf77628fea4ce50e63994d7756b8e2))
* the check after a release waits for each package's file ([#69](https://github.com/kirana-style/primitives/issues/69)) ([d274248](https://github.com/kirana-style/primitives/commit/d274248c7f09471ebd83a878434777953a90ccd3))


### Documentation

* the changelog in every package, and what the reference left out ([#57](https://github.com/kirana-style/primitives/issues/57)) ([c00cf0b](https://github.com/kirana-style/primitives/commit/c00cf0b22bb818dc11503e1d801d6cdd620c85e9))


### Dependencies

* bump the minor-and-patch group with 15 updates ([#76](https://github.com/kirana-style/primitives/issues/76)) ([77913b0](https://github.com/kirana-style/primitives/commit/77913b0aee5f2f477fd49917f061e0babd2f2b3b))

## [0.3.0](https://github.com/kirana-style/primitives/compare/v0.2.0...v0.3.0) (2026-11-20)


### ⚠ BREAKING CHANGES

* calendar modes, a design system's composition, and fixes from the port ([#56](https://github.com/kirana-style/primitives/pull/56))
* calendar modes, a design system's composition, and fixes from the port ([#55](https://github.com/kirana-style/primitives/pull/55))
* **angular:** the prefix is `kp`, so that a design system's own `kui…` names never meet the primitives': selectors and inputs `kui…` are `kp…` (`[kpDialog]`, `kpId`, `exportAs: "kpDialog"`), classes `Kui…` are `Kp…` (`KpDialog`), and tokens `KUI_…` are `KP_…` (`KP_FIELD`, `KP_DIRECTION`).
* **angular:** a calendar's `monthChanged` emits `{ month, details }` instead of the month alone: read `event.month`.
* an `id` given to `RadioGroup.Item` (`kpId` on Angular) goes on the item's native radio, where a `<label for>` finds it, instead of on the item's element.
* a command highlights the first item shown from the start, and again as the text changes: set `autoHighlight` to `false` for no highlight until a key or the pointer moves it.
* a placed popup leaves with its anchor once the anchor is scrolled out of view, instead of staying in view: set `sticky` on the `Positioner` to keep it there.

### Features

* calendar modes, a design system's composition, and fixes from the port ([#55](https://github.com/kirana-style/primitives/pull/55)) ([e2afd38](https://github.com/kirana-style/primitives/commit/e2afd38d6d024499cc28bdf4fe8a6aee4ae1dbd7))
* calendar modes, a design system's composition, and fixes from the port ([#56](https://github.com/kirana-style/primitives/pull/56)) ([bb560d7](https://github.com/kirana-style/primitives/commit/bb560d7dc182a82211f9e8fbb6754f3577c04d61))
* the parts and props base ui has and the primitives lacked ([#53](https://github.com/kirana-style/primitives/pull/53)) ([3d90131](https://github.com/kirana-style/primitives/commit/3d901312b5cd81555e7c278e5424e4dfc83b90cc))


### Dependencies

* bump the minor-and-patch group with 9 updates ([#51](https://github.com/kirana-style/primitives/pull/51)) ([43e1727](https://github.com/kirana-style/primitives/commit/43e17270b52f80479ef5fa869ef8a02813d04f19))

## [0.2.0](https://github.com/kirana-style/primitives/compare/v0.1.1...v0.2.0) (2026-11-18)


### ⚠ BREAKING CHANGES

* typed parts, composition, positioning and a complete llms.txt ([#49](https://github.com/kirana-style/primitives/pull/49))

### Features

* typed parts, composition, positioning and a complete llms.txt ([#49](https://github.com/kirana-style/primitives/pull/49)) ([25665bd](https://github.com/kirana-style/primitives/commit/25665bd197f0269386f15dc1231a0630475f5200))

## [0.1.1](https://github.com/kirana-style/primitives/compare/v0.1.0...v0.1.1) (2026-11-16)


### Features

* a select over its trigger, thumbs that stay inside, a toast's content part ([#40](https://github.com/kirana-style/primitives/pull/40)) ([885298b](https://github.com/kirana-style/primitives/commit/885298bff7a6ad46ffe66bb91d7b728a4d37ad53))
* a testing kit, a skill for agents, and a status for empty lists ([#44](https://github.com/kirana-style/primitives/pull/44)) ([87f2161](https://github.com/kirana-style/primitives/commit/87f216124b6ecad021264f6d765c61055be7fa8f))
* a typed date field, and what made each change ([#38](https://github.com/kirana-style/primitives/pull/38)) ([c9da2b2](https://github.com/kirana-style/primitives/commit/c9da2b2f6071650d3a82f2d3a2052911012cf9de))
* add 43 of the 48 components as custom elements, each compared with react ([#47](https://github.com/kirana-style/primitives/pull/47)) ([60b24e9](https://github.com/kirana-style/primitives/commit/60b24e998a0b40440a75701d0dfa2d9b8c48a758))
* an agent bridge, a portal container, snap lengths, and the first custom elements ([#45](https://github.com/kirana-style/primitives/pull/45)) ([9c31835](https://github.com/kirana-style/primitives/commit/9c3183524db9b5507e2709367545f1be0060ca25))
* an authoring api, llms.txt, groups in the combobox, text a server draws ([#43](https://github.com/kirana-style/primitives/pull/43)) ([d5aa530](https://github.com/kirana-style/primitives/commit/d5aa530aae5cd424c092613886b466e5be00f6d2))
* calendar on five adapters ([#37](https://github.com/kirana-style/primitives/pull/37)) ([ce061ba](https://github.com/kirana-style/primitives/commit/ce061ba3378667c14eb144e7efeb4f7a496540e1))
* combobox and listbox on five adapters, and the menu's open rows ([#27](https://github.com/kirana-style/primitives/pull/27)) ([4dbf850](https://github.com/kirana-style/primitives/commit/4dbf850a36cba5a46acf41ad90c59891d428ee98))
* context menu and menubar on five adapters ([#26](https://github.com/kirana-style/primitives/pull/26)) ([cb600d0](https://github.com/kirana-style/primitives/commit/cb600d01981b91e139251f777884da5b1eff51c0))
* custom elements that draw the same page, released; undo for the agent bridge ([#46](https://github.com/kirana-style/primitives/pull/46)) ([e91b73e](https://github.com/kirana-style/primitives/commit/e91b73ebe0535e0eee66cf872bfcf02e1d2f70f7))
* drawer and message scroller on five adapters ([#35](https://github.com/kirana-style/primitives/pull/35)) ([2d7915a](https://github.com/kirana-style/primitives/commit/2d7915ac436e321def8395c396cfd15aba4adbef))
* every component as a custom element, with lists drawn from a template ([#48](https://github.com/kirana-style/primitives/pull/48)) ([4cdd653](https://github.com/kirana-style/primitives/commit/4cdd653452cb648ee8706df0f0a6c5c0d033f6dc))
* form controls follow their form's reset, fieldset and form attribute ([#21](https://github.com/kirana-style/primitives/pull/21)) ([0b67501](https://github.com/kirana-style/primitives/commit/0b67501677c404f9dde69d8decc76e3126ff24de))
* input, label and command; a trigger's own delays; toaster.promise ([#39](https://github.com/kirana-style/primitives/pull/39)) ([abd5bfb](https://github.com/kirana-style/primitives/commit/abd5bfbaa47b2fb58bcaa9dcbef40d3edb12e41b))
* list navigation as a service, and the menu on five adapters ([#25](https://github.com/kirana-style/primitives/pull/25)) ([260c06b](https://github.com/kirana-style/primitives/commit/260c06b8e3cf74cf96eabe47bca24d8d5b586c48))
* navigation menu on five adapters ([#30](https://github.com/kirana-style/primitives/pull/30)) ([715844b](https://github.com/kirana-style/primitives/commit/715844bf36dac933ac5ad80e3449208e96db2284))
* number field, autocomplete, the select's scroll arrows, the drawer's nested names ([#41](https://github.com/kirana-style/primitives/pull/41)) ([71645d3](https://github.com/kirana-style/primitives/commit/71645d3bd89cf74b3b97e174d67576824ae2d7c6))
* one popup layer under dialog, popover, tooltip, hover card and select ([#24](https://github.com/kirana-style/primitives/pull/24)) ([2808998](https://github.com/kirana-style/primitives/commit/2808998de1589b6f534339c5f8b3b98f956861b5))
* one-time code input and resizable panels on five adapters ([#33](https://github.com/kirana-style/primitives/pull/33)) ([4c08657](https://github.com/kirana-style/primitives/commit/4c08657f853f523b9e95e781bb1a04ffc0069ac7))
* pagination, date picker, and groups in the select ([#42](https://github.com/kirana-style/primitives/pull/42)) ([d6a3e21](https://github.com/kirana-style/primitives/commit/d6a3e21768f0950353134856433704fa04918fbe))
* several values in a combobox, and a list that carries only what it uses ([#32](https://github.com/kirana-style/primitives/pull/32)) ([06c4a93](https://github.com/kirana-style/primitives/commit/06c4a9348c6e322331de7fc58b56ec3792e6ccab))
* snap points for the drawer ([#36](https://github.com/kirana-style/primitives/pull/36)) ([2e8e3a8](https://github.com/kirana-style/primitives/commit/2e8e3a82b2a480a5158c63f19a00e9b3fbb0cee2))
* toast, carousel, qr code and a text area that sizes itself ([#34](https://github.com/kirana-style/primitives/pull/34)) ([569f2c1](https://github.com/kirana-style/primitives/commit/569f2c1ae789228dd8756d7c6a63b918205fc2cf))
* toggle group, toolbar and scroll area on five adapters ([#29](https://github.com/kirana-style/primitives/pull/29)) ([79ca74d](https://github.com/kirana-style/primitives/commit/79ca74d66320d1960a78fd07d7285f8858cea773))
* virtualized lists, a command palette, and the combobox's and listbox's open rows ([#31](https://github.com/kirana-style/primitives/pull/31)) ([61c5a9a](https://github.com/kirana-style/primitives/commit/61c5a9af2b27c1957ee6ffb1627c26411bc4df48))


### Bug fixes

* react in strict mode, layers closing in any order, a row's hidden text ([#23](https://github.com/kirana-style/primitives/pull/23)) ([2d64afc](https://github.com/kirana-style/primitives/commit/2d64afc7005b863451fcf5f127595267a5f67fd7))

## 0.1.0 (2026-11-12)


### Features

* angular renders on a server and hydrates ([#12](https://github.com/kirana-style/primitives/pull/12)) ([3c02baa](https://github.com/kirana-style/primitives/commit/3c02baa76ad1095946e4510019211c4246ffd47f))
* button, toggle, separator, progress, meter, avatar and alert dialog ([#6](https://github.com/kirana-style/primitives/pull/6)) ([6abc0bf](https://github.com/kirana-style/primitives/commit/6abc0bfe11a228d9de01ce75c22ff696935075d6))
* checkbox, switch and radio group on all five adapters ([#3](https://github.com/kirana-style/primitives/pull/3)) ([ca53b65](https://github.com/kirana-style/primitives/commit/ca53b651091d1420084b9c20a547a65ec33cc31f))
* checkbox, switch, radio group, select and slider inside a field ([#9](https://github.com/kirana-style/primitives/pull/9)) ([60a3f8c](https://github.com/kirana-style/primitives/commit/60a3f8cf58daefa809dcf1f40550fb08a1b94b24))
* direction provider on all five adapters ([#10](https://github.com/kirana-style/primitives/pull/10)) ([6abf092](https://github.com/kirana-style/primitives/commit/6abf092b775110cdefb65c724ab7c7a940198be7))
* field, fieldset and form on all five adapters ([#8](https://github.com/kirana-style/primitives/pull/8)) ([5b7b17e](https://github.com/kirana-style/primitives/commit/5b7b17ee78faacc55f663ad3ea2630078fcc85ee))
* generated ids and an open popup across a server and a client ([#13](https://github.com/kirana-style/primitives/pull/13)) ([10ae52e](https://github.com/kirana-style/primitives/commit/10ae52ebf0cd13cd7c11d7bddef3bf60f52d2664))
* slider on all five adapters ([#7](https://github.com/kirana-style/primitives/pull/7)) ([4e1b61e](https://github.com/kirana-style/primitives/commit/4e1b61e9adf71b35d0e9db14239d0fa82f4f1d15))
* tabs and accordion on all five adapters, and arrow keys as a service ([#4](https://github.com/kirana-style/primitives/pull/4)) ([30fbe99](https://github.com/kirana-style/primitives/commit/30fbe9916a082db3af6496705e661d7bbe2592aa))
* the architecture spike, one core on react, svelte and angular ([7aab4a9](https://github.com/kirana-style/primitives/commit/7aab4a9d27d95362e0dc7f9aaabd5c9045d65e97))
* the vocabulary package, and pages rendered on a server and hydrated ([#2](https://github.com/kirana-style/primitives/pull/2)) ([f7110a3](https://github.com/kirana-style/primitives/commit/f7110a3ed38a193be68586de6ac42f6c9ae005ae))
* tooltip and hover card on all five adapters ([#5](https://github.com/kirana-style/primitives/pull/5)) ([e2315c7](https://github.com/kirana-style/primitives/commit/e2315c73631fb99d117e99ff28a23b3e9c49c49a))
* vue and solid adapters, composition, and firefox and webkit in conformance ([#1](https://github.com/kirana-style/primitives/pull/1)) ([84e10c7](https://github.com/kirana-style/primitives/commit/84e10c73e209db05c9b607455af9227a2cd69466))


### Bug fixes

* a positioned popup keeps its trigger's reading direction ([#11](https://github.com/kirana-style/primitives/pull/11)) ([1779a98](https://github.com/kirana-style/primitives/commit/1779a980bc7a355b0c77ad60bde5e9e25053f5e7))
* rehearse the release at the version the tarballs carry ([#19](https://github.com/kirana-style/primitives/pull/19)) ([ce2f2c3](https://github.com/kirana-style/primitives/commit/ce2f2c3db04a6af2d895e161376da030470842ed))

# Contributing

How a change becomes a line of the changelog. Building, testing and the rules of the design are
in `README.md` and `docs/`.

## A pull request is one commit, and one line of the changelog

Pull requests are squash-merged. The title becomes the commit's subject, and the description its
body. [release-please](https://github.com/googleapis/release-please) reads both when it writes
`CHANGELOG.md`, which ships in every package: it is what a project upgrading reads.

- **The title is the changelog's line.** A Conventional Commit in lower case, under 72 characters,
  saying what a user gets (`fix: a submenu keeps its place while its menu closes`), never "fixes
  from the port". Its type picks the section and the version: `feat` a minor, `fix` a patch,
  `perf`, `docs`, `deps` and `revert` are listed, `refactor`, `test`, `build`, `ci` and `chore`
  are not. A breaking change adds `!` after the type (`feat!:`, `fix(angular)!:`).
- **Name every break in the description's last paragraph**, which release-please reads as the
  commit's footer. One paragraph that starts `BREAKING CHANGE: `, a full sentence saying what
  changed and what to write now. Several breaks: that line, then a `- ` line for each, with no
  blank line between them:

  ```text
  BREAKING CHANGE: what a caller writes now:
  - Angular's selectors are `[kp…]`, its classes `Kp…` and its tokens `KP_…` (were `kui`).
  - Angular's calendar emits `monthChanged` as `{ month, details }`; read `event.month`.
  ```

  Only the last `BREAKING CHANGE:` paragraph is read: a second one replaces the first. Without
  it, the changelog's breaking change is the title, which says what was added, not what broke.

- **A paragraph that starts with a type and a colon is another change.** Release-please reads
  each one at the end of the body as its own line of the changelog (`fix(angular): …`), with its
  own indented `BREAKING-CHANGE:` line if it breaks something. Use it when one pull request
  really holds two changes worth a line each; otherwise do not begin a paragraph that way, and do
  not repeat the title in the description (it would be listed twice).

The template (`.github/pull_request_template.md`) has the sections: What, Why, How tested.

## After the merge

- **A description edited after the merge does not change the commit.** To correct what a merged
  pull request says, before its release is cut, add to its description a block that replaces
  its whole message, title line included:

  ```text
  BEGIN_COMMIT_OVERRIDE
  feat!: calendar modes and a design system's composition (#55)

  BREAKING CHANGE: Angular's calendar emits `monthChanged` as `{ month, details }`.
  END_COMMIT_OVERRIDE
  ```

  Release-please reads it from the pull request on its next run and rewrites the Release PR.

- **A past section of `CHANGELOG.md` can be edited by hand** in any pull request: release-please
  only puts the next version's section above the newest one, and leaves the rest as it is. The
  GitHub release's notes are separate and are edited on GitHub.

## The repository setting this depends on

The description reaches the commit only when the repository's squash merges default to the pull
request's title and description (Settings, General, Pull Requests, "Allow squash merging",
"Default to pull request title and description"). With the title alone, no `BREAKING CHANGE:`
paragraph reaches release-please, and only `BEGIN_COMMIT_OVERRIDE` does. Pull requests land
through the merge queue: after the next merge, `git log -1 --format=%B` on `main` shows whether
the description arrived.

# CLAUDE.md

## Branches

- This is Calliope's fork of microbit-foundation/microbit-connection. Work
  happens on `calliope-main`: branch off it and merge back into it. Other
  branches (upstream's and older Calliope ones such as `feature-add-calliope`)
  are not worked on.
- The fork is not shipped on its own and has no tags. KI-Training
  (`calliope-edu/ml-trainer`) pins its commit in its `package-lock.json`, from
  `git+https://github.com/calliope-edu/mini-connection.git#calliope-main`.
- Every push to `calliope-main` commits the new pin to the app's `calliope-main`
  (workflow `calliope-app-lockfile`), which makes the app's dev build; the app's
  next tag takes it live.
- The plan behind this: calliope-campus `docs/design/2026-editor-channels.md`,
  "Library forks".

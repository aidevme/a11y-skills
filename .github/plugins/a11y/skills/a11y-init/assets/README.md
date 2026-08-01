# a11y-init assets

The `A11Y.md` template is single-sourced from `@aidevme/a11y-context-gen` (the package the CLI's `init` command uses) — it is assembled from rule metadata at run time, not copied from a static file here. Keeping no second copy in this folder is deliberate: prevention content and audit rules must never drift apart (DESIGN §2.3a).

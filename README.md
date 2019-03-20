# rush-monorepo-virtualized

This repository provides an example of virtualizing dependencies for a Rush monorepo.

**Why virtualize?**

In a large monorepo, installing dependencies for all projects can take a non-trivial amount of time and disk space. We virtualize these dependencies to only install what's needed.

**When should I virtualize?**

This is probably only necessary when the generated rush.json file would have 1,000 or more top-level dependencies.

## Development

The code primarily lives in: src/vrepo/

Example of configuring a service with virtualized deps:

```
PACKAGE=app-a rush configure
```

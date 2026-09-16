# SolidStart v2 example

Create a SolidStart v2 application, install the four packages shown in the
adapter README, then copy `src/routes/index.tsx` and `src/routes/about.tsx` into
the application's routes directory. SolidStart renders the grid host on the
server; the adapter imports and mounts the vanilla custom element after
hydration in the browser.

The links exercise route navigation. Leaving `/` unmounts the grid, including
its renderer roots and subscriptions. Returning to `/` creates a fresh grid.

SolidStart v2 uses `vite.config.ts` with `solidStart()` and a deployment plugin.
Keep the generated configuration from the SolidStart scaffold; this example
only replaces the route files.

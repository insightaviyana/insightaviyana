import { defineConfig } from 'vitest/config';

/**
 * Deliberately minimal and separate from vite.config.ts. Priority 2's
 * scope (see NEXT_SESSION_PLAN.md) is pure business-logic functions --
 * status-transition rules that decide what state a piece of content ends
 * up in, given who's acting on it. None of that needs a browser DOM, React
 * rendering, or this project's dev-server Express/Gemini plugin, so this
 * config stays intentionally small rather than reusing vite.config.ts's
 * plugin list.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});

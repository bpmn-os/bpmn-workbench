import { defineConfig } from 'vite';

// Builds the demo app (src/app.js + index.html), deployed to GitHub Pages. `base` is the gh-pages
// sub-path (https://bpmn-os.github.io/bpmn-workbench/) in CI; output goes to dist/.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/bpmn-workbench/' : '/'
});

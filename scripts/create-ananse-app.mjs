#!/usr/bin/env node
/**
 * Scaffold a minimal Vite + React app that uses Ananse.
 *
 *   node scripts/create-ananse-app.mjs my-org-app
 *   pnpm create-app my-org-app
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const name = process.argv[2] ?? "ananse-app";
const dir = resolve(process.cwd(), name);

if (existsSync(dir)) {
  console.error(`Directory already exists: ${dir}`);
  process.exit(1);
}

mkdirSync(join(dir, "src"), { recursive: true });

const pkg = {
  name,
  private: true,
  type: "module",
  scripts: {
    dev: "vite",
    build: "vite build",
    preview: "vite preview",
  },
  dependencies: {
    "@ananse/core": "^0.1.0",
    "@ananse/react": "^0.1.0",
    "@ananse/tokens": "^0.1.0",
    react: "^18.3.1",
    "react-dom": "^18.3.1",
  },
  devDependencies: {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    typescript: "^5.6.0",
    vite: "^5.4.0",
  },
};

writeFileSync(join(dir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
writeFileSync(
  join(dir, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
);
writeFileSync(
  join(dir, "vite.config.ts"),
  `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
});
`,
);
writeFileSync(
  join(dir, "tsconfig.json"),
  `${JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        strict: true,
        skipLibCheck: true,
      },
      include: ["src"],
    },
    null,
    2,
  )}\n`,
);
writeFileSync(
  join(dir, "src/main.tsx"),
  `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
);
writeFileSync(
  join(dir, "src/App.tsx"),
  `import { OrgChart } from "@ananse/react";

const people = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "cto", name: "Grace Hopper", title: "CTO", managerId: "ceo", department: "engineering" },
  { id: "eng", name: "Alan Turing", title: "Engineer", managerId: "cto", department: "engineering" },
];

export function App() {
  return (
    <OrgChart
      defaultData={people}
      mode="edit"
      height="100vh"
      showSearch
      nodeVariant="detailed"
      onChange={(next) => console.log("org changed", next.length)}
    />
  );
}
`,
);
writeFileSync(
  join(dir, "README.md"),
  `# ${name}

Scaffolded by Ananse \`create-ananse-app\`.

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Until packages are on npm, link the monorepo:

\`\`\`bash
pnpm add link:../canvas-lib/packages/core link:../canvas-lib/packages/react link:../canvas-lib/packages/tokens
\`\`\`
`,
);

console.log(`
Created ${name}/

  cd ${name}
  pnpm install   # or link monorepo packages — see README
  pnpm dev
`);

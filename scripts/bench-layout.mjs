import { createRequire } from "node:module";
/**
 * Layout performance bench — run: node scripts/bench-layout.mjs
 * Converts NOs around scale into a measured story.
 */
import { performance } from "node:perf_hooks";

const require = createRequire(import.meta.url);

// Use built dist
const core = await import("../packages/core/dist/index.js");

function bench(label, fn, runs = 5) {
  const times = [];
  // warmup
  fn();
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  console.log(`${label}: median ${median.toFixed(1)}ms (n=${runs})`);
  return median;
}

const sizes = [100, 500, 1000, 2000];
console.log("Canvas layout benchmarks\n");

for (const size of sizes) {
  const people = core.generateOrgChart({ size, branching: 3 });
  bench(`layoutOrgChart size=${size}`, () => {
    core.layoutOrgChart(people);
  });
}

// Mind map stress
const mind = [{ id: "r", label: "Root", parentId: null }];
for (let i = 0; i < 200; i++) {
  mind.push({ id: `m${i}`, label: `Node ${i}`, parentId: i < 20 ? "r" : `m${i % 20}` });
}
bench("layoutMindMap nodes=201", () => core.layoutMindMap(mind));

const flowNodes = Array.from({ length: 100 }, (_, i) => ({
  id: `f${i}`,
  label: `Step ${i}`,
  kind: i === 0 ? "start" : i === 99 ? "end" : "task",
}));
const flowLinks = Array.from({ length: 99 }, (_, i) => ({
  source: `f${i}`,
  target: `f${i + 1}`,
}));
bench("layoutFlow nodes=100", () => core.layoutFlow(flowNodes, flowLinks));

console.log("\nDone. Use onlyRenderVisibleElements in React for large canvases.");

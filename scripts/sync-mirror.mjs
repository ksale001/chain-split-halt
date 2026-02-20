import { cpSync, readFileSync, writeFileSync } from "node:fs";

const source = "src/ChainSplitHaltLandingPage.jsx";
const target = "chain_split_halt_landing_page.jsx";

// Keep the shared artifact file in sync with the app source.
cpSync(source, target);

const content = readFileSync(target, "utf8");
if (!content.startsWith("// Mirror of src/ChainSplitHaltLandingPage.jsx")) {
  writeFileSync(target, `// Mirror of src/ChainSplitHaltLandingPage.jsx\n${content}`, "utf8");
}

console.log(`Synced ${target} from ${source}`);

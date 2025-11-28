import { execSync } from "node:child_process";

const args = process.argv.slice(2).join(" ");
const command = `node --import=tsx/esm bin/console.ts ${args}`;

try {
	execSync(command, { stdio: "inherit" });
} catch {
	process.exit(1);
}

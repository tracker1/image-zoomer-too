#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net

import { build, emptyDir } from "@deno/dnt";

// Read version from deno.json
const denoJson = JSON.parse(await Deno.readTextFile("./deno.json"));
const version = denoJson.version;

await emptyDir("./npm");

await build({
  entryPoints: ["./src/mod.tsx"],
  outDir: "./npm",
  test: false,
  shims: {
    deno: false,
  },
  compilerOptions: {
    lib: ["ESNext", "DOM", "DOM.Iterable"],
    target: "ES2022",
    jsx: "react-jsx",
    jsxImportSource: "react",
  },
  // Map npm: imports to bare specifiers for the npm package
  mappings: {
    "npm:react@^19.0.0": {
      name: "react",
      version: "^18.0.0 || ^19.0.0",
      peerDependency: true,
    },
    "npm:react@^19.0.0/jsx-runtime": {
      name: "react",
      subPath: "jsx-runtime",
      version: "^18.0.0 || ^19.0.0",
      peerDependency: true,
    },
    "npm:eventemitter3@^5.0.1": {
      name: "eventemitter3",
      version: "^5.0.1",
    },
  },
  package: {
    name: "@tracker1/image-zoomer-too",
    version: "0.0.0", // Will be replaced
    description:
      "A React component for image viewing with zoom/pan support, using EventEmitter for external control",
    keywords: [
      "image",
      "zoomer",
      "zoom",
      "pan",
      "viewer",
      "react",
      "component",
      "eventemitter",
      "pinch",
      "touch",
    ],
    homepage: "https://github.com/tracker1/image-zoomer-too#readme",
    repository: {
      type: "git",
      url: "git+https://github.com/tracker1/image-zoomer-too.git",
    },
    license: "MIT",
    bugs: {
      url: "https://github.com/tracker1/image-zoomer-too/issues",
    },
    peerDependencies: {
      react: "^18.0.0 || ^19.0.0",
      "react-dom": "^18.0.0 || ^19.0.0",
    },
    dependencies: {
      eventemitter3: "^5.0.1",
    },
    devDependencies: {
      "@types/react": "^19.0.0",
    },
    sideEffects: false,
  },
  postBuild() {
    // Copy LICENSE and README
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");

    // Remove unnecessary files
    try {
      Deno.removeSync("npm/test_runner.js");
    } catch { /* ignore if doesn't exist */ }
    try {
      Deno.removeSync("npm/package-lock.json");
    } catch { /* ignore if doesn't exist */ }
    try {
      Deno.removeSync("npm/node_modules", { recursive: true });
    } catch { /* ignore if doesn't exist */ }

    // Clean up package.json
    const packageJsonPath = "npm/package.json";
    const packageJson = JSON.parse(Deno.readTextFileSync(packageJsonPath));
    delete packageJson.scripts;
    delete packageJson.test;
    delete packageJson.devDependencies.picocolors;
    delete packageJson._generatedBy;
    Deno.writeTextFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n",
    );
  },
});

console.log(`\nBuilt npm package version ${version}`);

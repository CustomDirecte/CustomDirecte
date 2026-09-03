const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const toolingDirectory = path.join(root, "popup-tooling", "classic");
const executableName = process.platform === "win32" ? "tailwindcss.exe" : "tailwindcss";
const executable = path.join(toolingDirectory, executableName);
const popupDirectory = path.join(root, "src", "pages", "popup");
const classicDirectory = path.join(popupDirectory, "interfaces", "classic");
const legacyDirectory = path.join(popupDirectory, "interfaces", "legacy");

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(sourcePath, destinationPath);
    else copyFile(sourcePath, destinationPath);
  }
}

const output = path.join(popupDirectory, "interface.css");
const classicTemplates = path.join(toolingDirectory, "templates.html");
const legacyDirectorySource = path.join(root, "popup-tooling", "legacy");
const legacyTemplates = path.join(legacyDirectorySource, "templates.html");
const legacyStyles = path.join(legacyDirectorySource, "interface.css");

if (!fs.existsSync(executable)) {
  console.error(`Compilateur Tailwind introuvable : ${executable}`);
  process.exit(1);
}

const result = spawnSync(executable, [
  "-c", "tailwind.config.js",
  "-i", "tailwind.css",
  "-o", "../../src/pages/popup/interface.css",
  "--minify",
], {
  cwd: toolingDirectory,
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(`Impossible de lancer Tailwind : ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) process.exit(result.status ?? 1);
if (!fs.existsSync(output)) {
  console.error(`Le fichier CSS attendu n'a pas ete genere : ${output}`);
  process.exit(1);
}

if (!fs.existsSync(classicTemplates) || !fs.existsSync(legacyTemplates) || !fs.existsSync(legacyStyles)) {
  console.error("Sources d'interface popup incompletes : templates ou CSS manquant.");
  process.exit(1);
}

copyFile(classicTemplates, path.join(classicDirectory, "templates.html"));
copyFile(legacyTemplates, path.join(legacyDirectory, "templates.html"));
copyFile(legacyStyles, path.join(legacyDirectory, "interface.css"));
copyDirectory(path.join(toolingDirectory, "svg"), path.join(popupDirectory, "svg"));
copyDirectory(path.join(legacyDirectorySource, "svg"), path.join(popupDirectory, "svg"));

console.log(`Popup genere : ${path.relative(root, output)}, templates et assets synchronises.`);

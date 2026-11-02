// Starts @inlustris/youtube-mcp with a yt-dlp binary on PATH, so
// get_video_frame captures full-quality frames instead of storyboards.
//
// Lookup order:
//   1. tools/yt-dlp.exe shipped with this project
//   2. pip --user installs (%APPDATA%\Python\Python3*\Scripts\yt-dlp.exe)
//   3. whatever is already on PATH
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function pipScriptDirs() {
  const root = path.join(process.env.APPDATA || "", "Python");
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^Python3/i.test(entry.name))
      .map((entry) => path.join(root, entry.name, "Scripts"))
      .filter((dir) => fs.existsSync(path.join(dir, "yt-dlp.exe")));
  } catch {
    return [];
  }
}

const candidates = [__dirname, ...pipScriptDirs()];
process.env.PATH = [...candidates, process.env.PATH || ""].join(path.delimiter);

const entry = path.resolve(__dirname, "..", "node_modules", "@inlustris", "youtube-mcp", "build", "index.js");

import(pathToFileURL(entry).href).catch((error) => {
  console.error("Failed to start youtube-mcp:", error);
  process.exit(1);
});

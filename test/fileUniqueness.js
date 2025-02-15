#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "..", "src");
// Define a whitelist of filenames that are allowed to have duplicates.
const whitelist = new Set(["index.astro"]);

function getFilesRecursively(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFilesRecursively(srcDir);
const seen = {};
let duplicatesFound = false;

files.forEach((filePath) => {
  const baseName = path.basename(filePath);
  // Skip checking for duplicates if the file is in the whitelist.
  if (whitelist.has(baseName)) return;

  if (seen[baseName]) {
    console.error(`Duplicate filename found: ${baseName}
  Found in:
    ${seen[baseName]}
    ${filePath}`);
    duplicatesFound = true;
  } else {
    seen[baseName] = filePath;
  }
});

if (duplicatesFound) {
  console.error("File uniqueness test failed.");
  process.exit(1);
} else {
  console.log(
    "File uniqueness test passed: all non-whitelisted filenames are unique.",
  );
}

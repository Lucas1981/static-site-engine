const fs = require('fs').promises;
const wildcard = '*';
const excludedFiles = ['.', '..'];

async function isDirectory(path) {
  return (await fs.lstat(path)).isDirectory();
}

function hasExtension(file, extension) {
  if (extension === wildcard) return true;
  const fileParts = file.split('.');
  // Is it a string? Then check if the two match
  if (typeof extension === 'string') {
    return fileParts[1] === extension;
  }
  // Otherwise, assume it's an array and check if the extension is in there
  return extension.includes(fileParts[1]);
}

function isExcludedFile(file) {
  return excludedFiles.includes(file);
}

async function scanDir(path, extension = wildcard) {
  let result = [];
  const files = await fs.readdir(path);
  for(const file of files) {
    const fileAndPath = `${path}/${file}`;
    if (isExcludedFile(file)) {
      continue;
    } else if (await isDirectory(fileAndPath)) {
      result = [
        ...result,
        ...await scanDir(fileAndPath, extension)
      ];
    } else if (hasExtension(file, extension)) {
      result.push(fileAndPath);
    }
  }
  return result;
}

module.exports = scanDir;

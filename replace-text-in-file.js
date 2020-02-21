const fs = require('fs').promises;

function replaceStringInString(content, source, target) {
  let mutatedContent = '';
  let index = 0;
  while (content.substr(index).includes(source)) {
    const start = content.substr(index).indexOf(source);
    const end = start + source.length;
    mutatedContent += `${content.substr(index, start)}${target}`;
    index += end;
  }
  mutatedContent += content.substr(index);
}

async function replaceStringInFile(file, source, target, destFile = null) {
    const content = await fs.readFile(file, 'utf8');
    const mutatedContent = replaceStringInString(content, source, target);
    await fs.writeFile(destFile ? destFile : file, mutatedContent, 'utf8');
}

function replaceRegexInString(content, regex, target) {
  const matches = content.match(regex);
  if (!matches) return content;
  let mutatedContent = '';
  let index = 0;
  for (const match of matches) {
    const start = content.substr(index).indexOf(match);
    const end = start + match.length;
    mutatedContent += `${content.substr(index, start)}${target}`;
    index += end;
  }
  mutatedContent += content.substr(index);
}

async function replaceRegexInFile(file, regex, target, destFile = null) {
  const content = await fs.readFile(file, 'utf8');
  const mutatedContent = replaceRegexInString(content, regex, target);
  await fs.writeFile(destFile ? destFile : file, mutatedContent, 'utf8');
}

module.exports = {
  replaceStringInString,
  replaceRegexInString,
  replaceRegexInFile,
  replaceStringInFile
};

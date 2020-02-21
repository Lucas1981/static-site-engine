const fs = require('fs').promises;
const sass = require('node-sass');
const pretty = require('pretty');
const ncp = require('ncp').ncp;
const markdown = require( "markdown" ).markdown;
const scanDir = require('./scan-dir.js');
const { replaceRegexInString } = require('./replace-text.js');
const config = require('./src/config.json');
const parts = {};

function renderHeader(part, key) {
  const identifier = `menu-list-item-link-${key}`
  return part
    .replace(identifier, `${identifier} active-page`);
}

function hasSidebar(key, pages) {
  return (
    key in pages &&
    'sidebar' in pages[key] &&
    pages[key].sidebar === false
  );
}

function renderContent(key, content, sidebar) {
  if (hasSidebar(key, config.pages)) {
    return `<div class="main">
      <div class="content-no-sidebar">
        ${content}
      </div>
    </div>`;
  }

  return `<div class="main">
    <div class="content-with-sidebar">
      ${content}
    </div>${parts.sidebar}
  </div>`;
}

function replaceMoustache(content, symbol, value) {
  const regex = new RegExp(`{{.*?${symbol}.*?}}`, 'sg');
  const mutatedContent = replaceRegexInString(content, regex, value);
  return mutatedContent;
}

function replaceMoustaches(content, replacements) {
  let mutatedContent = content;
  for (replacement of replacements) {
    const { symbol, value } = replacement;
    mutatedContent = replaceMoustache(mutatedContent, symbol, value);
  }
  return mutatedContent;
}

function renderPage(content, key) {
  return `<!DOCTYPE html>
<html lang="${config.general.lang}">
${parts.head}
<body>
  ${renderHeader(parts.header, key)}
  <div class="container">
    ${renderContent(key, content, parts.sidebar)}
  </div>
  ${parts.footer}
  ${parts.script}
  <!-- Last updated: ${new Date()} -->
</body>
</html>
`;
}

function extractFilename(pathAndFileName) {
  const allParts = pathAndFileName.split('/');
  return allParts[allParts.length - 1];
}

function extractKeyFromFilename(filename) {
  return filename.split('.')[0];
}

function extractExtensionFromFilename(filename) {
  return filename.split('.')[1];
}

async function loadParts() {
  parts.head = replaceMoustaches(await fs.readFile('./src/parts/head/head.html', 'utf8'), config.head.replacements);
  parts.header = replaceMoustaches(await fs.readFile('./src/parts/header/header.html', 'utf8'), config.header.replacements);
  parts.sidebar = replaceMoustaches(await fs.readFile('./src/parts/sidebar/sidebar.html', 'utf8'), config.sidebar.replacements);
  parts.footer = replaceMoustaches(await fs.readFile('./src/parts/footer/footer.html', 'utf8'), config.footer.replacements);
  parts.script = await fs.readFile('./src/parts/script/script.html', 'utf8');
}

(async function main() {
  const pagesFiles = await scanDir('./src/pages', ['html', 'md', 'txt']);

  await loadParts();

  // html

  console.log('Processing html files');

  for (const pagesFile of pagesFiles) {
    const filename = extractFilename(pagesFile);
    console.log(`Processing file: ${filename}`);
    const key = extractKeyFromFilename(filename);
    const extension = extractExtensionFromFilename(filename);
    const rawContent = await fs.readFile(pagesFile, 'utf8');
    const content = extension === 'md' ? markdown.toHTML(rawContent) : rawContent;
    const pageContent = renderPage(content, key);
    const prettyfiedHtml = pretty(pageContent);
    await fs.writeFile(`./dest/${filename.replace(extension, 'html')}`, prettyfiedHtml, 'utf8');
  }

  // css

  console.log('\nProcessing css files');

  const result = sass.renderSync({
    file: './src/style/style.scss',
  });

  await fs.writeFile('./dest/style.css', result.css);

  // js

  console.log('\nProcessing js files');

  const jsFiles = await scanDir('./src/parts/script', 'js');
  let concatenatedJsFiles = '';
  for (const jsFile of jsFiles) {
    console.log(`Concatinating file: ${jsFile}`);
    const jsFileContent = await fs.readFile(jsFile, 'utf8');
    concatenatedJsFiles += `// ${jsFile}\n\n${jsFileContent}\n\n`;
  }

  fs.writeFile('./dest/bundle.js', concatenatedJsFiles, 'utf8');

  // assets

  console.log('\nProcessing assets');

  await ncp('./src/assets', './dest/assets');

  console.log('\nDone!');

})();

/* eslint-disable no-console */
// One-off transformer: rewrite every screen that imports the static `colors`
// from `../../config/theme` to instead build its styles per-render from the
// active theme's colors. Run from suwamed-mobile/: `node scripts/refactor-darkmode.js`.
//
// Per file:
//   1. Drop `colors` from `import { ... } from '../../config/theme';` (keep
//      everything else). If `colors` was the only import, drop the whole line.
//   2. Add `import { useTheme, ThemeColors } from '../../contexts/ThemeContext';`
//      immediately after the theme import.
//   3. Rename `const styles = StyleSheet.create({` (anywhere in the file) to
//      `const makeStyles = (colors: ThemeColors) => StyleSheet.create({`.
//   4. For each top-level component (default export or React.FC), inject
//      `const { theme: colors } = useTheme();` and `const styles = makeStyles(colors);`
//      at the start of its body. We match `const Name: React.FC = (...) => {` and
//      `const Name = (...) => {` and `function Name(...) {`.
//
// Manual cases the script doesn't try to fix automatically (it leaves a // TODO
// hint instead): files that use `colors` at module scope (in `const META = [{ color: colors.x }]`).
// Those need a small refactor — moving the meta inside the component, or
// changing the helper to take `colors` as an argument.

const fs = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, '..', 'src', 'screens');

// Skip the screens that already use useTheme / getDynamicStyles correctly.
const SKIP_FILES = new Set([
  'shared/SettingsScreen.tsx',
  'doctor/SettingsScreen.tsx',
  'auth/OnboardingConsentScreen.tsx',
  'shared/TermsScreen.tsx',
  'shared/PrivacyPolicyScreen.tsx',
]);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.tsx')) yield full;
  }
}

function relScreenPath(absPath) {
  return path.relative(SCREENS_DIR, absPath).replace(/\\/g, '/');
}

function isAlreadyRefactored(content) {
  return content.includes("from '../../contexts/ThemeContext'") &&
    /\bmakeStyles\b/.test(content);
}

function rewriteThemeImport(content) {
  // Match: import { A, colors, B } from '../../config/theme';
  // Capture and remove `colors`. Keep the rest.
  const importRe = /^import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/\.\.\/config\/theme['"]\s*;?\s*$/m;
  const m = content.match(importRe);
  if (!m) return { content, changed: false, hadColors: false };

  const items = m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const hadColors = items.some((s) => s === 'colors' || s.startsWith('colors '));
  if (!hadColors) return { content, changed: false, hadColors: false };

  const remaining = items.filter((s) => !(s === 'colors' || s.startsWith('colors ')));

  let replacement;
  if (remaining.length === 0) {
    // Only `colors` was imported — drop the whole line.
    replacement = '';
  } else {
    replacement = `import { ${remaining.join(', ')} } from '../../config/theme';`;
  }

  // Always also add the ThemeContext import on the next line, if not already present.
  const ctxImport = "import { useTheme, ThemeColors } from '../../contexts/ThemeContext';";
  let newContent = content.replace(importRe, replacement);
  if (!newContent.includes(ctxImport)) {
    if (replacement) {
      newContent = newContent.replace(replacement, `${replacement}\n${ctxImport}`);
    } else {
      // Stick the context import where the theme import used to be.
      newContent = newContent.replace(importRe, ctxImport);
    }
  }

  return { content: newContent, changed: true, hadColors };
}

function renameStylesToFactory(content) {
  // Catch: `const styles = StyleSheet.create({`
  const re = /const\s+styles\s*=\s*StyleSheet\.create\(\s*\{/g;
  if (!re.test(content)) return { content, changed: false };
  const out = content.replace(
    /const\s+styles\s*=\s*StyleSheet\.create\(\s*\{/g,
    'const makeStyles = (colors: ThemeColors) => StyleSheet.create({',
  );
  return { content: out, changed: true };
}

// Inject `const { theme: colors } = useTheme();` and `const styles = makeStyles(colors);`
// inside each top-level component body. We look for these patterns at column 0:
//   const Name: React.FC = (...) => {
//   const Name = (...) => {
//   const Name: React.FC<X> = (...) => {
// followed by a possible newline; we add the two lines immediately after the `{`.
function injectHookCalls(content) {
  // Match top-level (column 0) component declarations that open a body with `{`.
  // We require the file to contain `makeStyles` first — we only want to inject
  // when there's a styles factory to call.
  if (!content.includes('const makeStyles = (colors: ThemeColors) =>')) {
    return { content, changed: false };
  }

  // Pattern A: `const Name: React.FC<...> = (params) => {`
  // Pattern B: `const Name = (params) => {`
  // We anchor at `^const ` (column 0). We don't try to anchor at the file's
  // single component — some files have helper components too. We inject into
  // each one because they all rendered with the static `colors` and need the
  // same fix.
  const componentRe =
    /^(const\s+[A-Z][A-Za-z0-9_]*(?:\s*:\s*React\.FC(?:<[^>]+>)?)?\s*=\s*\([^)]*\)\s*=>\s*\{)\s*$/gm;

  let changed = false;
  let out = content.replace(componentRe, (match) => {
    // Skip components that already inject hooks
    changed = true;
    return `${match}\n  const { theme: colors } = useTheme();\n  const styles = makeStyles(colors);`;
  });

  // Also catch `function Name(...) {` at column 0
  const fnRe = /^(function\s+[A-Z][A-Za-z0-9_]*\s*\([^)]*\)\s*(?::\s*[A-Za-z0-9_<>.,\s]+)?\s*\{)\s*$/gm;
  out = out.replace(fnRe, (match) => {
    changed = true;
    return `${match}\n  const { theme: colors } = useTheme();\n  const styles = makeStyles(colors);`;
  });

  return { content: out, changed };
}

function flagModuleScopeColors(content) {
  // After we've stripped `colors` from the theme import, any remaining
  // `colors.X` reference at module scope (i.e. outside the component body)
  // is a bug. Heuristic: if a const declared at column 0 has `colors.` in it,
  // flag it.
  const lines = content.split('\n');
  const flagged = [];
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Naive depth tracking — count braces
    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}') depth = Math.max(0, depth - 1);
    }
    if (depth === 0 && /\bcolors\./.test(line) && !line.trim().startsWith('//')) {
      flagged.push(`  L${i + 1}: ${line.trim()}`);
    }
  }
  return flagged;
}

let touched = 0;
let skipped = 0;
const flags = [];

for (const file of walk(SCREENS_DIR)) {
  const rel = relScreenPath(file);
  if (SKIP_FILES.has(rel)) {
    skipped++;
    continue;
  }
  const original = fs.readFileSync(file, 'utf8');
  if (isAlreadyRefactored(original)) {
    skipped++;
    continue;
  }

  let content = original;
  const importRes = rewriteThemeImport(content);
  if (!importRes.hadColors) {
    skipped++;
    continue;
  }
  content = importRes.content;

  const renameRes = renameStylesToFactory(content);
  content = renameRes.content;

  const injectRes = injectHookCalls(content);
  content = injectRes.content;

  // Flag risky module-scope `colors.X` references that won't compile after the rewrite.
  const moduleScope = flagModuleScopeColors(content);
  if (moduleScope.length) {
    flags.push({ file: rel, lines: moduleScope });
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    touched++;
    console.log(`✏  ${rel}`);
  } else {
    skipped++;
  }
}

console.log(`\nTouched: ${touched}\nSkipped: ${skipped}`);

if (flags.length) {
  console.log(`\n⚠ Files with module-scope colors.X usage (need manual fix):`);
  for (const f of flags) {
    console.log(`\n  ${f.file}`);
    f.lines.forEach((l) => console.log(l));
  }
}

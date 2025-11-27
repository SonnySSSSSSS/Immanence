// node tools/splitTreatise.js
import fs from "node:fs";
import path from "node:path";

const inputPath = path.join(process.cwd(), "treatise.md");
const outputPath = path.join(process.cwd(), "src/data/treatise.generated.js");

const raw = fs.readFileSync(inputPath, "utf8");

// split on top-level headings
const blocks = raw.split(/\n(?=#\s)/).filter(Boolean);

const chapters = blocks.map((block, idx) => {
  const lines = block.trim().split("\n");
  const titleLine = lines[0].replace(/^#\s*/, "").trim();
  const bodyLines = lines.slice(1);
  const id = titleLine
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const excerpt = bodyLines.slice(0, 3).join(" ").slice(0, 220);

  return {
    id,
    order: idx + 1,
    title: titleLine,
    subtitle: "",
    excerpt,
    body: bodyLines.join("\n"),
  };
});

const js = `// AUTO-GENERATED from treatise.md — do not edit by hand.
export const treatiseChapters = ${JSON.stringify(chapters, null, 2)};
`;

fs.writeFileSync(outputPath, js, "utf8");
console.log(`Wrote ${chapters.length} chapters to ${outputPath}`);

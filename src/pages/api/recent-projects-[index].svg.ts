import { type APIContext } from "astro";
export const prerender = false;
export async function GET({ params }: APIContext) {
  try {
    const indexParam = params.index;
    const index = parseInt(indexParam || "", 10);

    if (isNaN(index) || index < 0) {
      return new Response(
        JSON.stringify({ error: 400, message: "Invalid index parameter." }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Use Astro.glob to get MDX modules
    const modules = await import.meta.glob("../../pages/projects/*.mdx", {
      eager: true,
    });

    let projects = Object.entries(modules)
      .map(([filepath, mod]: any) => {
        const slug =
          filepath
            .split("/")
            .pop()
            ?.replace(/\.mdx$/, "") ?? "";

        return {
          title: mod.frontmatter.title,
          date: new Date(mod.frontmatter.date),
          published: mod.frontmatter.published,
          description: mod.frontmatter.description,
          tags: mod.frontmatter.tags,
          href: `/projects/${slug}`,
        };
      })
      .filter((project) => project.published)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    if (index >= projects.length) {
      return new Response(
        JSON.stringify({ error: 404, message: "Project not found." }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const project = projects[index];

    // Estimate text width with basic character count (approximation)
    function estimateTextWidth(
      text: string,
      fontSize = 12,
      padding = 16
    ): number {
      return text.length * (fontSize * 0.6) + padding; // padding includes left/right space
    }

    // Word-wrap text into lines that fit within a max char width
    function wrapWords(text: string, maxLineLength: number): string[] {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        if ((currentLine + word).length <= maxLineLength) {
          currentLine += (currentLine ? " " : "") + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    }

    const titleLines = wrapWords(project.title, 45);
    const descLines = wrapWords(project.description, 65);

    // Tags auto-wrap with dynamic width
    const TAG_HEIGHT = 22;
    const PADDING_BETWEEN_TAGS = 8;
    const PADDING_AROUND_TAG_TEXT = 14;
    const MAX_WIDTH = 540;

    let tagRows: string[][] = [];
    let currentRow: string[] = [];
    let currentRowWidth = 0;

    for (const tag of project.tags) {
      const tagWidth = estimateTextWidth(tag, 12, PADDING_AROUND_TAG_TEXT);
      if (currentRowWidth + tagWidth + PADDING_BETWEEN_TAGS > MAX_WIDTH) {
        tagRows.push(currentRow);
        currentRow = [tag];
        currentRowWidth = tagWidth + PADDING_BETWEEN_TAGS;
      } else {
        currentRow.push(tag);
        currentRowWidth += tagWidth + PADDING_BETWEEN_TAGS;
      }
    }
    if (currentRow.length) tagRows.push(currentRow);

    const TITLE_LINE_HEIGHT = 26;
    const DESC_LINE_HEIGHT = 20;
    const TAG_VERTICAL_SPACING = 8;

    // Compute dynamic Y offsets
    const titleHeight = titleLines.length * TITLE_LINE_HEIGHT;
    const descHeight = descLines.length * DESC_LINE_HEIGHT;
    const dateHeight = 30;
    const tagsHeight = tagRows.length * (TAG_HEIGHT + TAG_VERTICAL_SPACING);

    // Add base paddings
    const totalVerticalPadding = 40 + 20; // initial top + extra bottom

    const svgHeight =
      titleHeight +
      40 +
      descHeight +
      dateHeight +
      tagsHeight +
      totalVerticalPadding;

    // GitHub-like colors
    const COLORS = {
      background: "#0d1117",
      border: "#30363d",
      title: "#e6edf3",
      description: "#c9d1d9",
      date: "#8b949e",
      tagBackground: "#21262d",
      tagBorder: "#30363d",
      tagText: "#8b949e",
    };

    const svg = `
<svg width="500" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="cardShadow" x="-2%" y="-2%" width="104%" height="104%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Main card -->
  <rect width="100%" height="100%" fill="${COLORS.background}" rx="6" 
    stroke="${COLORS.border}" stroke-width="1" filter="url(#cardShadow)" />

  <!-- Repository icon -->
  <g transform="translate(24, 24) scale(0.9)">
    <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" 
      fill="${COLORS.description}" />
  </g>

  <!-- Title -->
  <text x="52" y="40" font-family="Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif" 
    font-size="18" fill="${COLORS.title}" font-weight="600">
    ${titleLines.map((line, i) => `<tspan x="52" dy="${i === 0 ? 0 : TITLE_LINE_HEIGHT}">${line}</tspan>`).join("")}
  </text>

  <!-- Description -->
  <text x="24" y="${80 + (titleLines.length - 1) * TITLE_LINE_HEIGHT}" 
    font-family="Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif" 
    font-size="14" fill="${COLORS.description}">
    ${descLines.map((line, i) => `<tspan x="24" dy="${i === 0 ? 0 : DESC_LINE_HEIGHT}">${line}</tspan>`).join("")}
  </text>

  <!-- Date -->
  <text x="24" y="${120 + (titleLines.length - 1) * TITLE_LINE_HEIGHT + (descLines.length - 1) * DESC_LINE_HEIGHT}" 
    font-family="Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif" 
    font-size="12" fill="${COLORS.date}">
    <tspan>Updated on ${new Date(project.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</tspan>
  </text>

  <!-- Tags -->
  ${tagRows
    .map((row, rowIndex) => {
      let x = 24;
      const y =
        150 +
        (titleLines.length - 1) * TITLE_LINE_HEIGHT +
        (descLines.length - 1) * DESC_LINE_HEIGHT +
        rowIndex * (TAG_HEIGHT + TAG_VERTICAL_SPACING);
      return row
        .map((tag) => {
          const width = estimateTextWidth(tag, 12, PADDING_AROUND_TAG_TEXT);
          const tagSVG = `
      <g>
        <rect x="${x}" y="${y}" rx="12" ry="12" width="${width}" height="${TAG_HEIGHT}" 
          fill="${COLORS.tagBackground}" stroke="${COLORS.tagBorder}" stroke-width="1" />
        <text x="${x + PADDING_AROUND_TAG_TEXT / 2}" y="${y + TAG_HEIGHT - 7}" 
          font-family="Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif" 
          font-size="12" fill="${COLORS.tagText}">${tag}</text>
      </g>`;
          x += width + PADDING_BETWEEN_TAGS;
          return tagSVG;
        })
        .join("");
    })
    .join("")}
</svg>`;

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Vary: "Accept-Encoding",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 500, message: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

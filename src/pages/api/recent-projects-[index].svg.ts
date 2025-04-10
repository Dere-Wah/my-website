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
            "Cache-Control": "no-cache, no-store, private, must-revalidate",
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
            "Cache-Control": "no-cache, no-store, private, must-revalidate",
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
    <path d="m2.45 10.575l4.2-4.2q.35-.35.825-.5t.975-.05l1.3.275Q8.4 7.7 7.625 9t-1.5 3.15zm5.125 2.275q.575-1.8 1.563-3.4t2.387-3q2.2-2.2 5.025-3.287t5.275-.663q.425 2.45-.65 5.275T17.9 12.8q-1.375 1.375-3 2.388t-3.425 1.587zm6.9-3q.575.575 1.413.575T17.3 9.85t.575-1.412t-.575-1.413t-1.412-.575t-1.413.575t-.575 1.413t.575 1.412m-.7 12.025l-1.6-3.675q1.85-.725 3.163-1.5t2.912-2.125l.25 1.3q.1.5-.05.988t-.5.837zM4.05 16.05q.875-.875 2.125-.888t2.125.863t.875 2.125t-.875 2.125q-.625.625-2.087 1.075t-4.038.8q.35-2.575.8-4.025T4.05 16.05"
      fill="${COLORS.description}"/>
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
        "Cache-Control": "no-cache, no-store, private, must-revalidate",
        Vary: "Accept-Encoding",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 500, message: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, private, must-revalidate",
      },
    });
  }
}

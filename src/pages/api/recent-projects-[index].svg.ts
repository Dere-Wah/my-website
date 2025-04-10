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

    const titleLines = wrapWords(project.title, 40);
    const descLines = wrapWords(project.description, 60);

    // Tags auto-wrap with dynamic width
    const TAG_HEIGHT = 24;
    const PADDING_BETWEEN_TAGS = 10;
    const PADDING_AROUND_TAG_TEXT = 16;
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
    const DESC_LINE_HEIGHT = 22;
    const TAG_VERTICAL_SPACING = 10;

    // Compute dynamic Y offsets
    const titleHeight = titleLines.length * TITLE_LINE_HEIGHT;
    const descHeight = descLines.length * DESC_LINE_HEIGHT;
    const dateHeight = 30;
    const tagsHeight = tagRows.length * (TAG_HEIGHT + TAG_VERTICAL_SPACING);

    // Add base paddings
    const totalVerticalPadding = 50 + 20; // initial top + extra bottom

    const svgHeight =
      titleHeight +
      40 +
      descHeight +
      dateHeight +
      tagsHeight +
      totalVerticalPadding;

    const svg = `
<svg width="600" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="#1e293b" />
			<stop offset="100%" stop-color="#0f172a" />
		</linearGradient>
		<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
			<feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.4" />
		</filter>
	</defs>

	<rect width="100%" height="100%" fill="url(#bgGradient)" rx="20" />

	<!-- Title -->
	<text x="30" y="50" font-family="Verdana" font-size="22" fill="#cbd5e1" font-weight="bold" filter="url(#shadow)">
		${titleLines.map((line, i) => `<tspan x="30" dy="${i === 0 ? 0 : 26}">${line}</tspan>`).join("")}
	</text>

	<!-- Description -->
	<text x="30" y="${90 + (titleLines.length - 1) * 26}" font-family="Verdana" font-size="16" fill="#94a3b8">
		${descLines.map((line, i) => `<tspan x="30" dy="${i === 0 ? 0 : 22}">${line}</tspan>`).join("")}
	</text>

	<!-- Date -->
	<text x="30" y="${140 + (titleLines.length - 1) * 26 + (descLines.length - 1) * 22}" font-family="Verdana" font-size="14" fill="#64748b">
		📅 ${new Date(project.date).toLocaleDateString()}
	</text>

	<!-- Tags -->
	${tagRows
    .map((row, rowIndex) => {
      let x = 30;
      const y =
        160 +
        (titleLines.length - 1) * 26 +
        (descLines.length - 1) * 22 +
        rowIndex * (TAG_HEIGHT + 10);
      return row
        .map((tag) => {
          const width = estimateTextWidth(tag, 12, PADDING_AROUND_TAG_TEXT);
          const tagSVG = `
			<g>
				<rect x="${x}" y="${y}" rx="6" ry="6" width="${width}" height="${TAG_HEIGHT}" fill="#1e293b" stroke="#475569" stroke-width="1" />
				<text x="${x + 8}" y="${y + 16}" font-family="Verdana" font-size="12" fill="#e2e8f0">${tag}</text>
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

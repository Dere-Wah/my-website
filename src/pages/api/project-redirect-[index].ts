import { type APIContext } from "astro";

export async function GET({ params, redirect }: APIContext) {
  try {
    const indexParam = params.index;
    const index = parseInt(indexParam || "", 10);

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

    // Ensure the index is within the valid range
    if (index < 0 || index >= projects.length) {
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

    // Redirect to the project page
    return redirect(projects[index].href);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 500, message: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

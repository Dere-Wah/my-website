import { type APIContext } from "astro";

// Discord webhook URL (replace with your actual webhook URL)
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1360170718163111946/osZIqxmV9c90zbPREorIQAS_UW1ijS_AWMgjbBDOvJ3zmKMdCbfSTsbtDwnsTVzJPUrl";

/**
 * Sends a notification to Discord when someone visits a blog post
 * @param projectTitle The title of the visited blog post
 * @param projectHref The URL path of the visited blog post
 */
async function sendDiscordNotification(
  projectTitle: string,
  projectHref: string
) {
  try {
    const timestamp = new Date().toISOString();

    // Create an embed message with project details
    const payload = {
      embeds: [
        {
          title: "Blog Visit Notification",
          description: `Someone just visited one of your blog posts!`,
          color: 3447003, // Blue color
          fields: [
            {
              name: "Blog Post",
              value: projectTitle,
              inline: true,
            },
            {
              name: "URL Path",
              value: projectHref,
              inline: true,
            },
          ],
          footer: {
            text: "GitHub Profile Redirect",
          },
          timestamp: timestamp,
        },
      ],
    };

    // Send the webhook request
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        "Failed to send Discord notification:",
        await response.text()
      );
    }
  } catch (error) {
    console.error("Error sending Discord notification:", error);
    // We don't throw here to prevent affecting the main redirect flow
  }
}

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

    const project = projects[index];

    // Send Discord notification (non-blocking)
    sendDiscordNotification(project.title, project.href).catch((err) =>
      console.error("Discord notification error:", err)
    );

    // Redirect to the project page
    return redirect(project.href);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 500, message: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

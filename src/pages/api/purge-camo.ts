import { type APIContext } from "astro";

export const prerender = false;

export async function GET({ request }: APIContext) {
  try {
    // Define the list of camo URLs to purge
    const camoUrls = [
      "https://camo.githubusercontent.com/58ab0d9e31a67b9c2599193c4e52b83c94fd21a99e24580a2ce74a9d9d9537b4/68747470733a2f2f646572657761682e6465762f6170692f726563656e742d70726f6a656374732d302e737667",
      "https://camo.githubusercontent.com/124f794d3697875236d5b411ce10899e6cbf5451d350685f639dbe9caaf8aa31/68747470733a2f2f646572657761682e6465762f6170692f726563656e742d70726f6a656374732d312e737667",
      "https://camo.githubusercontent.com/631338c5776b29624692e2c0a965a0bc4b1cdde953f9ff0e61e27dabf9eab140/68747470733a2f2f646572657761682e6465762f6170692f726563656e742d70726f6a656374732d322e737667",
      "https://camo.githubusercontent.com/09536f113f82a6e5693119a0f50c05a947d7720955d696085a31c820b3ae108a/68747470733a2f2f646572657761682e6465762f6170692f726563656e742d70726f6a656374732d332e737667",
    ];

    // Track results for each URL
    const results = [];

    // Process each URL one by one
    for (const url of camoUrls) {
      try {
        // Send PURGE request to the camo URL
        const purgeResponse = await fetch(url, {
          method: "PURGE",
          headers: {
            "User-Agent": "Astro/PurgeBot",
          },
        });

        // Store the result
        results.push({
          url,
          status: purgeResponse.status,
          statusText: purgeResponse.statusText,
          success: purgeResponse.ok,
        });
      } catch (error: any) {
        // Handle errors for individual URLs
        results.push({
          url,
          success: false,
          error: error.message || "Unknown error",
        });
      }
    }

    // Count successful and failed requests
    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    return new Response(
      JSON.stringify(
        {
          message: `Purge completed. ${successful} successful, ${failed} failed.`,
          timestamp: new Date().toISOString(),
          details: results,
        },
        null,
        2
      ),
      {
        status: failed > 0 ? 207 : 200, // Use 207 Multi-Status if any purge failed
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    // Handle any unexpected errors
    return new Response(
      JSON.stringify({
        error: true,
        message: err.message || "Unknown error occurred",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// Also handle POST requests for more flexibility
export const POST = GET;

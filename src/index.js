/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// export default {
// 	async fetch(request, env, ctx) {
// 		return new Response('Hello World!');
// 	},
// };

export default {
  async fetch(req, env) {
    const klaviyoPayload = {
      data: {
        type: "event",
        attributes: {
          metric: { name: "Refer a Friend Submission" },
          properties: {
            name: "John Doe",
            email: "jumanal@superpatch.com",
            phone: "123-456-7890",
            friend_emails: ["jumana.superpatch@gmail.com"],
            message: "Hey! You should check out Super Patch!"
          },
          profile: {
            email: "jumanal@superpatch.com",
            first_name: "John",
            last_name: "Doe"
          },
          time: new Date().toISOString()
        }
      }
    };

    const resp = await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${env.KLAVIYO_API_KEY}`,
		"Revision": "2023-02-22",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(klaviyoPayload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(`❌ Klaviyo error: ${text}`, { status: 500 });
    }

    return new Response("✅ Referral event sent to Klaviyo!", { status: 200 });
  }
}

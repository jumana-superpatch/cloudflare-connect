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
	async fetch(request, env) {
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		if (request.method !== "POST") {
			return new Response("Only POST requests allowed", { status: 405 });
		}

		try {
			const body = await request.json();

			// Extract fields from Shopify form JSON
			const name = body["contact[name]"] || "N/A";
			const email = body["contact[email]"] || "N/A";
			const phone = body["contact[phone]"] || "N/A";
			const help_topic = body["contact[Help Topic]"] || "N/A";
			const associate_id = body["contact[Associate / Rep ID]"] || "N/A";
			const order_id = body["contact[Order ID]"] || "N/A";
			const referral = body["contact[Referral]"] || "N/A";
			const message = body["contact[body]"] || "N/A";
			const locale = body["contact[Locale]"] || "en";

			// --- Choose Mailgun template based on locale
			// Your English template is called `contact form[dev]`
			// Create a Spanish one e.g. `contact form[dev]-es`
			let templateName = "contact form[dev]";
			if (locale.toLowerCase().startsWith("es")) {
				templateName = "contact form[dev]-es";
			}

			// Mailgun config
			const MAILGUN_API_KEY = env.MAILGUN_API_KEY;
			const MAILGUN_DOMAIN = env.MAILGUN_DOMAIN;
			const SUPPORT_EMAIL = env.SUPPORT_EMAIL;

			const formBody = new URLSearchParams();
			formBody.append("from", `Super Patch Support <postmaster@${MAILGUN_DOMAIN}>`);
			formBody.append("to", SUPPORT_EMAIL);
			if (email && email !== "N/A") {
				formBody.append("h:Reply-To", email);
			}
			// Use template instead of raw HTML
			formBody.append("template", templateName);

			// Variables passed into template
			formBody.append("h:X-Mailgun-Variables", JSON.stringify({
				name,
				email,
				phone,
				help_topic,
				associate_id,
				order_id,
				referral,
				message: message.replace(/\n/g, "<br>")
			}));

			// Send via Mailgun
			const mgRes = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
				method: "POST",
				headers: {
					Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: formBody.toString(),
			});

			if (!mgRes.ok) {
				const errText = await mgRes.text();
				throw new Error(`Mailgun error: ${errText}`);
			}

			return new Response(JSON.stringify({ success: true, message: "Email sent successfully!" }), {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
			});
		} catch (err) {
			return new Response(JSON.stringify({ success: false, error: err.message }), {
				status: 500,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Content-Type": "application/json",
				},
			});
		}
	}
};


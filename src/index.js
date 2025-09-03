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

			// Build email content
			const subject = `New Contact Form Submission (${help_topic})`;
			const text = `
				📩 New Contact Form Submission

				👤 Name: ${name}
				📧 Email: ${email}
				📞 Phone: ${phone}

				❓ Help Topic: ${help_topic}
				🆔 Associate ID: ${associate_id}
				📦 Order ID: ${order_id}
				🙋 Referral: ${referral}

				📝 Message:
				${message}
				`;

			// Mailgun config
			const MAILGUN_API_KEY = env.MAILGUN_API_KEY;
			const MAILGUN_DOMAIN = env.MAILGUN_DOMAIN;
			//   const SUPPORT_EMAILS = (env.SUPPORT_EMAILS || "").split(",");
			const SUPPORT_EMAILS = env.SUPPORT_EMAIL;
			const formBody = new URLSearchParams();
			formBody.append("from", `Super Patch Support <postmaster@${MAILGUN_DOMAIN}>`);
			SUPPORT_EMAILS.forEach(e => formBody.append("to", e.trim()));
			formBody.append("subject", subject);
			formBody.append("text", text);

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

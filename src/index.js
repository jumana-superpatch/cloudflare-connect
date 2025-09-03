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
		if (request.method !== "POST") {
			return new Response("Only POST requests allowed", { status: 405 });
		}

		try {
			const formData = await request.formData();

			// Extract fields
			const name = formData.get("name") || "N/A";
			const email = formData.get("email") || "N/A";
			const phone = formData.get("phone") || "N/A";
			const help_topic = formData.get("help_topic") || "N/A";
			const associate_id = formData.get("associate_id") || "N/A";
			const order_id = formData.get("order_id") || "N/A";
			const referral = formData.get("referral") || "N/A";
			const message = formData.get("message") || "N/A";

			// Email subject + body
			const subject = `New Contact Form Submission (${help_topic})`;
			const body = `
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
			const SUPPORT_EMAILS = (env.SUPPORT_EMAILS || "").split(","); // multiple emails in .env

			const formBody = new URLSearchParams();
			formBody.append("from", `Super Patch Support <postmaster@${MAILGUN_DOMAIN}>`);
			SUPPORT_EMAILS.forEach(email => formBody.append("to", email.trim()));
			formBody.append("subject", subject);
			formBody.append("text", body);

			// Send via Mailgun
			const res = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
				method: "POST",
				headers: {
					Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: formBody.toString(),
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Mailgun error: ${errorText}`);
			}

			return new Response(JSON.stringify({ success: true, message: "Email sent successfully!" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});

		} catch (err) {
			return new Response(JSON.stringify({ success: false, error: err.message }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	}
};

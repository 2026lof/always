exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed",
      };
    }

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const TO_EMAIL = process.env.APPT_TO_EMAIL;
    const FROM_EMAIL = process.env.APPT_FROM_EMAIL;

    if (!SENDGRID_API_KEY || !TO_EMAIL || !FROM_EMAIL) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing environment variables",
          hasSendgridKey: !!SENDGRID_API_KEY,
          hasToEmail: !!TO_EMAIL,
          hasFromEmail: !!FROM_EMAIL,
        }),
      };
    }

    let data = {};
    try {
      data = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }

    const message = `
New Appointment Request

Name: ${data.name || ""}
Email: ${data.email || ""}
Phone: ${data.phone || ""}
Availability: ${data.availability || ""}
Type: ${data.type || ""}

Notes:
${data.notes || ""}
`;

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: TO_EMAIL }] }],
        from: { email: FROM_EMAIL },
        reply_to: data.email ? { email: data.email } : undefined,
        subject: "New Appointment Request",
        content: [{ type: "text/plain", value: message }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        statusCode: res.status,
        body: JSON.stringify({
          error: "SendGrid request failed",
          details: text,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "ok" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Function crashed",
        details: String(err),
      }),
    };
  }
};

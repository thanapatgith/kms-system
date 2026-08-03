/** Sends a leave notification when Twilio credentials are configured. */
export async function notifyLeaveBySms(message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_PHONE;
  const to = process.env.SMS_NOTIFY_TO;

  if (!sid || !token || !from || !to) {
    console.info("SMS skipped: Twilio environment variables are not configured.");
    return;
  }

  const body = new URLSearchParams({ To: to, From: from, Body: message });
  const authorization = Buffer.from(`${sid}:${token}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("SMS provider rejected the notification");
}

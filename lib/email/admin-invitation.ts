import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendAdminInvitationParams = {
  name: string;
  email: string;
  inviteUrl: string;
  expiresAt: Date;
};

export async function sendAdminInvitationEmail({
  name,
  email,
  inviteUrl,
  expiresAt,
}: SendAdminInvitationParams) {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }

  const expiry = expiresAt.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });

  const { data, error } = await resend.emails.send({
    from,
    to: [email],
    subject: "You're invited to the Tinkhupp Admin Console",
    html: `
      <div style="margin:0;padding:40px 20px;background:#f7f7f7;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:40px;">
          
          <h1 style="margin:0 0 24px;color:#121212;font-size:28px;">
            Tinkhupp
          </h1>

          <h2 style="margin:0 0 16px;color:#121212;font-size:22px;">
            You're invited to the Admin Console
          </h2>

          <p style="margin:0 0 16px;color:#444;line-height:1.6;">
            Hi ${escapeHtml(name)},
          </p>

          <p style="margin:0 0 24px;color:#444;line-height:1.6;">
            You've been invited to join the Tinkhupp admin console.
            Click the button below to accept your invitation and set up your administrator account.
          </p>

          <a
            href="${escapeHtml(inviteUrl)}"
            style="
              display:inline-block;
              padding:14px 24px;
              background:#FF6B00;
              color:#ffffff;
              text-decoration:none;
              border-radius:8px;
              font-weight:600;
            "
          >
            Accept Invitation
          </a>

          <p style="margin:28px 0 8px;color:#666;font-size:14px;line-height:1.5;">
            This invitation expires on ${escapeHtml(expiry)}.
          </p>

          <p style="margin:0;color:#888;font-size:13px;line-height:1.5;">
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>

        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

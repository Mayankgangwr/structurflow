export type InviteEmailParams = {
  inviterName: string;
  orgName: string;
  inviteLink: string;
};

export function compileTeamInviteEmail(params: InviteEmailParams): { subject: string; html: string; text: string } {
  const { inviterName, orgName, inviteLink } = params;
  const subject = `You've been invited to join ${orgName} on StructurFlow`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">StructurFlow</h1>
      </div>
      <h2 style="color: #111827; font-size: 20px; font-weight: 600; text-align: center;">You're Invited!</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 24px; text-align: center;"><strong>${inviterName}</strong> has invited you to join the team at <strong>${orgName}</strong>.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">Accept Invitation</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; text-align: center;">Or copy and paste this link into your browser:</p>
      <p style="color: #4f46e5; font-size: 14px; text-align: center; word-break: break-all;"><a href="${inviteLink}" style="color: #4f46e5;">${inviteLink}</a></p>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 24px;">This invitation link will expire in <strong>3 days</strong>.</p>
      
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">StructurFlow - Intelligent Document Processing</p>
    </div>
  `;

  const text = `
    You're Invited!

    ${inviterName} has invited you to join the team at ${orgName} on StructurFlow.

    To accept the invitation, please open the following link in your browser:
    ${inviteLink}

    This invitation link will expire in 3 days.

    StructurFlow - Intelligent Document Processing
  `;

  return { subject, html, text };
}

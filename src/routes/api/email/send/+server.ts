import { json } from '@sveltejs/kit';
import { sendEmail } from '$lib/send-email';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { to, subject, body, cc } = await request.json();

    if (!to || !subject || !body) {
      return json({ error: 'to, subject, and body are required' }, { status: 400 });
    }

    // Convert plain text body to HTML
    const html = body.replace(/\n/g, '<br>');

    const result = await sendEmail(to, subject, html, cc);

    if (result.sent) {
      return json({ success: true, message: 'Email sent successfully' });
    } else {
      return json({ success: true, message: `Email queued (${result.reason})`, preview: { to, subject } });
    }
  } catch (e) {
    console.error('Email send error:', e);
    return json({ error: 'Failed to send email' }, { status: 500 });
  }
};

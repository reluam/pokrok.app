import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Snaps <noreply@snaps.app>';

const templates = {
  signup: {
    cs: {
      subject: 'Potvrď registraci do Snaps',
      body: (token: string, url: string) => `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">Vítej v Snaps!</h2>
          <p style="color: #64748b;">Tvůj ověřovací kód:</p>
          <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center; padding: 16px; background: #f1f5f9; border-radius: 12px; color: #1e293b;">${token}</h1>
          <p style="color: #64748b; text-align: center;">Nebo se přihlas kliknutím:</p>
          <p style="text-align: center;">
            <a href="${url}" style="display: inline-block; padding: 12px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Potvrdit registraci</a>
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 32px;">Kód je platný 60 minut. Pokud jsi o registraci nežádal/a, tento e-mail ignoruj.</p>
        </div>`,
    },
    en: {
      subject: 'Confirm your Snaps signup',
      body: (token: string, url: string) => `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">Welcome to Snaps!</h2>
          <p style="color: #64748b;">Your verification code:</p>
          <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center; padding: 16px; background: #f1f5f9; border-radius: 12px; color: #1e293b;">${token}</h1>
          <p style="color: #64748b; text-align: center;">Or sign in by clicking:</p>
          <p style="text-align: center;">
            <a href="${url}" style="display: inline-block; padding: 12px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Confirm signup</a>
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 32px;">Code is valid for 60 minutes. If you didn't request this, ignore this email.</p>
        </div>`,
    },
  },
  magiclink: {
    cs: {
      subject: 'Tvůj přihlašovací kód do Snaps',
      body: (token: string, url: string) => `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">Přihlášení do Snaps</h2>
          <p style="color: #64748b;">Tvůj ověřovací kód:</p>
          <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center; padding: 16px; background: #f1f5f9; border-radius: 12px; color: #1e293b;">${token}</h1>
          <p style="color: #64748b; text-align: center;">Nebo se přihlas kliknutím:</p>
          <p style="text-align: center;">
            <a href="${url}" style="display: inline-block; padding: 12px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Přihlásit se</a>
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 32px;">Kód je platný 60 minut. Pokud jsi o přihlášení nežádal/a, tento e-mail ignoruj.</p>
        </div>`,
    },
    en: {
      subject: 'Your Snaps login code',
      body: (token: string, url: string) => `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">Sign in to Snaps</h2>
          <p style="color: #64748b;">Your login code:</p>
          <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center; padding: 16px; background: #f1f5f9; border-radius: 12px; color: #1e293b;">${token}</h1>
          <p style="color: #64748b; text-align: center;">Or sign in by clicking:</p>
          <p style="text-align: center;">
            <a href="${url}" style="display: inline-block; padding: 12px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Sign in</a>
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 32px;">Code is valid for 60 minutes. If you didn't request this, ignore this email.</p>
        </div>`,
    },
  },
  recovery: {
    cs: {
      subject: 'Obnova hesla — Snaps',
      body: (token: string, url: string) => `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">Obnova hesla</h2>
          <p style="color: #64748b;">Tvůj kód pro obnovu:</p>
          <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center; padding: 16px; background: #f1f5f9; border-radius: 12px; color: #1e293b;">${token}</h1>
          <p style="text-align: center;">
            <a href="${url}" style="display: inline-block; padding: 12px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Obnovit heslo</a>
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 32px;">Pokud jsi o obnovu nežádal/a, tento e-mail ignoruj.</p>
        </div>`,
    },
    en: {
      subject: 'Password recovery — Snaps',
      body: (token: string, url: string) => `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">Password Recovery</h2>
          <p style="color: #64748b;">Your recovery code:</p>
          <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center; padding: 16px; background: #f1f5f9; border-radius: 12px; color: #1e293b;">${token}</h1>
          <p style="text-align: center;">
            <a href="${url}" style="display: inline-block; padding: 12px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset password</a>
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 32px;">If you didn't request this, ignore this email.</p>
        </div>`,
    },
  },
};

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log('Hook payload:', JSON.stringify(payload, null, 2));

    const user = payload.user;
    const email_data = payload.email_data;

    if (!user || !email_data) {
      console.error('Missing user or email_data in payload');
      return new Response(JSON.stringify({}), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const locale = user.user_metadata?.locale ?? 'cs';
    const lang = locale.startsWith('en') ? 'en' : 'cs';
    const emailType = email_data.email_action_type;

    console.log(`Sending ${emailType} email to ${user.email} in ${lang}`);

    const template = templates[emailType as keyof typeof templates];
    if (!template) {
      console.log(`No template for ${emailType}, skipping`);
      return new Response(JSON.stringify({}), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const localized = template[lang];
    const token = email_data.token ?? '';
    const confirmationUrl = email_data.confirmation_url ?? email_data.redirect_to ?? '';
    const html = localized.body(token, confirmationUrl);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [user.email],
        subject: localized.subject,
        html,
      }),
    });

    const resBody = await res.text();
    console.log('Resend response:', res.status, resBody);

    if (!res.ok) {
      console.error('Resend error:', resBody);
      // Still return 200 so Supabase Auth doesn't block the signup
      return new Response(JSON.stringify({}), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Send email error:', err);
    // Return 200 even on error so auth flow isn't blocked
    return new Response(JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

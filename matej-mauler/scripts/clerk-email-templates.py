#!/usr/bin/env python3
"""
Push Spaghetti-branded Clerk email templates (verification code + magic link
sign-in / sign-up) via the Clerk Backend API.

Run:
    CLERK_SECRET_KEY=sk_live_xxx python3 scripts/clerk-email-templates.py
    # use sk_test_xxx to update the Development instance, sk_live_xxx for Production

Notes:
- Custom email templates may require a paid Clerk plan. If so the API returns 403
  and you'll see it printed per template — then edit them by hand in the dashboard
  (Customization -> Emails) using the same copy.
- Emails send from <FROM>@spaghetti.ltd once the clkmail + DKIM DNS records verify.
- Revert anytime in the dashboard ("Reset to default").
"""
import json
import os
import sys
import urllib.error
import urllib.request

KEY = os.environ.get("CLERK_SECRET_KEY")
if not KEY:
    sys.exit("Set CLERK_SECRET_KEY (sk_live_... for prod, sk_test_... for preview) first.")

FROM = "hello"  # -> hello@spaghetti.ltd once DNS (clkmail/DKIM) is verified


def shell(inner: str) -> str:
    """Square, cream card in the Spaghetti palette — email-safe inline CSS."""
    return (
        '<div style="margin:0;background:#FAFAF7;padding:28px 16px;'
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\">"
        '<div style="max-width:460px;margin:0 auto;">'
        '<div style="background:#fffdf6;border:1px solid rgba(26,22,20,0.14);padding:30px 26px;">'
        '<div style="font-size:17px;font-weight:800;letter-spacing:-0.01em;color:#1a1614;margin-bottom:22px;">'
        '🍝 Spaghetti<span style="color:#9b958f;">.ltd</span></div>'
        f"{inner}"
        "</div>"
        '<div style="font-size:11px;color:#9b958f;padding:14px 4px 0;">'
        "life is complex. and messy. almost like spaghetti.</div>"
        "</div></div>"
    )


H1 = 'margin:0 0 12px;font-size:21px;font-weight:800;letter-spacing:-0.02em;color:#1a1614;'
P = 'margin:0 0 18px;font-size:15px;line-height:1.6;color:#5c5550;'
MUTED = 'margin:18px 0 0;font-size:13px;line-height:1.6;color:#9b958f;'
BTN = ('display:inline-block;background:#1a1614;color:#FAFAF7;text-decoration:none;'
       'font-size:14px;font-weight:700;padding:13px 26px;border-radius:999px;')
CODE = ('font-size:32px;font-weight:800;letter-spacing:0.2em;color:#1a1614;background:#FAFAF7;'
        'border:1px solid rgba(26,22,20,0.14);padding:16px;text-align:center;')

VERIFICATION = shell(
    f'<h1 style="{H1}">here\'s your code</h1>'
    f'<p style="{P}">punch this in to get into spaghetti.ltd:</p>'
    f'<div style="{CODE}">{{{{otp_code}}}}</div>'
    f'<p style="{MUTED}">good for 10 minutes. didn\'t ask for it? ignore this — nothing happens.</p>'
)

SIGN_IN = shell(
    f'<h1 style="{H1}">your way back in</h1>'
    f'<p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#5c5550;">tap to sign in — no password, that\'s the whole point.</p>'
    f'<a href="{{{{magic_link}}}}" style="{BTN}">sign me in &rarr;</a>'
    f'<p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#9b958f;">good for 10 minutes. not you? ignore away.</p>'
)

SIGN_UP = shell(
    f'<h1 style="{H1}">welcome aboard</h1>'
    f'<p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#5c5550;">tap to finish your spaghetti account — one account, every experiment.</p>'
    f'<a href="{{{{magic_link}}}}" style="{BTN}">confirm &amp; continue &rarr;</a>'
    f'<p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#9b958f;">see you inside.</p>'
)

TEMPLATES = {
    "verification_code": {"subject": "{{otp_code}} — your spaghetti code", "body": VERIFICATION},
    "magic_link_sign_in": {"subject": "your way back into spaghetti.ltd", "body": SIGN_IN},
    "magic_link_sign_up": {"subject": "one tap and you're in — spaghetti.ltd", "body": SIGN_UP},
}


def put(slug: str, subject: str, body: str) -> None:
    payload = json.dumps({
        "subject": subject,
        "from_email_name": FROM,
        "body": body,
        "markup": body,
        "delivered_by_clerk": True,
    }).encode()
    req = urllib.request.Request(
        f"https://api.clerk.com/v1/templates/email/{slug}",
        data=payload,
        method="PUT",
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as r:
            print(f"✓ {slug}: {r.status}")
    except urllib.error.HTTPError as e:
        print(f"✗ {slug}: {e.code} {e.read().decode()[:400]}")


if __name__ == "__main__":
    for slug, t in TEMPLATES.items():
        put(slug, t["subject"], t["body"])

"use client";

import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Homepage user icon. Signed out → opens Clerk sign-in / register (modal).
// Signed in → links to /me. Env-guarded: renders nothing without Clerk keys.
export function UserMenu() {
  if (!clerkEnabled) return null;
  return <Inner />;
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 19c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Inner() {
  const { isSignedIn, isLoaded, user } = useUser();
  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <Link href="/me" className="usermenu" aria-label="Your profile" title="your mind across the experiments">
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.imageUrl} alt="" className="usermenu-avatar" />
        ) : (
          <PersonIcon />
        )}
      </Link>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="usermenu" aria-label="Sign in or register" title="sign in / register">
        <PersonIcon />
      </button>
    </SignInButton>
  );
}

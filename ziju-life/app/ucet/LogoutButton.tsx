'use client'

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/ucet'
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-foreground/50 hover:text-foreground transition-colors underline"
    >
      Odhlásit se
    </button>
  )
}

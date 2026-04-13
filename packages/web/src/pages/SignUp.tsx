import { SignIn, SignUp as ClerkSignUp } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'

export default function SignUp() {
  const location = useLocation()
  const isSignIn = location.pathname === '/sign-in'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-1px',
          marginBottom: 8,
        }}>
          CANNA<span style={{ color: 'var(--accent-intel)' }}>SPY</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360 }}>
          {isSignIn
            ? 'Sign in to your intelligence platform.'
            : 'Claim your market. Lock out your rivals.'}
        </div>
      </div>
      {isSignIn ? (
        <SignIn afterSignInUrl="/command-center" />
      ) : (
        <ClerkSignUp afterSignUpUrl="/setup/locations" />
      )}
    </div>
  )
}

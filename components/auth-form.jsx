'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Eye, EyeOff, LoaderCircle, ArrowLeft } from 'lucide-react';
import { Brand } from './brand';
import { Button } from './ui/button';
import { Input } from './ui/input';
// Two-column authentication block, adapted to HackMatch from shadcn/ui login-02.


export default function AuthForm({ register = false, admin = false }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(form), ...(admin ? { adminOnly: true } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push(data.redirectTo || '/dashboard');
      router.refresh();
    } catch (error) {
      setError(error.message || 'Unable to connect. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="auth-layout">
      <div className="auth-panel">
        <Brand />
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> Back to the beginning
        </Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {admin ? 'ADMINISTRATOR ACCESS' : register ? 'YOUR NEXT CHAPTER STARTS HERE' : 'GOOD TO HAVE YOU BACK'}
          </span>
          <h1 className="display">
            {admin ? <>ADMIN<br />CONSOLE<span>.</span></> : register ? (
              <>
                FIND YOUR
                <br />
                PEOPLE<span>.</span>
              </>
            ) : (
              <>
                BACK TO
                <br />
                BUILDING<span>.</span>
              </>
            )}
          </h1>
          <p>
            {admin ? 'Sign in to manage the shared database and present SQL queries.' : register
              ? 'One account. A whole new set of possibilities.'
              : 'Your ideas and your next teammates are waiting.'}
          </p>
          <form onSubmit={submit} className="form-stack">
            {register && (
              <label htmlFor="name">
                Full name
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
            )}
            <label htmlFor="email">
              Email address
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@college.edu"
                maxLength={254}
                required
              />
            </label>
            <label htmlFor="password">
              Password
              <div className="password-field">
                <Input
                  id="password"
                  name="password"
                  type={visible ? 'text' : 'password'}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  minLength={10}
                  maxLength={128}
                  placeholder={register ? 'At least 10 characters' : 'Enter your password'}
                  required
                />
                <button
                  type="button"
                  aria-label={visible ? 'Hide password' : 'Show password'}
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {register && (
                <span className="field-hint">
                  Use a unique password with at least 10 characters.
                </span>
              )}
            </label>
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            <Button disabled={busy} className="auth-submit" type="submit">
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={18} /> Please wait
                </>
              ) : (
                <>
                  {admin ? 'ADMIN SIGN IN' : register ? 'CREATE YOUR ACCOUNT' : 'SIGN IN'}
                  <ArrowUpRight size={19} />
                </>
              )}
            </Button>
          </form>
          <p className="auth-switch">
            {admin ? <Link href="/sign-in">Participant sign-in ↗</Link> : <>
            {register ? 'Already part of the crew?' : 'New around here?'}{' '}
            <Link href={register ? '/sign-in' : '/sign-up'}>
              {register ? 'Sign in' : 'Create an account'} ↗
            </Link>
          </>}
          </p>
        </div>
        <span className="auth-footnote">GOOD IDEAS NEED GREAT TEAMS.</span>
      </div>
      <aside className="auth-visual" aria-label="Different skills, shared ambition">
        <div className="auth-visual-top">
          <span>
            THE CONNECTION
            <br />
            CHANGES EVERYTHING.
          </span>
          <span>HM / 01</span>
        </div>
        <div className="auth-art" aria-hidden="true">
          <div className="auth-art-ring" />
          <div className="auth-art-ring ring-offset" />
          <span>✳</span>
        </div>
        <div className="auth-visual-bottom">
          <h2>
            DIFFERENT SKILLS.
            <br />
            SHARED AMBITION.
          </h2>
          <p>
            Someone out there is the missing piece
            <br />
            to what you want to build.
          </p>
        </div>
      </aside>
    </main>
  );
}

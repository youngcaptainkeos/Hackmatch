'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }) {
  return (
    <main id="main" style={{ padding: '10vw' }}>
      <h1 className="display" style={{ fontSize: 70 }}>
        A SMALL
        <br />
        DISCONNECT.
      </h1>
      <p style={{ margin: '25px 0' }}>We couldn’t load this page. Please try again.</p>
      <Button onClick={reset}>Try again ↗</Button>
    </main>
  );
}

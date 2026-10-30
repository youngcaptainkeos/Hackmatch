import Link from 'next/link';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
export default function NotFound() {
  return (
    <main id="main" style={{ padding: '8vw', minHeight: '100vh' }}>
      <Brand dark />
      <p className="eyebrow" style={{ display: 'block', marginTop: 80 }}>
        404 / A DIFFERENT DIRECTION
      </p>
      <h1 className="display" style={{ fontSize: 'clamp(60px,10vw,140px)', margin: '25px 0' }}>
        LOST THE
        <br />
        CONNECTION?
      </h1>
      <p style={{ marginBottom: 30 }}>This page isn’t here. Your next teammate might be.</p>
      <Button asChild>
        <Link href="/">Back to HackMatch ↗</Link>
      </Button>
    </main>
  );
}

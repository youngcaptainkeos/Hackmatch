import Link from 'next/link';
export function Brand({ dark = false }) {
  return (
    <Link href="/" className={`brand ${dark ? 'brand-dark' : ''}`} aria-label="HackMatch home">
      <span className="brand-mark" aria-hidden="true">
        h<span>↗</span>
      </span>
      <span>
        hackmatch<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

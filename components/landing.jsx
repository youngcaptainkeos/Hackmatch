'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDown, Plus, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from './brand';
export default function Landing() {
  const root = useRef(null);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 }
    );
    root.current.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    root.current.classList.add('motion-ready');
    return () => observer.disconnect();
  }, []);
  function move(event) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      '--mx',
      `${(event.clientX - rect.left - rect.width / 2) * 0.035}px`
    );
    event.currentTarget.style.setProperty(
      '--my',
      `${(event.clientY - rect.top - rect.height / 2) * 0.035}px`
    );
  }
  return (
    <div className="landing" ref={root}>
      <header className="landing-nav">
        <Brand />
        <nav aria-label="Main navigation" className={menu ? 'nav-links nav-open' : 'nav-links'}>
          <a href="#how-it-works" onClick={() => setMenu(false)}>
            The idea
          </a>
          <a href="#tracks" onClick={() => setMenu(false)}>
            Find your track
          </a>
          <Link href="/sign-in">
            Sign in <ArrowUpRight size={15} />
          </Link>
        </nav>
        <Button asChild className="nav-cta">
          <Link href="/sign-up">
            Find your people <ArrowUpRight size={16} />
          </Link>
        </Button>
        <button
          className="mobile-menu"
          aria-label={menu ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main">
        <section className="hero" onPointerMove={move}>
          <div className="hero-top">
            <span className="eyebrow">
              <i className="status-dot" /> BIG IDEAS. COMPLEMENTARY MINDS.
            </span>
            <span className="hero-coordinate">CONNECT / CREATE / REPEAT</span>
          </div>
          <div className="hero-heading">
            <h1>
              <span>GOOD IDEAS.</span>
              <span className="outline-word">
                GREAT<span className="spark-mini">✳</span>
              </span>
              <span>
                TOGETHER<span className="lime-period">.</span>
              </span>
            </h1>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orb-core">
              <div className="orb-grid" />
              <span className="orb-monogram">h↗</span>
            </div>
            <div className="floating-label label-one">
              <span className="tiny-square" /> YOUR NEXT TEAMMATE
            </div>
            <div className="floating-label label-two">
              <Plus size={16} /> DIFFERENT SKILLS. SAME DRIVE.
            </div>
            <div className="art-cross cross-one">+</div>
            <div className="art-cross cross-two">+</div>
            <span className="art-caption">THE CONNECTION CHANGES EVERYTHING</span>
          </div>
          <div className="hero-bottom">
            <p>
              You bring the idea.
              <br />
              Find the people who bring it to life.
            </p>
            <Button asChild className="hero-button">
              <Link href="/sign-up">
                LET’S BUILD SOMETHING <ArrowUpRight size={22} />
              </Link>
            </Button>
            <a className="scroll-cue" href="#how-it-works">
              <span>SCROLL TO CONNECT</span>
              <ArrowDown size={20} />
            </a>
          </div>
          <div className="hero-index">01 — THE STARTING POINT</div>
        </section>
        <div className="marquee" aria-hidden="true">
          <div>
            {[0, 1, 2, 3].map((i) => (
              <span key={i}>
                FIND YOUR PEOPLE <b>✳</b> BUILD YOUR THING <b>↗</b> MAKE IT HAPPEN <b>✳</b>{' '}
              </span>
            ))}
          </div>
        </div>
        <section id="how-it-works" className="idea-section section-pad">
          <div className="section-meta reveal">
            <span className="eyebrow">01 / BETTER TOGETHER</span>
            <span>AN IDEA IS ONLY THE BEGINNING.</span>
          </div>
          <div className="idea-grid">
            <h2 className="display reveal">
              YOUR MISSING
              <br />
              PIECE IS
              <br />
              <span className="muted-word">SOMEONE’S</span>
              <br />
              SUPERPOWER<span className="lime-period">.</span>
            </h2>
            <div className="idea-right">
              <p className="large-copy reveal">
                The designer to your developer.
                <br />
                The big picture to your details.
                <br />
                The “what if” to your “let’s do it.”
              </p>
              <p className="body-copy reveal">
                HackMatch connects hackathon participants through the skills they bring and the
                things they want to build. Less searching. More making.
              </p>
              <div className="process-list">
                {[
                  [
                    '01',
                    'Show what you bring',
                    'Your skills, interests, and the hours you work best.',
                  ],
                  [
                    '02',
                    'Find the right fit',
                    'Explore teams and see exactly which skills you share.',
                  ],
                  ['03', 'Make the first move', 'Apply, meet your crew, and start building.'],
                ].map(([n, title, copy]) => (
                  <div className="process-row reveal" key={n}>
                    <span>{n}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{copy}</p>
                    </div>
                    <ArrowUpRight size={21} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="connection-section">
          <div className="connection-graphic" aria-hidden="true">
            <span className="connection-ring ring-a" />
            <span className="connection-ring ring-b" />
            <span className="connection-ring ring-c" />
            <span className="connection-center">✳</span>
            <span className="graphic-label graphic-label-a">YOUR SKILLS</span>
            <span className="graphic-label graphic-label-b">THEIR VISION</span>
          </div>
          <div className="connection-copy reveal">
            <span className="eyebrow">BUILT ON COMMON GROUND</span>
            <h2 className="display">
              A MATCH YOU
              <br />
              CAN EXPLAIN.
            </h2>
            <p>
              See the skills a team needs and the ones you bring. Clear overlap. Real availability.
              A better starting point for a conversation.
            </p>
            <Link href="/sign-up" className="text-link">
              Make your connection <ArrowUpRight size={20} />
            </Link>
          </div>
        </section>
        <section id="tracks" className="tracks-section section-pad">
          <div className="section-meta reveal">
            <span className="eyebrow">02 / CHOOSE YOUR CHALLENGE</span>
            <span>ONE HACKATHON. DIFFERENT DIRECTIONS.</span>
          </div>
          <div className="tracks-heading reveal">
            <h2 className="display">
              PICK A LANE.
              <br />
              BREAK NEW GROUND.
            </h2>
            <p>
              Bring your curiosity.
              <br />
              Your team will bring the rest.
            </p>
          </div>
          <div className="track-list">
            {[
              ['01', 'AI & ML', 'Turn intelligence into impact.', '✳'],
              ['02', 'CYBERSECURITY', 'Build a safer digital world.', '⌁'],
              ['03', 'FINTECH', 'Rethink how money moves.', '↗'],
              ['04', 'SUSTAINABILITY', 'Make a difference that lasts.', '◎'],
            ].map(([n, title, copy, icon]) => (
              <Link href="/sign-up" className="track-row reveal" key={n}>
                <span className="track-num">{n}</span>
                <span className="track-symbol" aria-hidden="true">
                  {icon}
                </span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <ArrowUpRight className="track-arrow" />
              </Link>
            ))}
          </div>
          <p className="track-note">
            These are our sample tracks. Sign in to see current registration and availability.
          </p>
        </section>
        <section className="final-cta">
          <div className="cta-top">
            <span className="eyebrow">THE NEXT GREAT THING STARTS WITH A HELLO.</span>
            <span aria-hidden="true">✳</span>
          </div>
          <h2 className="display reveal">
            DON’T BUILD
            <br />
            IT ALONE<span>.</span>
          </h2>
          <Button asChild variant="outline" className="cta-button">
            <Link href="/sign-up">
              FIND YOUR PEOPLE <ArrowUpRight size={24} />
            </Link>
          </Button>
          <span className="cta-decoration" aria-hidden="true">
            ↗
          </span>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <p>Different skills. Shared ambition.</p>
        <div>
          <Link href="/sign-in">Sign in</Link>
          <a href="#main">Back to top ↑</a>
        </div>
        <span>HACKMATCH / A DBMS PROJECT</span>
      </footer>
    </div>
  );
}

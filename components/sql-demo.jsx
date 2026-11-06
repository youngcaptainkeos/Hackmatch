'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Database, Play, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { demoQueries } from '@/lib/demo-queries';
import { Brand } from './brand';
import { Button } from './ui/button';

function displayValue(value) {
  if (value === null) return <span className="sql-null">NULL</span>;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function SqlDemo({ user }) {
  const [participants, setParticipants] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [selected, setSelected] = useState(demoQueries[0].id);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const query = demoQueries.find((item) => item.id === selected) || demoQueries[0];

  useEffect(() => {
    fetch('/api/demo/sql').then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setParticipants(payload.participants);
    }).catch((cause) => setError(cause.message));
  }, []);

  async function signOut() {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (response.ok) window.location.assign('/admin/sign-in');
    else setError('Could not sign out. Please retry.');
  }

  async function execute() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/demo/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: query.id, targetUserId: targetUserId ? Number(targetUserId) : null }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Query could not be executed.');
      setResult(payload);
    } catch (cause) {
      setError(cause.message || 'Query could not be executed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sql-demo-page">
      <header className="sql-demo-nav">
        <Brand />
        <span>Admin · {user.name}</span>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
        <Link className="sql-demo-back" href="/">
          <ArrowLeft size={15} /> Back to HackMatch
        </Link>
      </header>

      <section className="sql-demo-shell">
        <div className="sql-demo-intro">
          <span className="eyebrow"><span className="status-dot" /> ADMIN DATABASE CONSOLE</span>
          <h1 className="display">ADMIN <span>SQL console.</span></h1>
          <p>
            Run SQL against the shared project database. Select a participant for name and team
            updates. Reset removes the demo marker. Participant dashboards refresh every five seconds.
          </p>
        </div>

        <div className="sql-demo-workspace">
          <aside className="sql-demo-sidebar" aria-label="SQL examples">
            <div className="sql-demo-sidebar-title">QUERY SET <span>{String(demoQueries.length).padStart(2, '0')}</span></div>
            {demoQueries.map((item, index) => (
              <button
                className={`sql-demo-query-choice ${item.id === selected ? 'is-selected' : ''}`}
                key={item.id}
                onClick={() => {
                  setSelected(item.id);
                  setResult(null);
                  setError('');
                }}
              >
                <span className="sql-demo-query-number">{String(index + 1).padStart(2, '0')}</span>
                <span>{item.title}</span>
              </button>
            ))}
            <p className="sql-demo-readonly-note">FIXED SQL EXAMPLES · ADMIN ACCESS ONLY</p>
          </aside>

          <section className="sql-demo-panel" aria-label="SQL query and results">
            <div className="sql-demo-panel-head">
              <div>
                <span className="sql-demo-topic">{query.topic}</span>
                <h2>{query.title}</h2>
              </div>
              <span className="sql-demo-db-label"><Database size={14} /> MySQL</span>
            </div>

            {query.mutating && (
              <label className="sql-demo-target">
                Participant to update or reset
                <select value={targetUserId} disabled={busy} onChange={(event) => {
                  setTargetUserId(event.target.value);
                  setResult(null);
                  setError('');
                }}>
                  <option value="">Choose a participant</option>
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      #{participant.id} · {participant.name} · {participant.email}{participant.team_name ? ` · ${participant.team_name}` : ' · No team'}
                    </option>
                  ))}
                </select>
                <small>The ? parameter below uses participant ID {targetUserId || '(choose above)'}. Updates persist in the shared database.</small>
              </label>
            )}
            <pre className="sql-demo-code"><code>{query.sql}</code></pre>
            {query.topic.startsWith('TRIGGER') && (
              <p className="sql-demo-explain">
                Triggers fire automatically when their table changes. This command reads the stored
                definition so you can explain its event and logic without changing live data.
              </p>
            )}
            {query.topic.startsWith('STORED PROCEDURE · SHOW CREATE') && (
              <p className="sql-demo-explain">
                This displays the procedure saved in MySQL. Choose “Call get_track_summary()” to run it.
              </p>
            )}

            <div className="sql-demo-actions">
              <Button onClick={execute} disabled={busy || (query.mutating && !targetUserId)}>
                {busy ? <RotateCcw className="sql-demo-spin" size={15} /> : <Play size={15} />}
                {busy
                  ? query.id === 'demo-reset-changes' ? 'Resetting…' : 'Executing…'
                  : query.id === 'demo-reset-changes' ? 'Reset demo changes'
                    : query.mutating ? 'Run update' : 'Execute query'}
              </Button>
              <span>
                {query.mutating
                  ? query.id === 'demo-reset-changes'
                    ? 'Removes the [SQL demo] marker from the selected participant name and their team name.'
                    : query.id === 'demo-update-team-name'
                      ? 'Adds [SQL demo] to the selected participant’s team name. Reset restores it.'
                      : 'Adds [SQL demo] to the selected participant’s displayed name. Their email and password stay the same.'
                  : 'Runs against the configured MySQL database'}
              </span>
            </div>

            <div className="sql-demo-results" aria-live="polite">
              <div className="sql-demo-results-head">
                <span>RESULT</span>
                {result && <span>{result.message || `${result.rowCount} ROW${result.rowCount === 1 ? '' : 'S'}`}</span>}
              </div>
              {error ? (
                <div className="sql-demo-message sql-demo-error">{error}</div>
              ) : result ? (
                result.definition ? (
                  <pre className="sql-demo-definition"><code>{result.definition}</code></pre>
                ) : result.rows.length ? (
                  <div className="sql-demo-table-wrap">
                    <table className="sql-demo-table">
                      <thead><tr>{result.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                      <tbody>
                        {result.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {result.columns.map((column) => <td key={column}>{displayValue(row[column])}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="sql-demo-message">Query ran successfully. No rows matched.</div>
                )
              ) : (
                <div className="sql-demo-message">Choose Execute query to show live database results.</div>
              )}
            </div>
          </section>
        </div>

        <p className="sql-demo-footnote">Admin access: <code>/admin</code>. Both computers must use the same deployed website to see shared changes.</p>
      </section>
    </main>
  );
}

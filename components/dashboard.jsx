'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Search,
  Users,
  LayoutGrid,
  UserRound,
  Shield,
  LogOut,
  Plus,
  X,
  ArrowRight,
  Check,
  LoaderCircle,
  Menu,
  SlidersHorizontal,
  Target,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { Brand } from './brand';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
const empty = { tracks: [], teams: [], members: [], applications: [], openings: [] };
const split = (value) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
async function api(path, method = 'GET', body) {
  const response = await fetch(`/api/${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Something went wrong.');
  return result;
}
function Tags({ items = [] }) {
  return (
    <div className="tags">
      {items.map((item) => (
        <span key={item} className="tag">
          {item}
        </span>
      ))}
    </div>
  );
}
function Avatar({ name = '', large = false }) {
  return (
    <span className={`avatar ${large ? 'avatar-large' : ''}`}>
      {name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')}
    </span>
  );
}
function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <Target size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
function ProfileForm({ profile, onSave, busy }) {
  const [projects, setProjects] = useState(profile?.projects || []);
  return (
    <form
      className="profile-form"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSave({
          bio: data.get('bio'),
          preferred_role: data.get('preferred_role'),
          availability: data.get('availability'),
          skills: split(data.get('skills')),
          interests: split(data.get('interests')),
          discoverable: data.get('discoverable') === 'on',
          projects,
        });
      }}
    >
      <div className="form-section">
        <span className="form-section-number">01</span>
        <div>
          <h3>The essentials</h3>
          <p>A little context makes a better connection.</p>
        </div>
      </div>
      <label>
        About you
        <textarea
          name="bio"
          defaultValue={profile?.bio || ''}
          placeholder="What do you enjoy building? What would you bring to a team?"
          minLength={10}
          maxLength={2000}
          rows={4}
          required
        />
      </label>
      <div className="form-columns">
        <label>
          Preferred role
          <Input
            name="preferred_role"
            defaultValue={profile?.preferred_role || ''}
            placeholder="e.g. Backend developer"
            minLength={2}
            maxLength={80}
            required
          />
        </label>
        <label>
          Best time to collaborate
          <select name="availability" defaultValue={profile?.availability || 'Evenings'}>
            {['Mornings', 'Evenings', 'Weekends', 'Flexible'].map((time) => (
              <option key={time}>{time}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Your skills
        <Input
          name="skills"
          defaultValue={profile?.skills?.join(', ') || ''}
          placeholder="python, mongodb, react"
          maxLength={614}
        />
        <span className="field-hint">
          Separate with commas. Up to 15 skills; names are saved in lowercase.
        </span>
      </label>
      <label>
        Interests
        <Input
          name="interests"
          defaultValue={profile?.interests?.join(', ') || ''}
          placeholder="Climate tech, open source, accessibility"
          maxLength={334}
        />
        <span className="field-hint">Up to 8 interests, separated by commas.</span>
      </label>
      <div className="form-section">
        <span className="form-section-number">02</span>
        <div>
          <h3>Things you’ve made</h3>
          <p>Optional projects that show how you think.</p>
        </div>
      </div>
      {projects.map((project, index) => (
        <fieldset className="project-editor" key={index}>
          <legend>Project {index + 1}</legend>
          <label>
            Title
            <Input
              value={project.title}
              required
              minLength={2}
              maxLength={80}
              onChange={(e) =>
                setProjects(
                  projects.map((p, i) => (i === index ? { ...p, title: e.target.value } : p))
                )
              }
            />
          </label>
          <label>
            Description
            <textarea
              value={project.description}
              required
              minLength={5}
              maxLength={500}
              onChange={(e) =>
                setProjects(
                  projects.map((p, i) => (i === index ? { ...p, description: e.target.value } : p))
                )
              }
            />
          </label>
          <label>
            Link (optional)
            <Input
              type="url"
              value={project.url}
              onChange={(e) =>
                setProjects(
                  projects.map((p, i) => (i === index ? { ...p, url: e.target.value } : p))
                )
              }
            />
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setProjects(projects.filter((_, i) => i !== index))}
          >
            Remove project
          </Button>
        </fieldset>
      ))}
      {projects.length < 5 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setProjects([...projects, { title: '', description: '', url: '' }])}
        >
          <Plus size={16} /> Add a project
        </Button>
      )}
      <label className="checkbox-label">
        <input type="checkbox" name="discoverable" defaultChecked={profile?.discoverable ?? true} />
        <span>
          Make my profile discoverable
          <small>You’ll appear in teammate search when you’re not already in a team.</small>
        </span>
      </label>
      <Button disabled={busy} type="submit">
        {busy ? 'Saving…' : 'Save your profile'} <ArrowUpRight size={17} />
      </Button>
    </form>
  );
}
export default function Dashboard({ user: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();
  const menuClose = useRef(null);
  const [data, setData] = useState(empty),
    [profile, setProfile] = useState(null),
    [admin, setAdmin] = useState(null),
    [page, setPage] = useState(user.role === 'admin' ? 'Overview' : 'Explore'),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [filter, setFilter] = useState(''),
    [track, setTrack] = useState(''),
    [modal, setModal] = useState(null),
    [results, setResults] = useState(null),
    [requiredSkills, setRequiredSkills] = useState([]),
    [mobile, setMobile] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 761px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setMobile(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  useEffect(() => {
    if (mobile) menuClose.current?.focus();
  }, [mobile]);
  const reload = useCallback(async () => {
    const [teams, own, identity] = await Promise.all([api('teams'), api('profiles'), api('me')]);
    if (identity.user) setUser(identity.user);
    setData(teams);
    setProfile(own.profile);
    if (user.role === 'admin') setAdmin(await api('admin'));
    setLoaded(true);
  }, [user.role]);
  useEffect(() => {
    reload().catch((e) => {
      setError(e.message);
    });
  }, [reload]);
  useEffect(() => {
    const refresh = () => {
      if (!busy && document.visibilityState === 'visible')
        reload().catch((e) => setError(e.message));
    };
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 5000);
    return () => {
      window.removeEventListener('focus', refresh);
      window.clearInterval(timer);
    };
  }, [reload, busy]);
  async function run(
    task,
    { close = false, refresh = true, message = 'Saved successfully.' } = {}
  ) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await task();
      if (refresh) await reload();
      if (close) setModal(null);
      setNotice(result?.message || message);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const membership = data.members.find((m) => m.user_id === user.id),
    team = data.teams.find((t) => t.id === membership?.team_id),
    captain = Boolean(membership?.is_captain),
    opening = data.openings.find((o) => Number(o.team_id) === team?.id);
  const incomingInvitations = data.applications.filter(
    (a) => a.user_id === user.id && a.kind === 'invitation' && a.status === 'pending'
  );
  function inviteAction(person) {
    if (user.role !== 'participant') return null;
    if (!team)
      return (
        <Button variant="outline" disabled={busy} onClick={() => setModal({ type: 'create' })}>
          Create a team to invite
        </Button>
      );
    if (!captain) return <p className="field-hint">Your team captain can invite participants.</p>;
    const existing = data.applications.find(
      (a) => a.team_id === team.id && String(a.user_id) === person.user_id
    );
    if (existing?.kind === 'application' && existing.status === 'pending')
      return (
        <Button
          variant="outline"
          onClick={() => {
            setModal(null);
            navigate('My team');
          }}
        >
          Review their application
        </Button>
      );
    if (existing)
      return (
        <p className="field-hint">
          {existing.kind === 'invitation' ? 'Invitation' : 'Application'} {existing.status}. See My
          team for details.
        </p>
      );
    if (!team.registration_open || team.slots <= 0)
      return (
        <p className="field-hint">
          {team.slots <= 0 ? 'Your team is full.' : 'Track registration is closed.'}
        </p>
      );
    return (
      <Button disabled={busy} onClick={() => setModal({ type: 'invite', person })}>
        Invite to {team.name} <Plus size={16} />
      </Button>
    );
  }
  const navigation =
    user.role === 'admin'
      ? [
          ['Overview', Shield],
          ['Explore', LayoutGrid],
          ['Find teammates', Search],
        ]
      : [
          ['Explore', LayoutGrid],
          ['Find teammates', Search],
          ['My team', Users],
          ['My profile', UserRound],
        ];
  function navigate(next) {
    setPage(next);
    setMobile(false);
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  async function searchMatches(params) {
    await run(
      async () => {
        const response = await api('matches?' + new URLSearchParams(params));
        setResults(response.results);
        setRequiredSkills(response.required_skills);
      },
      { refresh: false, message: 'Search updated.' }
    );
  }
  function openingForm(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run(
      () =>
        api('openings', 'POST', {
          team_id: team.id,
          title: form.get('title'),
          description: form.get('description'),
          required_skills: split(form.get('required_skills')),
          preferred_availability: form.get('preferred_availability'),
        }),
      { close: true }
    );
  }
  return (
    <div className="workspace">
      <aside id="workspace-navigation" className={`sidebar ${mobile ? 'sidebar-open' : ''}`}>
        <Brand />
        <button
          className="mobile-menu sidebar-close"
          ref={menuClose}
          aria-label="Close menu"
          onClick={() => setMobile(false)}
        >
          <X />
        </button>
        <span className="sidebar-section-label">YOUR WORKSPACE</span>
        <nav aria-label="Workspace">
          {navigation.map(([label, Icon]) => (
            <button
              key={label}
              className={page === label ? 'sidebar-link active' : 'sidebar-link'}
              onClick={() => navigate(label)}
            >
              <Icon size={19} />
              {label}
              {page === label && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="sidebar-note-symbol">✳</span>
          <p>
            Good ideas.
            <br />
            Better together.
          </p>
          <span>MAKE YOUR CONNECTION.</span>
        </div>
        <div className="sidebar-account">
          <Avatar name={user.name} />
          <div>
            <strong>{user.name}</strong>
            <span>{user.role === 'admin' ? 'Event administrator' : 'Participant'}</span>
          </div>
          <button
            title="Sign out"
            aria-label="Sign out"
            disabled={busy}
            onClick={() =>
              run(
                async () => {
                  await api('auth/logout', 'POST', {});
                  router.push('/');
                  router.refresh();
                },
                { refresh: false, message: '' }
              )
            }
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="workspace-body" inert={mobile || undefined}>
        <header className="workspace-topbar">
          <button
            className="mobile-menu"
            aria-label="Open menu"
            aria-expanded={mobile}
            aria-controls="workspace-navigation"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
          <div>
            <span>WORKSPACE</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{page}</strong>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => run(reload, { refresh: false, message: 'Workspace refreshed.' })}
          >
            <RefreshCw size={16} /> Refresh
          </Button>
          <span className="topbar-label">
            <i className="status-dot" /> DIFFERENT SKILLS. SHARED AMBITION.
          </span>
        </header>
        <main id="main" className="workspace-main">
          <div aria-live="polite">
            {notice && (
              <div className="success-message">
                <Check size={17} />
                {notice}
                <button aria-label="Dismiss notice" onClick={() => setNotice('')}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          {error && (
            <div className="error-message" role="alert">
              {error}
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => run(reload, { refresh: false, message: 'Workspace reloaded.' })}
              >
                Retry
              </Button>
            </div>
          )}
          {!loaded && error ? (
            <EmptyState title="Your workspace couldn’t load.">
              Use Retry above after the database services are available.
            </EmptyState>
          ) : !loaded ? (
            <div className="loading-state" role="status">
              <LoaderCircle className="spin" /> Loading your workspace…
            </div>
          ) : (
            <>
              {incomingInvitations.length > 0 && page !== 'My team' && (
                <div className="invitation-notice" role="status">
                  <p>
                    You have {incomingInvitations.length} pending team invitation
                    {incomingInvitations.length === 1 ? '' : 's'}.
                  </p>
                  <Button size="sm" onClick={() => navigate('My team')}>
                    View invitations <ArrowUpRight size={16} />
                  </Button>
                </div>
              )}
              {page === 'Explore' && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">
                        YOUR NEXT CHAPTER, {user.name.split(' ')[0].toUpperCase()}
                      </span>
                      <h1>
                        Find your starting point<span>.</span>
                      </h1>
                      <p>Explore the ideas. Find your people. Make something happen.</p>
                    </div>
                    {user.role === 'participant' && !membership && (
                      <Button disabled={busy} onClick={() => setModal({ type: 'create' })}>
                        Create a team <Plus size={17} />
                      </Button>
                    )}
                  </div>
                  {user.role === 'participant' && !profile && (
                    <div className="onboarding-banner">
                      <span className="banner-symbol">↗</span>
                      <div>
                        <h2>Let your next team find you.</h2>
                        <p>
                          Add your skills and a little about yourself to appear in teammate
                          discovery.
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => navigate('My profile')}>
                        Build your profile <ArrowUpRight size={16} />
                      </Button>
                    </div>
                  )}
                  <div className="section-heading">
                    <h2>Teams with a direction</h2>
                    <span>{data.teams.length} TEAMS</span>
                  </div>
                  <div className="filter-bar">
                    <div className="search-input">
                      <Search size={18} />
                      <Input
                        aria-label="Search teams"
                        placeholder="Search by team, idea, or required skill…"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      />
                    </div>
                    <div className="track-select">
                      <SlidersHorizontal size={16} />
                      <select
                        aria-label="Filter by track"
                        value={track}
                        onChange={(e) => setTrack(e.target.value)}
                      >
                        <option value="">All tracks</option>
                        {data.tracks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="team-grid">
                    {data.teams
                      .filter((t) => {
                        const brief = data.openings.find((o) => Number(o.team_id) === t.id);
                        return (
                          (!track || t.track_id === Number(track)) &&
                          `${t.name} ${t.idea} ${brief?.required_skills?.join(' ') || ''}`
                            .toLowerCase()
                            .includes(filter.toLowerCase())
                        );
                      })
                      .map((t, index) => {
                        const brief = data.openings.find((o) => Number(o.team_id) === t.id);
                        return (
                          <Card key={t.id} className="team-card">
                            <div className={`team-card-art art-${index % 4}`} aria-hidden="true">
                              <span>{['✳', '◎', '↗', '⌁'][index % 4]}</span>
                              <small>BUILD SOMETHING THAT MATTERS</small>
                            </div>
                            <CardHeader>
                              <div className="card-kicker">
                                <span>{t.track_name}</span>
                                <span
                                  className={
                                    t.slots > 0 && t.registration_open
                                      ? 'availability-badge'
                                      : 'availability-badge unavailable'
                                  }
                                >
                                  {!t.registration_open
                                    ? 'Closed'
                                    : t.slots > 0
                                      ? `${t.slots} open slots`
                                      : 'Full'}
                                </span>
                              </div>
                              <CardTitle>{t.name}</CardTitle>
                              <CardDescription>{t.idea}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="looking-for">
                                <span>LOOKING FOR</span>
                                <strong>{brief?.title || 'Recruitment brief coming soon'}</strong>
                              </div>
                              <Tags items={brief?.required_skills} />
                              <div className="team-card-footer">
                                <span>
                                  <Users size={15} /> {t.member_count}/{t.max_members} members
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setModal({ type: 'view', team: t, opening: brief })
                                  }
                                >
                                  View team <ArrowUpRight size={16} />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                  {!data.teams.length && (
                    <EmptyState title="The first move is yours.">
                      There are no teams yet. Create one to get things started.
                    </EmptyState>
                  )}
                  {data.teams.length > 0 &&
                    !data.teams.some(
                      (t) =>
                        (!track || t.track_id === Number(track)) &&
                        `${t.name} ${t.idea} ${data.openings.find((o) => Number(o.team_id) === t.id)?.required_skills?.join(' ') || ''}`
                          .toLowerCase()
                          .includes(filter.toLowerCase())
                    ) && (
                      <EmptyState title="No teams match those filters.">
                        Try a different search or track.
                      </EmptyState>
                    )}
                  <div className="section-heading spaced">
                    <h2>Choose your challenge</h2>
                    <span>{data.tracks.length} TRACKS</span>
                  </div>
                  <div className="track-grid">
                    {data.tracks.map((t, i) => (
                      <button
                        className="track-tile"
                        key={t.id}
                        onClick={() => {
                          setTrack(String(t.id));
                          setFilter('');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <span className="track-tile-symbol" aria-hidden="true">
                          {['✳', '⌁', '↗', '◎'][i % 4]}
                        </span>
                        <strong>{t.name}</strong>
                        <p>{t.description}</p>
                        <span className="track-tile-foot">
                          {t.registration_open ? 'Registration open' : 'Registration closed'}
                          <ArrowUpRight size={16} />
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {page === 'Find teammates' && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">COMPLEMENTARY SKILLS. COMMON GROUND.</span>
                      <h1>
                        Your missing piece<span>.</span>
                      </h1>
                      <p>Find available participants by the skills you need.</p>
                    </div>
                  </div>
                  <div className="match-search-panel">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        searchMatches({ skills: new FormData(e.currentTarget).get('skills') });
                      }}
                    >
                      <label htmlFor="match-skills">What skills are you looking for?</label>
                      <div className="match-search-row">
                        <Input
                          id="match-skills"
                          name="skills"
                          placeholder="e.g. python, mongodb"
                          maxLength={614}
                        />
                        <Button disabled={busy} type="submit">
                          {busy ? (
                            <LoaderCircle className="spin" size={18} />
                          ) : (
                            <Search size={18} />
                          )}{' '}
                          Find teammates
                        </Button>
                      </div>
                      <p className="field-hint">
                        Separate skills with commas. Leave blank to browse all available
                        participants.
                      </p>
                    </form>
                    {opening && (
                      <button
                        className="opening-shortcut"
                        disabled={busy}
                        onClick={() => searchMatches({ team_id: team.id })}
                      >
                        Use {team.name}’s requirements <ArrowUpRight size={16} />
                      </button>
                    )}
                  </div>
                  {requiredSkills.length > 0 && (
                    <div className="match-criteria">
                      <span>MATCHING AGAINST</span>
                      <Tags items={requiredSkills} />
                    </div>
                  )}
                  {results === null ? (
                    <EmptyState title="The right connection starts with a search.">
                      Tell us the skills your idea needs—or browse everyone available.
                    </EmptyState>
                  ) : (
                    <>
                      <div className="section-heading">
                        <h2>People to build with</h2>
                        <span>{results.length} RESULTS</span>
                      </div>
                      <div className="people-grid">
                        {results.map((person) => (
                          <Card key={person.user_id} className="person-card">
                            <CardHeader>
                              <div className="person-card-top">
                                <Avatar name={person.name} large />
                                {person.total_required > 0 && (
                                  <span className="match-pill">
                                    {person.matched_count}/{person.total_required} skills
                                  </span>
                                )}
                              </div>
                              <CardTitle>{person.name}</CardTitle>
                              <span className="person-role">{person.preferred_role}</span>
                              <CardDescription>{person.bio}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Tags items={person.skills} />
                              <div className="person-meta">
                                <span>{person.availability}</span>
                                <button
                                  className="text-link"
                                  onClick={() => setModal({ type: 'person', person })}
                                >
                                  View profile <ArrowUpRight size={16} />
                                </button>
                              </div>
                              {inviteAction(person)}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {!results.length && (
                        <EmptyState title="No discoverable participants right now.">
                          Check back after other participants complete their profiles or leave their
                          teams.
                        </EmptyState>
                      )}
                      <p className="results-note">
                        Ranked by shared required skills. This measures skill overlap, not a
                        prediction of team success. Showing up to 100 profiles.
                      </p>
                    </>
                  )}
                </>
              )}
              {page === 'My profile' && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">LET YOUR WORK DO THE TALKING</span>
                      <h1>
                        What you bring<span>.</span>
                      </h1>
                      <p>Your next teammate wants to know more than your name.</p>
                    </div>
                    <Avatar name={user.name} large />
                  </div>
                  <div className="profile-layout">
                    <Card>
                      <CardContent>
                        <ProfileForm
                          key={profile?.updated_at || 'new'}
                          profile={profile}
                          busy={busy}
                          onSave={(input) =>
                            run(() => api('profiles', 'POST', input), {
                              message: 'Your profile is ready for discovery.',
                            })
                          }
                        />
                      </CardContent>
                    </Card>
                    <aside className="profile-advice">
                      <span>✳</span>
                      <h2>
                        Be specific.
                        <br />
                        Be yourself.
                      </h2>
                      <p>
                        “I build APIs with Python” tells a future teammate more than “I like
                        coding.”
                      </p>
                      <hr />
                      <h3>A few good details</h3>
                      <p>
                        List the tools you actually use. Share a project you enjoyed. Tell people
                        when you’re available.
                      </p>
                      <p>Your skills are used to find overlap with team requirements.</p>
                    </aside>
                  </div>
                </>
              )}
              {page === 'My team' && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">YOUR PEOPLE. YOUR NEXT BIG THING.</span>
                      <h1>
                        {team ? team.name : 'Start something together'}
                        <span>.</span>
                      </h1>
                      <p>
                        {team
                          ? team.idea
                          : 'Find a team to join, or give your own idea a starting point.'}
                      </p>
                    </div>
                    {team && <span className="large-track-badge">{team.track_name}</span>}
                  </div>
                  {!team ? (
                    <>
                      <EmptyState title="Your team starts here.">
                        Explore teams with open slots or create a team around your idea.
                      </EmptyState>
                      <div className="center-actions">
                        <Button onClick={() => setModal({ type: 'create' })}>
                          Create a team <Plus size={17} />
                        </Button>
                        <Button variant="outline" onClick={() => navigate('Explore')}>
                          Explore teams <ArrowRight size={17} />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="section-heading">
                        <h2>The crew</h2>
                        <span>
                          {team.member_count}/{team.max_members} MEMBERS
                        </span>
                      </div>
                      <div className="member-list">
                        {data.members.map((member) => (
                          <div className="member-row" key={member.user_id}>
                            <Avatar name={member.name} />
                            <div>
                              <strong>
                                {member.name}
                                {member.user_id === user.id ? ' (you)' : ''}
                              </strong>
                              <span>{member.is_captain ? 'Team captain' : 'Team member'}</span>
                            </div>
                            {captain && !member.is_captain && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={() => setModal({ type: 'transfer', member })}
                              >
                                Make captain
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="section-heading spaced">
                        <h2>Who you’re looking for</h2>
                        {captain && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModal({ type: 'opening' })}
                          >
                            {opening ? 'Edit requirements' : 'Add requirements'}
                            <Plus size={15} />
                          </Button>
                        )}
                      </div>
                      {opening ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>{opening.title}</CardTitle>
                            <CardDescription>{opening.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Tags items={opening.required_skills} />
                            <p className="field-hint">
                              Preferred collaboration time: {opening.preferred_availability}
                            </p>
                            <Button
                              variant="outline"
                              onClick={() => {
                                navigate('Find teammates');
                                searchMatches({ team_id: team.id });
                              }}
                            >
                              Find matching people <ArrowUpRight size={16} />
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <EmptyState title="Give your next teammate a brief.">
                          The captain can add a role and the skills the team needs.
                        </EmptyState>
                      )}
                      {captain && (
                        <>
                          <div className="section-heading spaced">
                            <h2>Applications & sent invitations</h2>
                          </div>
                          {!data.applications.some((a) => a.team_id === team.id) ? (
                            <EmptyState title="No applications yet.">
                              Add clear recruitment requirements so participants know how to
                              contribute.
                            </EmptyState>
                          ) : (
                            <div className="application-list">
                              {data.applications
                                .filter((a) => a.team_id === team.id)
                                .map((application) => (
                                  <div className="application-row" key={application.id}>
                                    <Avatar name={application.name} />
                                    <div>
                                      <strong>{application.name}</strong>
                                      <p>
                                        {application.kind === 'invitation'
                                          ? 'Invitation sent · '
                                          : 'Application · '}
                                        {application.message}
                                      </p>
                                      <span className={`status status-${application.status}`}>
                                        {application.status}
                                      </span>
                                    </div>
                                    {application.status === 'pending' &&
                                      application.kind === 'invitation' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={busy}
                                          onClick={() =>
                                            run(
                                              () =>
                                                api('applications', 'PATCH', {
                                                  id: application.id,
                                                  action: 'withdraw',
                                                }),
                                              { message: 'Invitation cancelled.' }
                                            )
                                          }
                                        >
                                          Cancel invitation
                                        </Button>
                                      )}
                                    {application.status === 'pending' &&
                                      application.kind !== 'invitation' && (
                                        <div className="row-actions">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={busy}
                                            onClick={() =>
                                              run(
                                                () =>
                                                  api('applications', 'PATCH', {
                                                    id: application.id,
                                                    action: 'reject',
                                                  }),
                                                { message: 'Application rejected.' }
                                              )
                                            }
                                          >
                                            Reject
                                          </Button>
                                          <Button
                                            size="sm"
                                            disabled={busy}
                                            onClick={() =>
                                              run(
                                                () =>
                                                  api('applications', 'PATCH', {
                                                    id: application.id,
                                                    action: 'accept',
                                                  }),
                                                { message: 'Your team has a new member.' }
                                              )
                                            }
                                          >
                                            Accept <Check size={15} />
                                          </Button>
                                        </div>
                                      )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}
                      <div className="team-danger-zone">
                        <div>
                          <h3>{captain ? 'Close this chapter' : 'Leave this team'}</h3>
                          <p>
                            {captain
                              ? 'Deleting the team frees its members and removes its applications.'
                              : 'You can apply to other teams after leaving.'}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          disabled={busy}
                          onClick={() => setModal({ type: captain ? 'delete' : 'leave' })}
                        >
                          {captain ? 'Delete team' : 'Leave team'}
                        </Button>
                      </div>
                    </>
                  )}
                  <div className="section-heading spaced">
                    <h2>Your invitations & applications</h2>
                  </div>
                  {data.applications.filter((a) => a.user_id === user.id).length ? (
                    <div className="application-list">
                      {data.applications
                        .filter((a) => a.user_id === user.id)
                        .map((application) => (
                          <div className="application-row" key={application.id}>
                            <div>
                              <button
                                className="text-link"
                                onClick={() => {
                                  const target = data.teams.find(
                                    (t) => t.id === application.team_id
                                  );
                                  if (target)
                                    setModal({
                                      type: 'view',
                                      team: target,
                                      opening: data.openings.find(
                                        (o) => Number(o.team_id) === target.id
                                      ),
                                    });
                                }}
                              >
                                {application.team_name} <ArrowUpRight size={15} />
                              </button>
                              <p>
                                {application.kind === 'invitation'
                                  ? 'Team invitation · '
                                  : 'Your application · '}
                                {application.message}
                              </p>
                              <span className={`status status-${application.status}`}>
                                {application.status}
                              </span>
                            </div>
                            {application.status === 'pending' &&
                              application.kind === 'invitation' && (
                                <div className="row-actions">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() =>
                                      run(
                                        () =>
                                          api('applications', 'PATCH', {
                                            id: application.id,
                                            action: 'reject',
                                          }),
                                        { message: 'Invitation declined.' }
                                      )
                                    }
                                  >
                                    Decline
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={busy || Boolean(membership)}
                                    onClick={() =>
                                      run(
                                        () =>
                                          api('applications', 'PATCH', {
                                            id: application.id,
                                            action: 'accept',
                                          }),
                                        { message: 'Invitation accepted. Welcome to your team!' }
                                      )
                                    }
                                  >
                                    Accept invitation <Check size={15} />
                                  </Button>
                                </div>
                              )}
                            {application.status === 'pending' &&
                              application.kind !== 'invitation' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() =>
                                    run(
                                      () =>
                                        api('applications', 'PATCH', {
                                          id: application.id,
                                          action: 'withdraw',
                                        }),
                                      { message: 'Application withdrawn.' }
                                    )
                                  }
                                >
                                  Withdraw
                                </Button>
                              )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="muted-copy">
                      No invitations or applications yet. Find a team to apply to, or make your
                      profile discoverable so captains can invite you.
                    </p>
                  )}
                </>
              )}
              {page === 'Overview' && admin && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">KEEP THE WHOLE PICTURE IN VIEW</span>
                      <h1>
                        A little more perspective<span>.</span>
                      </h1>
                      <p>Manage tracks and see how the hackathon is coming together.</p>
                    </div>
                    <Button onClick={() => setModal({ type: 'track' })}>
                      Add a track <Plus size={17} />
                    </Button>
                  </div>
                  <div className="metrics-grid">
                    {[
                      ['Participants', admin.totals.participants, UserRound],
                      ['Teams formed', admin.totals.teams, Users],
                      ['Pending applications', admin.totals.pending, ArrowUpRight],
                    ].map(([label, value, Icon]) => (
                      <Card key={label} className="metric-card">
                        <span>
                          {label}
                          <Icon size={20} />
                        </span>
                        <strong>{value}</strong>
                      </Card>
                    ))}
                  </div>
                  <div className="section-heading spaced">
                    <h2>Tracks & registration</h2>
                    <span>ADMIN CONTROLS</span>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <caption className="sr-only">Track registration and team statistics</caption>
                      <thead>
                        <tr>
                          <th>Track</th>
                          <th>Teams</th>
                          <th>Members in teams</th>
                          <th>Team limit</th>
                          <th>Registration</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admin.tracks.map((t) => (
                          <tr key={t.id}>
                            <th scope="row">{t.name}</th>
                            <td>{t.team_count}</td>
                            <td>{t.participant_count}</td>
                            <td>{t.max_members}</td>
                            <td>
                              <span
                                className={
                                  t.registration_open
                                    ? 'availability-badge'
                                    : 'availability-badge unavailable'
                                }
                              >
                                {t.registration_open ? 'Open' : 'Closed'}
                              </span>
                            </td>
                            <td>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  run(() => api('admin', 'POST', { action: 'toggle', id: t.id }), {
                                    message: 'Registration updated.',
                                  })
                                }
                              >
                                {t.registration_open ? 'Close' : 'Reopen'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
          <footer className="workspace-footer">
            <span>GOOD IDEAS NEED GREAT TEAMS.</span>
            <span>HACKMATCH ↗</span>
          </footer>
        </main>
      </div>
      {modal && (
        <Modal
          title={
            {
              create: 'Start your team',
              view: modal.team?.name,
              person: modal.person?.name,
              invite: `Invite ${modal.person?.name}`,
              opening: 'Your recruitment brief',
              track: 'Create a track',
              delete: 'Delete this team?',
              leave: 'Leave this team?',
              transfer: 'Transfer captaincy?',
            }[modal.type]
          }
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {modal.type === 'create' && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                run(
                  () =>
                    api('teams', 'POST', {
                      name: form.get('name'),
                      idea: form.get('idea'),
                      track_id: Number(form.get('track_id')),
                    }),
                  {
                    close: true,
                    message: 'Team created. Add recruitment requirements from My team.',
                  }
                );
              }}
            >
              <p className="muted-copy">
                You’ll become the captain. Add a recruitment brief after creating your team.
              </p>
              <label>
                Team name
                <Input name="name" minLength={2} maxLength={80} required />
              </label>
              <label>
                Track
                <select name="track_id" required defaultValue="">
                  <option value="" disabled>
                    Choose an open track
                  </option>
                  {data.tracks
                    .filter((t) => t.registration_open)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} · up to {t.max_members} members
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Your idea
                <textarea
                  name="idea"
                  minLength={10}
                  maxLength={2000}
                  required
                  rows={4}
                  placeholder="What do you want to build?"
                />
              </label>
              <Button
                disabled={busy || !data.tracks.some((t) => t.registration_open)}
                type="submit"
              >
                Create team <ArrowUpRight size={17} />
              </Button>
            </form>
          )}
          {modal.type === 'view' && (
            <div className="form-stack">
              <span className="eyebrow">
                {modal.team.track_name} / {modal.team.member_count} OF {modal.team.max_members}{' '}
                MEMBERS
              </span>
              <p>{modal.team.idea}</p>
              {modal.opening && (
                <>
                  <h3>{modal.opening.title}</h3>
                  <p>{modal.opening.description}</p>
                  <Tags items={modal.opening.required_skills} />
                  <span className="field-hint">
                    Preferred collaboration time: {modal.opening.preferred_availability}
                  </span>
                </>
              )}
              {data.applications.some(
                (a) => a.team_id === modal.team.id && a.user_id === user.id
              ) ? (
                <Button
                  onClick={() => {
                    setModal(null);
                    navigate('My team');
                  }}
                >
                  Review your invitation or application
                </Button>
              ) : user.role === 'participant' &&
                !membership &&
                modal.team.slots > 0 &&
                Boolean(modal.team.registration_open) ? (
                <form
                  className="form-stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const message = new FormData(e.currentTarget).get('message');
                    run(() => api('applications', 'POST', { team_id: modal.team.id, message }), {
                      close: true,
                      message: 'Application sent. Track it in My team.',
                    });
                  }}
                >
                  <label>
                    What would you bring to the team?
                    <textarea name="message" minLength={5} maxLength={1000} required rows={3} />
                  </label>
                  <p className="field-hint">
                    One application per team. Rejected or withdrawn applications cannot be
                    resubmitted.
                  </p>
                  <Button type="submit" disabled={busy}>
                    Send application <ArrowUpRight size={17} />
                  </Button>
                </form>
              ) : (
                <p className="field-hint">
                  {membership
                    ? 'You already belong to a team.'
                    : user.role === 'admin'
                      ? 'Administrators can browse teams; participant accounts can apply.'
                      : 'This team is full or registration is closed.'}
                </p>
              )}
            </div>
          )}
          {modal.type === 'person' && (
            <div className="form-stack">
              <div className="person-modal-heading">
                <Avatar name={modal.person.name} large />
                <div>
                  <h3>{modal.person.preferred_role}</h3>
                  <span>{modal.person.availability}</span>
                </div>
              </div>
              <p>{modal.person.bio}</p>
              <Tags items={modal.person.skills} />
              {modal.person.interests.length > 0 && (
                <>
                  <h3>Interests</h3>
                  <Tags items={modal.person.interests} />
                </>
              )}
              {inviteAction(modal.person)}
              {modal.person.projects.map((project, index) => (
                <div className="project-preview" key={index}>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  {project.url && (
                    <a
                      className="text-link"
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View project <ArrowUpRight size={16} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          {modal.type === 'invite' && team && (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                const message = new FormData(event.currentTarget).get('message');
                run(
                  () =>
                    api('applications', 'POST', {
                      kind: 'invitation',
                      team_id: team.id,
                      user_id: Number(modal.person.user_id),
                      message,
                    }),
                  {
                    close: true,
                    message: 'Invitation sent. They can accept or decline it in My team.',
                  }
                );
              }}
            >
              <p>
                Invite {modal.person.name} to {team.name}. They’ll join only after accepting.
                Invitations do not reserve a slot.
              </p>
              <label>
                Message
                <textarea
                  name="message"
                  required
                  minLength={5}
                  maxLength={1000}
                  rows={4}
                  defaultValue={`We’d love to have you on ${team.name}. Your skills would be a great addition to our project.`}
                />
              </label>
              <Button type="submit" disabled={busy}>
                {busy ? 'Sending…' : 'Send invitation'} <ArrowUpRight size={16} />
              </Button>
            </form>
          )}
          {modal.type === 'opening' && (
            <form className="form-stack" onSubmit={openingForm}>
              <label>
                Role title
                <Input
                  name="title"
                  defaultValue={opening?.title || ''}
                  required
                  minLength={2}
                  maxLength={80}
                />
              </label>
              <label>
                What will they work on?
                <textarea
                  name="description"
                  defaultValue={opening?.description || ''}
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={4}
                />
              </label>
              <label>
                Required skills
                <Input
                  name="required_skills"
                  defaultValue={opening?.required_skills.join(', ') || ''}
                  required
                  placeholder="python, mongodb"
                />
                <span className="field-hint">Up to 15 skills, separated by commas.</span>
              </label>
              <label>
                Preferred collaboration time
                <select
                  name="preferred_availability"
                  defaultValue={opening?.preferred_availability || 'Evenings'}
                >
                  {['Mornings', 'Evenings', 'Weekends', 'Flexible'].map((time) => (
                    <option key={time}>{time}</option>
                  ))}
                </select>
              </label>
              <Button disabled={busy} type="submit">
                Save requirements <Check size={17} />
              </Button>
            </form>
          )}
          {modal.type === 'track' && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                run(
                  () =>
                    api('admin', 'POST', {
                      name: form.get('name'),
                      description: form.get('description'),
                      max_members: Number(form.get('max_members')),
                    }),
                  { close: true }
                );
              }}
            >
              <label>
                Track name
                <Input name="name" minLength={2} maxLength={80} required />
              </label>
              <label>
                Description
                <textarea name="description" minLength={5} maxLength={2000} required rows={3} />
              </label>
              <label>
                Maximum members per team
                <Input name="max_members" type="number" min={2} max={8} defaultValue={4} required />
              </label>
              <Button disabled={busy} type="submit">
                Create track <Plus size={17} />
              </Button>
            </form>
          )}
          {['delete', 'leave', 'transfer'].includes(modal.type) && (
            <div className="form-stack">
              <p>
                {modal.type === 'delete'
                  ? 'This removes the team, its applications, and recruitment brief. Members become available to join another team.'
                  : modal.type === 'leave'
                    ? 'Your place will become available and you can apply to another team.'
                    : `${modal.member.name} will become captain. You’ll remain a regular member.`}
              </p>
              <div className="row-actions">
                <Button variant="outline" disabled={busy} onClick={() => setModal(null)}>
                  Cancel
                </Button>
                <Button
                  variant={modal.type === 'transfer' ? 'default' : 'destructive'}
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        modal.type === 'delete'
                          ? api('teams', 'DELETE', { team_id: team.id })
                          : api(
                              'membership',
                              'POST',
                              modal.type === 'transfer'
                                ? { action: 'transfer', user_id: modal.member.user_id }
                                : { action: 'leave' }
                            ),
                      {
                        close: true,
                        message:
                          modal.type === 'delete'
                            ? 'Team deleted.'
                            : modal.type === 'leave'
                              ? 'You left the team.'
                              : 'Captaincy transferred.',
                      }
                    )
                  }
                >
                  Confirm {modal.type === 'transfer' ? 'transfer' : modal.type}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

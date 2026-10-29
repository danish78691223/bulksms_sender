import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowDownToLine, CheckCircle2, ContactRound, FileText, LayoutDashboard, MessageSquareText, Plus, RefreshCw, Send, Settings, ShieldCheck, Users } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'https://bulksms-sender.onrender.com').trim().replace(/\\/+$/, '').replace(/\\/api$/i, '');
const getToken = () => localStorage.getItem('sms_token') || '';
const api = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
};
function readCsv(text) {
  const rows = text.split(/\r?\n/).filter(Boolean).map(line => line.split(',').map(s => s.trim().replace(/^"|"$/g, '')));
  if (!rows.length) return [];
  const first = rows[0].map(s => s.toLowerCase());
  const hasHeader = first.some(s => ['name','phone','mobile','number','telephone'].includes(s));
  const data = hasHeader ? rows.slice(1) : rows;
  const nameIndex = hasHeader ? Math.max(0, first.findIndex(s => s === 'name')) : 0;
  const phoneIndex = hasHeader ? first.findIndex(s => ['phone','mobile','number','telephone'].includes(s)) : 1;
  return data.map(row => ({ name: row[nameIndex] || '', phone: row[phoneIndex >= 0 ? phoneIndex : 0] || '' })).filter(c => c.phone);
}
export default function App() {
  const [token, setToken] = useState(getToken());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [section, setSection] = useState('Overview');
  const [contacts, setContacts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [name, setName] = useState('Festival Offer');
  const [message, setMessage] = useState('Namaste {{name}}! Hamari shop par special festival offers available hain. Aaj hi visit karein.');
  const [templateId, setTemplateId] = useState('');
  const [senderHeader, setSenderHeader] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [query, setQuery] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const filtered = useMemo(() => contacts.filter(c => `${c.name} ${c.phone}`.toLowerCase().includes(query.toLowerCase())), [contacts, query]);

  async function refresh() {
    if (!getToken()) return;
    const [c, p] = await Promise.all([api('/api/contacts'), api('/api/campaigns')]);
    setContacts(c.contacts || []); setCampaigns(p.campaigns || []);
  }
  useEffect(() => { if (token) refresh().catch(e => setError(e.message)); }, [token]);
  async function authSubmit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify({ email, password, displayName: 'Shop Owner' }) });
      localStorage.setItem('sms_token', result.token); setToken(result.token); setNotice('Signed in successfully.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function importCsv() {
    if (!csvFile) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const rows = readCsv(await csvFile.text());
      const result = await api('/api/contacts/import', { method: 'POST', body: JSON.stringify({ source: 'csv', contacts: rows }) });
      setNotice(`${result.imported} contacts imported/updated; ${result.skipped} skipped. Imported contacts remain consent-unknown.`);
      await refresh();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function createCampaign(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice(''); setPreview(null);
    try {
      const result = await api('/api/campaigns', { method: 'POST', body: JSON.stringify({ name, message, templateId, senderHeader }) });
      const p = await api(`/api/campaigns/${result.campaign._id}/preview`, { method: 'POST', body: '{}' });
      setPreview(p); setNotice('Campaign draft saved. Real SMS sending is disabled until provider and compliance setup is complete.');
      await refresh();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function logout() { localStorage.removeItem('sms_token'); setToken(''); setContacts([]); setCampaigns([]); }
  if (!token) return <main className="auth-page"><div className="auth-card"><div className="brand-mark"><MessageSquareText /></div><p className="eyebrow">WEBXWHALE MESSAGING</p><h1>{mode === 'login' ? 'Welcome back' : 'Create owner account'}</h1><p className="muted">Manage your contacts and prepare SMS campaigns.</p>
    <form onSubmit={authSubmit} className="stack"><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength="10" autoComplete={mode==='login'?'current-password':'new-password'} /></label><button className="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button></form>
    {error && <p className="error">{error}</p>}<button className="text-button" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'First time? Create account':'Already registered? Sign in'}</button><p className="tiny">Starter note: add registration abuse protection and account recovery before public deployment.</p></div></main>;

  const nav = [{name:'Overview', icon:LayoutDashboard},{name:'Contacts',icon:Users},{name:'Campaigns',icon:Send},{name:'Settings',icon:Settings}];
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><MessageSquareText /></div><div><strong>WEBXWHALE</strong><span>Bulk SMS</span></div></div><p className="nav-label">WORKSPACE</p>{nav.map(n=><button key={n.name} className={`nav-item ${section===n.name?'active':''}`} onClick={()=>{setSection(n.name);setPreview(null);}}><n.icon size={18}/>{n.name}</button>)}<div className="side-bottom"><div className="secure-note"><ShieldCheck size={18}/><span>Consent-first campaigns</span></div><button className="nav-item" onClick={logout}>Sign out</button></div></aside>
    <main className="main"><header className="topbar"><div><p className="eyebrow">SHOP OWNER WORKSPACE</p><h1>{section}</h1></div><button className="secondary" onClick={()=>refresh().catch(e=>setError(e.message))}><RefreshCw size={16}/> Refresh</button></header>
      {error && <div className="alert danger"><AlertTriangle size={18}/>{error}<button onClick={()=>setError('')}>×</button></div>}
      {notice && <div className="alert info"><CheckCircle2 size={18}/>{notice}<button onClick={()=>setNotice('')}>×</button></div>}
      {section==='Overview' && <><div className="hero"><div><p className="eyebrow light">CUSTOMER MESSAGING</p><h2>Reach your customers,<br/>responsibly.</h2><p>Import contacts, prepare festival offers, and review campaign eligibility before sending.</p><button className="white-button" onClick={()=>setSection('Campaigns')}><Plus size={16}/> Create campaign</button></div><div className="hero-art"><MessageSquareText size={90}/><span className="bubble bubble-one">Offer inside!</span><span className="bubble bubble-two">Namaste 👋</span></div></div>
        <div className="stat-grid"><Stat icon={Users} label="Total contacts" value={contacts.length} /><Stat icon={CheckCircle2} label="Consent opted-in" value={contacts.filter(c=>c.consentStatus==='opted_in').length}/><Stat icon={Send} label="Campaign drafts" value={campaigns.length}/><Stat icon={Activity} label="Delivered SMS" value="—" /></div>
        <div className="grid-two"><div className="panel"><PanelTitle icon={ContactRound} title="Import contacts" subtitle="Start with a CSV export from your contacts app"/><label className="upload-box"><ArrowDownToLine/><strong>{csvFile ? csvFile.name : 'Choose a CSV file'}</strong><span>Expected columns: name, phone</span><input type="file" accept=".csv,text/csv" onChange={e=>setCsvFile(e.target.files?.[0]||null)} hidden /></label><button className="primary full" disabled={!csvFile||busy} onClick={importCsv}>Import contacts</button><p className="tiny">Imported contacts default to unknown consent and cannot be counted as eligible.</p></div><div className="panel"><PanelTitle icon={ShieldCheck} title="Before you send" subtitle="Promotional SMS readiness"/><Checklist text="Sender and business registration confirmed with provider"/><Checklist text="Approved DLT template and sender header configured"/><Checklist text="Valid consent and opt-out checks in place"/><Checklist text="Provider delivery reports and webhook verification tested"/><p className="tiny">Live sending is disabled in this starter until these items are implemented and verified.</p></div></div>
        <div className="panel"><PanelTitle icon={FileText} title="Recent campaigns" subtitle="Latest drafts and status"/>{campaigns.length===0?<Empty text="No campaigns yet. Create your first campaign to see it here."/>:<div className="table-wrap"><table><thead><tr><th>Campaign</th><th>Status</th><th>Recipients</th><th>Created</th></tr></thead><tbody>{campaigns.slice(0,5).map(c=><tr key={c._id}><td>{c.name}</td><td><span className="pill">{c.status}</span></td><td>{c.eligibleCount||0} eligible</td><td>{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</div></>}
      {section==='Contacts' && <div className="panel"><div className="panel-head"><PanelTitle icon={Users} title="Customer contacts" subtitle="Search imported contacts and review consent status"/><input className="search" placeholder="Search name or phone…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Source</th><th>Promotional consent</th><th>Added</th></tr></thead><tbody>{filtered.map(c=><tr key={c._id}><td>{c.name||'—'}</td><td>{c.phone}</td><td><span className="pill">{c.source}</span></td><td><span className={`status ${c.consentStatus}`}>{c.consentStatus.replace('_',' ')}</span></td><td>{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>{filtered.length===0&&<Empty text="No contacts found. Import a CSV from Overview to begin."/>}<p className="tiny">Google OAuth and Android companion imports require configuration; CSV import is available now.</p></div>}
      {section==='Campaigns' && <div className="grid-two campaign-layout"><div className="panel"><PanelTitle icon={Send} title="Create campaign" subtitle="Promotional SMS draft"/><form className="stack" onSubmit={createCampaign}><label>Campaign name<input value={name} onChange={e=>setName(e.target.value)} maxLength="120" required/></label><label>Approved DLT template ID<input value={templateId} onChange={e=>setTemplateId(e.target.value)} placeholder="Enter after provider approval"/></label><label>Sender header<input value={senderHeader} onChange={e=>setSenderHeader(e.target.value)} placeholder="Registered sender header"/></label><label>Message<textarea value={message} onChange={e=>setMessage(e.target.value)} rows="6" maxLength="2000" required/></label><div className="message-meta"><span>{message.length} characters</span><span>SMS segments depend on encoding and provider rules</span></div><button className="primary" disabled={busy}>{busy?'Saving…':'Save draft & preview'}</button></form></div><div className="panel"><PanelTitle icon={MessageSquareText} title="Message preview" subtitle="Illustrative preview; final content must match the approved template"/><div className="phone-preview"><div className="phone-top"><span>Message</span><span>•••</span></div><div className="sms-bubble">{message.replaceAll('{{name}}','Rahul').replaceAll('{{shopName}}','Your Shop')||'Your message preview appears here.'}</div><p className="tiny">Check message variables and template approval before use.</p></div>{preview&&<div className="preview-results"><h3>Audience preview</h3><div className="mini-stats"><div><strong>{preview.totalContacts}</strong><span>Total</span></div><div><strong>{preview.eligibleCount}</strong><span>Eligible</span></div><div><strong>{preview.excludedCount}</strong><span>Excluded</span></div></div><div className="alert warning"><AlertTriangle size={17}/><span>{preview.note}</span></div><button className="secondary full" disabled title="Real SMS sending is disabled until the provider adapter and compliance checks are implemented">Sending disabled in starter</button></div>}</div></div>}
      {section==='Settings' && <div className="panel"><PanelTitle icon={Settings} title="Integrations & settings" subtitle="Configure these before production"/><div className="setting-row"><div className="setting-icon"><ContactRound/></div><div className="setting-copy"><strong>Google Contacts</strong><span>OAuth credentials and secure token storage required.</span></div><span className="pill">Not connected</span></div><div className="setting-row"><div className="setting-icon"><Users/></div><div className="setting-copy"><strong>Android phone contacts</strong><span>Use the Expo companion app; grant permission on device.</span></div><span className="pill">Companion app</span></div><div className="setting-row"><div className="setting-icon"><MessageSquareText/></div><div className="setting-copy"><strong>SMS provider</strong><span>Official provider adapter, DLT identifiers, and signed webhooks required.</span></div><span className="status unknown">Disabled</span></div><div className="setting-row"><div className="setting-icon"><ShieldCheck/></div><div className="setting-copy"><strong>Consent and suppression</strong><span>Imported contacts are unknown until consent evidence is recorded.</span></div><span className="status unknown">Review needed</span></div><p className="tiny">Never paste provider secrets into the browser. Configure server-side environment variables and follow the provider's official documentation.</p></div>}
      <footer>WEBXWHALE Bulk SMS <span>• Starter build • Promotional SMS safeguards enabled</span></footer>
    </main></div>;
}
function Stat({icon:Icon,label,value}){return <div className="stat-card"><div className="stat-icon"><Icon size={19}/></div><span>{label}</span><strong>{value}</strong></div>}
function PanelTitle({icon:Icon,title,subtitle}){return <div className="panel-title"><div className="panel-title-icon"><Icon size={19}/></div><div><h3>{title}</h3><p>{subtitle}</p></div></div>}
function Checklist({text}){return <div className="check-row"><CheckCircle2 size={17}/><span>{text}</span></div>}
function Empty({text}){return <div className="empty-state"><Users size={28}/><p>{text}</p></div>}

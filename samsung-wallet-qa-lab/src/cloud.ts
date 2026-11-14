export {};
/** Supabase Auth + Data API, using a public publishable key and per-user RLS. No service key. */
type Config = { url?: string; publishableKey?: string };
declare global { interface Window { WALLET_QA_CLOUD?: Config } }
const config = window.WALLET_QA_CLOUD || {};
const statusElement = document.querySelector<HTMLDivElement>('#status')!;
const privateArea = document.querySelector<HTMLDivElement>('#private')!;
const logout = document.querySelector<HTMLButtonElement>('#logout')!;
const elt = (id: string) => document.getElementById(id) as HTMLInputElement;
const value = (id: string) => elt(id).value.trim();
const show = (message: string, error = false) => { statusElement.textContent = message; statusElement.className = error ? 'cloud-error' : 'cloud-ok'; };
const key = config.publishableKey;
const base = config.url?.replace(/\/$/, '');
let token = sessionStorage.getItem('walletqa_access_token') || '';
let ownerId = '';
async function request(path: string, method = 'GET', body?: object) {
  if (!base || !key) throw new Error('Supabase environment is not configured. See README.md.');
  const response = await fetch(`${base}${path}`, {method, headers: {'apikey':key, ...(token ? {'Authorization': `Bearer ${token}`} : {}), ...(body ? {'Content-Type':'application/json', 'Prefer':'return=representation'} : {})}, ...(body ? {body:JSON.stringify(body)} : {})});
  const text = await response.text();let parsed: unknown;
  try { parsed = text ? JSON.parse(text) : null; } catch { throw new Error(`Non-JSON API response (${response.status})`); }
  if (!response.ok) {const detail = parsed && typeof parsed === 'object' && 'message' in parsed ? String(parsed.message) : `HTTP ${response.status}`;throw new Error(detail);}
  return parsed;
}
function escape(value: unknown): string { return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c)); }
async function checkAuth() {
  if (!token) { privateArea.hidden=true;logout.hidden=true;show('Sign in with a magic link to save cloud QA records.');return; }
  try {
    const user = await request('/auth/v1/user') as {id:string};ownerId=user.id;
    privateArea.hidden=false;logout.hidden=false;show('Authenticated. Your QA records are protected by owner-scoped Row Level Security.');await refresh();
  } catch { token='';ownerId='';sessionStorage.removeItem('walletqa_access_token');privateArea.hidden=true;logout.hidden=true;show('Session expired. Sign in again.',true); }
}
async function refresh() {
  try {
    const runs = await request('/rest/v1/wallet_qa_runs?select=test_case_id,status,device_model,created_at&order=created_at.desc&limit=15') as Array<Record<string,string>>;
    const defects = await request('/rest/v1/wallet_qa_defects?select=title,severity,created_at&order=created_at.desc&limit=15') as Array<Record<string,string>>;
    document.getElementById('run-records')!.innerHTML = runs.length ? runs.map(x=>`<div class="cloud-item">${escape(x.test_case_id)} — ${escape(x.status)} | ${escape(x.device_model)}</div>`).join('') : '<p class="cloud-small">No runs yet</p>';
    document.getElementById('defect-records')!.innerHTML = defects.length ? defects.map(x=>`<div class="cloud-item">[${escape(x.severity)}] ${escape(x.title)}</div>`).join('') : '<p class="cloud-small">No defects yet</p>';
  } catch(e) { show(`Could not load records: ${String(e)}`, true); }
}
// Supabase magic-link flow returns access_token and refresh_token in a fragment for implicit redirects.
const fragment = new URLSearchParams(location.hash.slice(1));
const incoming = fragment.get('access_token');
if (incoming) { token=incoming;sessionStorage.setItem('walletqa_access_token',token);history.replaceState(null,'',location.pathname+location.search); }
const errorDescription=fragment.get('error_description');
if (errorDescription) {history.replaceState(null,'',location.pathname);show(`Sign in failed: ${errorDescription}`,true);}
document.getElementById('login-form')!.addEventListener('submit',async e=>{
  e.preventDefault();try {const email=value('email');await request('/auth/v1/otp?redirect_to='+encodeURIComponent(location.origin+location.pathname),'POST',{email,create_user:true});show('Magic link requested. Check your email, then return to this page.');} catch(err) {show(`Sign-in error: ${String(err)}`,true);}
});
logout.addEventListener('click',()=>{token='';ownerId='';sessionStorage.removeItem('walletqa_access_token');privateArea.hidden=true;logout.hidden=true;show('Signed out locally. For remote session revocation, sign out using the Supabase Auth API.');});
document.getElementById('run-form')!.addEventListener('submit',async e=>{
 e.preventDefault();if(!ownerId)return;
 try {await request('/rest/v1/wallet_qa_runs','POST',{owner_id:ownerId,test_case_id:value('case-id'),status:value('outcome'),device_model:value('device-model'),os_version:value('os-version'),app_build:value('app-build'),notes:value('run-notes')});show('Test run saved.');await refresh();}catch(err){show(`Save failed: ${String(err)}`,true);}
});
document.getElementById('defect-form')!.addEventListener('submit',async e=>{
 e.preventDefault();if(!ownerId)return;
 try {await request('/rest/v1/wallet_qa_defects','POST',{owner_id:ownerId,title:value('bug-title'),severity:value('severity'),repro_steps:value('repro'),expected_result:value('expected'),actual_result:value('actual'),sanitized_trace_id:value('trace-id')||null});show('Defect saved.');await refresh();}catch(err){show(`Save failed: ${String(err)}`,true);}
});
document.getElementById('refresh')!.addEventListener('click',refresh);
if (!base || !key) show('Cloud backend not yet configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in your Vercel build environment.',true);
else void checkAuth();

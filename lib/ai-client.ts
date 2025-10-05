"use server"

const PROXY_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'

export async function startInterviewProxy() {
  const url = `${PROXY_BASE}/api/ai-proxy/start`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) throw new Error('start proxy failed')
  return res.json()
}

export async function sendMessageProxy(session_id: string, message: string) {
  const url = `${PROXY_BASE}/api/ai-proxy/send`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, message })
  })
  if (!res.ok) throw new Error('send proxy failed')
  return res.json()
}

export async function getHistoryProxy(session_id: string, view = 'patient') {
  const url = `${PROXY_BASE}/api/ai-proxy/get-history?session_id=${encodeURIComponent(session_id)}&view=${encodeURIComponent(view)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`get-history failed: ${res.statusText}`);
  return res.json();
}

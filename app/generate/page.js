'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function GeneratePageInner() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('response')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    plan: 'pro',
    tenure: '',
    cancelReason: 'too_expensive',
    usageLevel: 'medium',
    mrr: '',
    productName: '',
    notes: ''
  })

  useEffect(() => {
    const match = document.cookie.match(/cha_user=([^;]+)/)
    if (match) {
      try { setUser(JSON.parse(decodeURIComponent(match[1]))) } catch(e) {}
    }
  }, [])

  const handleGenerate = async () => {
    if (!form.customerName || !form.tenure || !form.productName) {
      setError('Please fill in customer name, product name and tenure')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const token = document.cookie.match(/cha_token=([^;]+)/)?.[1] || ''
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, userId: user?.id })
      })
      const data = await res.json()
      if (data.error === 'limit_reached') { setError('limit_reached'); setLoading(false); return }
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setResult(data)
      setActiveTab('response')
    } catch(e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const COLOR = '#0891b2'

  const cancelReasons = [
    { value: 'too_expensive', label: 'Too expensive' },
    { value: 'not_using', label: "Not using it enough" },
    { value: 'missing_features', label: 'Missing features' },
    { value: 'switching_competitor', label: 'Switching to competitor' },
    { value: 'business_closed', label: 'Business closing/pivoting' },
    { value: 'budget_cuts', label: 'Budget cuts' },
    { value: 'technical_issues', label: 'Technical issues' },
    { value: 'other', label: 'Other' },
  ]

  const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box', background:'#fff' }
  const labelStyle = { fontSize:12, fontWeight:600, color:'#475569', marginBottom:4, display:'block' }

  if (error === 'limit_reached') return (
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'Inter,Arial,sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,maxWidth:400,textAlign:'center',border:'1px solid #e2e8f0'}}>
        <div style={{fontSize:40,marginBottom:16}}>⚡</div>
        <h2 style={{fontSize:18,fontWeight:800,color:'#0f172a',marginBottom:8}}>Free limit reached</h2>
        <p style={{fontSize:14,color:'#64748b',marginBottom:24}}>You've used your 3 free retention responses. Upgrade to keep saving customers.</p>
        <Link href="/billing" style={{display:'block',background:COLOR,color:'#fff',padding:'12px 24px',borderRadius:9,textDecoration:'none',fontWeight:700,fontSize:14,marginBottom:12}}>Upgrade now →</Link>
        <button onClick={() => setError('')} style={{background:'none',border:'none',color:'#94a3b8',fontSize:13,cursor:'pointer'}}>Maybe later</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,Arial,sans-serif'}}>
      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/dashboard" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <div style={{width:28,height:28,borderRadius:7,background:COLOR,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>C</div>
          <span style={{fontSize:14,fontWeight:800,color:'#0f172a'}}>ChurnShield</span>
        </Link>
        <Link href="/dashboard" style={{fontSize:13,color:'#64748b',textDecoration:'none'}}>← Dashboard</Link>
      </div>

      <div style={{maxWidth:960,margin:'0 auto',padding:'32px 20px'}}>
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'#0f172a',marginBottom:6}}>Save a cancelling customer</h1>
          <p style={{fontSize:14,color:'#64748b'}}>Fill in the details and get a personalised retention strategy in seconds.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns: result ? '1fr 1fr' : '1fr',gap:24}}>
          {/* Form */}
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
            <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:20}}>Customer Details</h2>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Customer Name *</label>
                <input style={inputStyle} placeholder="e.g. John Smith" value={form.customerName}
                  onChange={e => setForm({...form, customerName: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Customer Email</label>
                <input style={inputStyle} type="email" placeholder="john@company.com" value={form.customerEmail}
                  onChange={e => setForm({...form, customerEmail: e.target.value})} />
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Your Product Name *</label>
                <input style={inputStyle} placeholder="e.g. Acme SaaS" value={form.productName}
                  onChange={e => setForm({...form, productName: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Current Plan</label>
                <select style={inputStyle} value={form.plan}
                  onChange={e => setForm({...form, plan: e.target.value})}>
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Customer Tenure *</label>
                <input style={inputStyle} placeholder="e.g. 14 months" value={form.tenure}
                  onChange={e => setForm({...form, tenure: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Monthly Revenue (MRR)</label>
                <input style={inputStyle} placeholder="e.g. $99" value={form.mrr}
                  onChange={e => setForm({...form, mrr: e.target.value})} />
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Cancellation Reason</label>
                <select style={inputStyle} value={form.cancelReason}
                  onChange={e => setForm({...form, cancelReason: e.target.value})}>
                  {cancelReasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Usage Level</label>
                <select style={inputStyle} value={form.usageLevel}
                  onChange={e => setForm({...form, usageLevel: e.target.value})}>
                  <option value="high">High — uses it daily</option>
                  <option value="medium">Medium — uses it weekly</option>
                  <option value="low">Low — rarely logs in</option>
                  <option value="none">None — never onboarded</option>
                </select>
              </div>
            </div>

            <div style={{marginBottom:20}}>
              <label style={labelStyle}>Additional Context</label>
              <textarea style={{...inputStyle, height:80, resize:'vertical'}}
                placeholder="Any other info about this customer, previous support tickets, relationship history..."
                value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>

            {error && error !== 'limit_reached' && (
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:'#dc2626'}}>{error}</div>
            )}

            <button onClick={handleGenerate} disabled={loading}
              style={{width:'100%',background: loading ? '#67e8f9' : COLOR,color:'#fff',border:'none',borderRadius:9,padding:'13px 24px',fontSize:14,fontWeight:700,cursor: loading ? 'not-allowed' : 'pointer'}}>
              {loading ? '✨ Generating retention strategy...' : '🛡 Generate Retention Strategy'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
              <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:4}}>Retention Strategy</h2>
              <p style={{fontSize:12,color:'#94a3b8',marginBottom:16}}>Personalised for {result.customerName}</p>

              {/* Risk badge */}
              {result.churnRisk && (
                <div style={{
                  display:'inline-block',
                  background: result.churnRisk === 'high' ? '#fef2f2' : result.churnRisk === 'medium' ? '#fff7ed' : '#f0fdf4',
                  color: result.churnRisk === 'high' ? '#dc2626' : result.churnRisk === 'medium' ? '#d97706' : '#059669',
                  border: `1px solid ${result.churnRisk === 'high' ? '#fecaca' : result.churnRisk === 'medium' ? '#fed7aa' : '#bbf7d0'}`,
                  borderRadius:8, padding:'4px 12px', fontSize:12, fontWeight:700, marginBottom:16
                }}>
                  {result.churnRisk === 'high' ? '🔴 High churn risk' : result.churnRisk === 'medium' ? '🟡 Medium churn risk' : '🟢 Low churn risk'}
                </div>
              )}

              {/* Tabs */}
              <div style={{display:'flex',gap:6,marginBottom:16,borderBottom:'1px solid #f1f5f9',paddingBottom:8}}>
                {[
                  {key:'response', label:'📧 Email Response'},
                  {key:'offer', label:'🎁 Offer Strategy'},
                  {key:'talking', label:'💬 Talking Points'},
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    style={{padding:'6px 12px',borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',
                      background: activeTab === tab.key ? COLOR : '#f1f5f9',
                      color: activeTab === tab.key ? '#fff' : '#64748b'}}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'response' && result.emailResponse && (
                <div>
                  <div style={{background:'#f8fafc',borderRadius:8,padding:12,marginBottom:12}}>
                    <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',marginBottom:4}}>SUBJECT</div>
                    <div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>{result.emailResponse.subject}</div>
                  </div>
                  <div style={{background:'#f8fafc',borderRadius:8,padding:12,marginBottom:12,minHeight:180}}>
                    <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',marginBottom:8}}>EMAIL BODY</div>
                    <div style={{fontSize:13,color:'#334155',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{result.emailResponse.body}</div>
                  </div>
                  <button onClick={() => copy(`Subject: ${result.emailResponse.subject}\n\n${result.emailResponse.body}`)}
                    style={{width:'100%',background:COLOR,border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,color:'#fff',cursor:'pointer'}}>
                    {copied ? '✓ Copied!' : '📋 Copy Email'}
                  </button>
                </div>
              )}

              {activeTab === 'offer' && result.offerStrategy && (
                <div>
                  <div style={{background:'#f0fdfa',border:'1px solid #ccfbf1',borderRadius:8,padding:16,marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#0891b2',marginBottom:8}}>RECOMMENDED OFFER</div>
                    <div style={{fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:4}}>{result.offerStrategy.offer}</div>
                    <div style={{fontSize:13,color:'#64748b'}}>{result.offerStrategy.rationale}</div>
                  </div>
                  <div style={{background:'#f8fafc',borderRadius:8,padding:16,marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#94a3b8',marginBottom:8}}>WHEN TO USE THIS OFFER</div>
                    <div style={{fontSize:13,color:'#334155',lineHeight:1.6}}>{result.offerStrategy.timing}</div>
                  </div>
                  {result.offerStrategy.alternatives && (
                    <div style={{background:'#f8fafc',borderRadius:8,padding:16}}>
                      <div style={{fontSize:12,fontWeight:700,color:'#94a3b8',marginBottom:8}}>FALLBACK OPTIONS</div>
                      <div style={{fontSize:13,color:'#334155',lineHeight:1.6}}>{result.offerStrategy.alternatives}</div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'talking' && result.talkingPoints && (
                <div>
                  <div style={{background:'#f8fafc',borderRadius:8,padding:16,marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#94a3b8',marginBottom:12}}>KEY TALKING POINTS</div>
                    {result.talkingPoints.map((point, i) => (
                      <div key={i} style={{display:'flex',gap:10,marginBottom:10}}>
                        <div style={{width:20,height:20,borderRadius:'50%',background:COLOR,color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{i+1}</div>
                        <div style={{fontSize:13,color:'#334155',lineHeight:1.5}}>{point}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => copy(result.talkingPoints.map((p,i) => `${i+1}. ${p}`).join('\n'))}
                    style={{width:'100%',background:'#f1f5f9',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,color:'#475569',cursor:'pointer'}}>
                    {copied ? '✓ Copied!' : '📋 Copy Talking Points'}
                  </button>
                </div>
              )}

              <div style={{marginTop:16,padding:12,background:'#f0fdfa',borderRadius:8,border:'1px solid #ccfbf1'}}>
                <div style={{fontSize:11,fontWeight:700,color:COLOR,marginBottom:4}}>💡 RETENTION TIP</div>
                <div style={{fontSize:12,color:'#64748b',lineHeight:1.6}}>
                  Respond within 24 hours of cancellation intent. The first response has the highest chance of saving the customer.
                </div>
              </div>

              <Link href="/dashboard" style={{display:'block',marginTop:12,textAlign:'center',fontSize:13,color:'#94a3b8',textDecoration:'none'}}>
                View all cases →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  return <Suspense><GeneratePageInner /></Suspense>
}

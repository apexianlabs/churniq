import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, plan, tenure, cancelReason, usageLevel, mrr, productName, notes, userId } = body

    if (!customerName || !tenure || !productName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check usage limit
    if (userId) {
      const usageRes = await fetch(
        `${process.env.DB_API_URL}/usage/check?user_id=${userId}&product=churnshield`,
        { headers: { 'Authorization': `Bearer ${process.env.DB_API_KEY_CHURNSHIELD}` } }
      )
      const usage = await usageRes.json()
      if (!usage.allowed) {
        return NextResponse.json({ error: 'limit_reached', used: usage.used, limit: usage.limit }, { status: 403 })
      }
    }

    const reasonLabels = {
      too_expensive: 'the price is too high',
      not_using: "they're not using it enough to justify the cost",
      missing_features: "it's missing features they need",
      switching_competitor: "they're switching to a competitor",
      business_closed: "their business is closing or pivoting",
      budget_cuts: "they have budget cuts",
      technical_issues: "they've had technical issues",
      other: "unspecified reasons"
    }

    const usageLabels = {
      high: 'highly engaged — uses it daily',
      medium: 'moderately engaged — uses it weekly',
      low: 'low engagement — rarely logs in',
      none: 'never properly onboarded'
    }

    const prompt = `You are a SaaS retention expert. Generate a personalised retention strategy for a cancelling customer.

Customer Details:
- Name: ${customerName}${customerEmail ? ` (${customerEmail})` : ''}
- Product: ${productName}
- Current Plan: ${plan}
- Tenure: ${tenure}
- MRR: ${mrr || 'unknown'}
- Cancellation Reason: ${reasonLabels[cancelReason] || cancelReason}
- Usage Level: ${usageLabels[usageLevel] || usageLevel}
${notes ? `- Additional Context: ${notes}` : ''}

Generate a complete retention strategy. Respond ONLY with valid JSON:
{
  "churnRisk": "high|medium|low",
  "emailResponse": {
    "subject": "compelling subject line",
    "body": "personalised email body addressing their specific reason for cancelling, empathetic and helpful tone, under 200 words"
  },
  "offerStrategy": {
    "offer": "specific retention offer e.g. 30% discount for 3 months",
    "rationale": "why this offer addresses their specific reason",
    "timing": "when to deploy this offer in the conversation",
    "alternatives": "2-3 fallback options if primary offer is rejected"
  },
  "talkingPoints": [
    "point 1 addressing their specific concern",
    "point 2 highlighting value they may be overlooking",
    "point 3 specific to their usage pattern",
    "point 4 future roadmap or upcoming feature if relevant"
  ]
}

Rules:
- Be specific to their cancellation reason — don't use generic retention language
- For low/no usage: focus on re-onboarding offer, not discount
- For too expensive: offer discount but also reframe value per day/week
- For missing features: acknowledge honestly, offer roadmap visibility or workaround
- For switching competitor: don't badmouth competitor, focus on differentiation
- Email should sound human, written by the founder/CEO not a support bot`

    const aiRes = await fetch(`${process.env.AI_API_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ task: 'generate_retention_response', inputs: { prompt } })
    })

    if (!aiRes.ok) {
      const errData = await aiRes.json().catch(() => ({}))
      throw new Error(errData.message || errData.error || 'AI generation failed')
    }

    const aiData = await aiRes.json()
    const resultData = aiData.data || aiData.result || aiData.content || {}

    let parsed
    try {
      if (resultData.churnRisk || resultData.emailResponse) {
        parsed = resultData
      } else if (resultData.raw_response) {
        const clean = resultData.raw_response.replace(/```json|```/g, '').trim()
        parsed = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean)
      } else {
        parsed = resultData
      }
      if (!parsed.emailResponse) throw new Error('No email response in result')
    } catch(e) {
      throw new Error('Failed to parse AI response: ' + e.message)
    }

    // Save to DB
    if (userId) {
      await fetch(`${process.env.DB_API_URL}/db/churnshield/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_CHURNSHIELD}` },
        body: JSON.stringify({
          user_id: userId,
          title: `${customerName} — ${plan} — ${cancelReason}`,
          result_data: { ...parsed, customerName, customerEmail, plan, tenure, cancelReason, usageLevel, mrr, productName },
          status: 'active'
        })
      })

      // Track usage
      await fetch(`${process.env.DB_API_URL}/usage/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_CHURNSHIELD}` },
        body: JSON.stringify({ user_id: userId, product: 'churnshield', action: 'generate_retention_response' })
      })
    }

    return NextResponse.json({ ...parsed, customerName, plan, cancelReason })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

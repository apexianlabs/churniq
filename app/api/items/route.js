import { NextResponse } from 'next/server'
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    if (!user_id) return NextResponse.json({ data: [] })
    const res = await fetch(
      `${process.env.DB_API_URL}/db/churnshield/items?user_id=${user_id}&order_by=created_at&ascending=false`,
      { headers: { 'Authorization': `Bearer ${process.env.DB_API_KEY_CHURNSHIELD}` } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

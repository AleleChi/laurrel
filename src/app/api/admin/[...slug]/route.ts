import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth/session';
import { readAllEnquiries, updateEnquiryStatus } from '@/lib/db/enquiries';

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const session = getAdminSessionFromRequest(req);
  const secret = process.env.ADMIN_API_SECRET;
  const tokenHeader = req.headers.get('x-admin-token');
  const isDirectSecretCall = secret && tokenHeader === secret;

  if (!session && !isDirectSecretCall) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid administrator session or credentials required.' },
      { status: 401 }
    );
  }

  // Forward to Render backend if configured
  const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL;
  if (backendUrl) {
    try {
      const path = params.slug.join('/');
      const search = req.nextUrl.search;
      const target = `${backendUrl.replace(/\/$/, '')}/api/admin/${path}${search}`;

      const res = await fetch(target, {
        headers: {
          ...(secret ? { 'x-admin-token': secret } : {}),
        },
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err) {
      console.warn('[Admin API] Backend forward failed, falling back to local storage:', err);
    }
  }

  // Local fallback
  const action = params.slug[0];

  if (action === 'stats') {
    const all = await readAllEnquiries();
    return NextResponse.json({
      totalEnquiries: all.length,
      newEnquiries: all.filter((e) => e.status === 'new').length,
      reviewed: all.filter((e) => e.status === 'under_review').length,
      scheduled: all.filter((e) => e.status === 'accepted' || e.status === 'quoted').length,
      failedDeliveries: 0,
      pendingHandoffs: 0,
    });
  }

  if (action === 'enquiries') {
    const all = await readAllEnquiries();
    const status = req.nextUrl.searchParams.get('status');
    const service = req.nextUrl.searchParams.get('service');

    let filtered = all;
    if (status) filtered = filtered.filter((e) => e.status === status);
    if (service) filtered = filtered.filter((e) => e.services.includes(service as any));

    return NextResponse.json({ enquiries: filtered });
  }

  if (action === 'handoffs') {
    return NextResponse.json({ handoffs: [] });
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const session = getAdminSessionFromRequest(req);
  const secret = process.env.ADMIN_API_SECRET;
  const tokenHeader = req.headers.get('x-admin-token');
  const isDirectSecretCall = secret && tokenHeader === secret;

  if (!session && !isDirectSecretCall) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid administrator session required.' },
      { status: 401 }
    );
  }

  const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL;
  if (backendUrl) {
    try {
      const path = params.slug.join('/');
      const target = `${backendUrl.replace(/\/$/, '')}/api/admin/${path}`;
      const body = await req.json();

      const res = await fetch(target, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'x-admin-token': secret } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err) {
      console.warn('[Admin API] Backend forward failed:', err);
    }
  }

  // Local fallback
  if (params.slug[0] === 'enquiries' && params.slug[2] === 'status') {
    const id = params.slug[1];
    const { status, note, author } = await req.json();
    const actor = author || (session ? session.user.name : 'Administrator');
    const updated = await updateEnquiryStatus(id, status, actor, note);
    return NextResponse.json({ success: true, enquiry: updated });
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

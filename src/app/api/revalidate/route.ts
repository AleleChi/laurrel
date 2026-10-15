import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * LAURREL SERVICES — Authenticated Sanity On-Demand Revalidation Webhook
 *
 * Enables instant content updates on Netlify when editors publish in Sanity Studio,
 * eliminating the need to trigger a full site rebuild.
 *
 * Configured in Sanity Management -> API -> Webhooks:
 * URL: https://laurrel.netlify.app/api/revalidate
 * HTTP method: POST
 * Trigger on: Create, Update, Delete
 * Filter: _type in ["homeHero", "homeAbout", "homeServices", "homeOverlappingPlans", "aboutPage", "servicesPage", "contactPage", "siteSettings"]
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || req.headers.get('x-revalidate-secret');
    const expectedSecret = process.env.SANITY_REVALIDATE_SECRET || process.env.ADMIN_API_SECRET;

    // Secure authentication check
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ message: 'Invalid revalidation secret' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty or non-JSON body allowed for manual GET/POST pings
    }

    const docType = body?._type;
    const revalidatedPaths: string[] = [];

    // Revalidate paths based on modified Sanity document type
    if (!docType || docType.startsWith('home')) {
      revalidatePath('/');
      revalidatedPaths.push('/');
    }

    if (!docType || docType === 'aboutPage') {
      revalidatePath('/about');
      revalidatedPaths.push('/about');
    }

    if (!docType || docType === 'servicesPage') {
      revalidatePath('/services');
      revalidatedPaths.push('/services');
    }

    if (!docType || docType === 'contactPage') {
      revalidatePath('/contact');
      revalidatedPaths.push('/contact');
    }

    if (!docType || docType === 'siteSettings') {
      revalidatePath('/', 'layout');
      revalidatedPaths.push('/ (all layouts)');
    }

    // Revalidate shared cache tag
    revalidateTag('sanity');

    return NextResponse.json({
      revalidated: true,
      documentType: docType || 'all',
      paths: revalidatedPaths,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'Revalidation error', error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Allow manual browser test if authorized
  return POST(req);
}

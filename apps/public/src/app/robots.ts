import type { MetadataRoute } from 'next';

const BASE_URL = (process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://toolcairn.neurynae.com').trim().replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/login', '/signup', '/device'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

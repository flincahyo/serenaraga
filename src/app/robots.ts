import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/'], // Protect admin routes from indexing
    },
    sitemap: 'https://serenaraga.fit/sitemap.xml',
  };
}

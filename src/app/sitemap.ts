import { MetadataRoute } from 'next';

// Force static rendering so Googlebot always gets a fast, cacheable response.
// Dynamic new Date() every request prevents Vercel from caching the sitemap.
export const dynamic = 'force-static';

const LAST_MODIFIED = new Date('2025-04-24');

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://serenaraga.fit';

  return [
    {
      url: baseUrl,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/area/pijat-panggilan-jogja`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/area/pijat-panggilan-sleman`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/area/pijat-panggilan-bantul`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}

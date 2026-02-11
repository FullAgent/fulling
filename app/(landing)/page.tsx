import { LandingClient } from './_components/landing-client';

/**
 * Landing page — Server Component.
 *
 * Fetches the GitHub star count on the server with ISR caching (1 hour),
 * then passes it down to the client-side shell.
 */
export default async function LandingPage() {
  const starCount = await getStarCount();
  return <LandingClient starCount={starCount} />;
}

async function getStarCount(): Promise<number | null> {
  try {
    const res = await fetch('https://api.github.com/repos/FullAgent/fulling', {
      next: { revalidate: 3600 }, // ISR: revalidate every hour
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stargazers_count;
  } catch {
    return null;
  }
}

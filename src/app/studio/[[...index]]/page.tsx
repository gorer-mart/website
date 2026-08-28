import { StudioWrapper } from './StudioWrapper';

/**
 * The Studio shell is identical for every user — only the content inside it is
 * dynamic, and that loads client-side. Prerendering the shell means a Studio
 * refresh is served straight from the CDN instead of server-rendering on every
 * request, which is what `force-dynamic` was doing.
 */
export const dynamic = 'force-static';

export { metadata, viewport } from 'next-sanity/studio';

export default function StudioPage() {
  return <StudioWrapper />;
}

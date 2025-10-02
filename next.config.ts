import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'illusia.com.br' }, // Your own domain or project host
      { protocol: 'https', hostname: 'res.cloudinary.com' }, // Cloudinary image hosting
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google user content (Google Photos, etc.)
      { protocol: 'https', hostname: 'i.imgur.com' }, // Imgur direct image links
      { protocol: 'https', hostname: 'imgur.com' }, // Imgur main domain
      { protocol: 'https', hostname: 'images.unsplash.com' }, // Unsplash image CDN
      { protocol: 'https', hostname: 'pbs.twimg.com' }, // Twitter image CDN
      { protocol: 'https', hostname: 'ibb.co' }, // imgbb image hosting (short links)
      { protocol: 'https', hostname: 'i.ibb.co' }, // imgbb direct image links
      { protocol: 'https', hostname: 'cdn.discordapp.com' }, // Discord CDN for attachments
      { protocol: 'https', hostname: 'media.discordapp.net' }, // Discord CDN for media previews
      { protocol: 'https', hostname: 'imageshack.com' }, // Imageshack main domain
      { protocol: 'https', hostname: 'i.imageshack.com' }, // Imageshack direct image links
      { protocol: 'https', hostname: 'postimg.cc' }, // PostImage image hosting
      { protocol: 'https', hostname: 'i.postimg.cc' }, // PostImage direct image links
      { protocol: 'https', hostname: 'flickr.com' }, // Flickr main domain
      { protocol: 'https', hostname: 'live.staticflickr.com' }, // Flickr image CDN
      { protocol: 'https', hostname: 'tinypic.com' }, // TinyPic image hosting (now defunct)
      { protocol: 'https', hostname: 'i.pinimg.com' }, // Pinterest image CDN
      { protocol: 'https', hostname: 'static.wikia.nocookie.net' } // Fandom/Wikia static assets
    ],
  },
  webpack: (config, { dev }) => {
    // Mitigate sporadic ENOENT and missing chunk errors in dev by disabling persistent FS cache.
    // This trades a small perf hit for stability on some filesystems/paths with spaces.
    if (dev) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cfg = config as any;
      if (cfg.cache) {
        cfg.cache = false;
      }
    }
    return config;
  },
};

export default nextConfig;

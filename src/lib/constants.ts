import {
  sanitizeExternalUrl,
  sanitizeInternalRoute,
  sanitizeMailtoUrl,
} from './security';

export const PROFILE = {
  name: 'Eldion Ryan Godius',
  role: 'Software Engineering',
  email: 'nayrnoidle@gmail.com',
  githubUsername: 'ElXprogramming',
} as const;

export const ROUTES = {
  home: sanitizeInternalRoute('#'),
  about: sanitizeInternalRoute('#about'),
  skills: sanitizeInternalRoute('#skills'),
  projects: sanitizeInternalRoute('#projects'),
  contact: sanitizeInternalRoute('#contact'),
  inbox: sanitizeInternalRoute('#inbox'),
} as const;

export const EXTERNAL_LINKS = {
  github:
    sanitizeExternalUrl(`https://github.com/${PROFILE.githubUsername}`, ['github.com']) ?? '#',
  linkedin:
    sanitizeExternalUrl(
      'https://www.linkedin.com/in/eldion-ryan-godius-897064235',
      ['www.linkedin.com']
    ) ?? '#',
  gitCanvasLive:
    sanitizeExternalUrl('https://githubstatreadme.vercel.app/', ['githubstatreadme.vercel.app']) ?? '#',
  gitCanvasRepo:
    sanitizeExternalUrl(
      'https://github.com/ElXprogramming/GitCanvas',
      ['github.com']
    ) ?? '#',
  chessGameReviewLive:
    sanitizeExternalUrl('https://chessgamereview-two.vercel.app/', ['chessgamereview-two.vercel.app']) ?? '#',
  chessGameReviewRepo:
    sanitizeExternalUrl(
      'https://github.com/ElXprogramming/chess-game-review',
      ['github.com']
    ) ?? '#',
  declaraformLive:
    sanitizeExternalUrl('https://declaraform.netlify.app/', ['declaraform.netlify.app']) ?? '#',
  declaraformRepo:
    sanitizeExternalUrl(
      'https://github.com/ElXprogramming/declaration-form-filler',
      ['github.com']
    ) ?? '#',
  neurosortRepo:
    sanitizeExternalUrl(
      'https://github.com/ElXprogramming/neurosort',
      ['github.com']
    ) ?? '#',
  restaurantscraperRepo:
    sanitizeExternalUrl(
      'https://github.com/ElXprogramming/RestaurantScraper',
      ['github.com']
    ) ?? '#',
  mailto: sanitizeMailtoUrl(PROFILE.email),
} as const;

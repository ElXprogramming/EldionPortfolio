import {
  sanitizeExternalUrl,
  sanitizeInternalRoute,
  sanitizeMailtoUrl,
  sanitizeTelUrl,
} from './security';

export const PROFILE = {
  name: 'Eldion Ryan Godius',
  initials: 'EG',
  role: 'Software Engineering',
  headline: 'Software Engineering Student & Full-Stack Developer',
  institution: 'Universiti Malaysia Sabah',
  degree: 'Bachelor of Computer Science with Honours (Software Engineering)',
  location: 'Sabah, Malaysia',
  fullLocation: 'Universiti Malaysia Sabah, Kota Kinabalu, Sabah',
  email: 'nayrnoidle@gmail.com',
  phone: '0178201365',
  phoneDisplay: '017-820 1365',
  githubUsername: 'ElXprogramming',
} as const;

export const ROUTES = {
  home: sanitizeInternalRoute('#'),
  about: sanitizeInternalRoute('#about'),
  skills: sanitizeInternalRoute('#skills'),
  projects: sanitizeInternalRoute('#projects'),
  education: sanitizeInternalRoute('#education'),
  contact: sanitizeInternalRoute('#contact'),
  inbox: sanitizeInternalRoute('#inbox'),
  resume: sanitizeInternalRoute('/Eldion_Ryan_Godius_Resume.pdf'),
} as const;

export const EXTERNAL_LINKS = {
  github:
    sanitizeExternalUrl(`https://github.com/${PROFILE.githubUsername}`, ['github.com']) ?? '#',
  linkedin:
    sanitizeExternalUrl(
      'https://www.linkedin.com/in/eldion-ryan-godius-897064235',
      ['www.linkedin.com']
    ) ?? '#',
  declaraformLive:
    sanitizeExternalUrl('https://declaraform.netlify.app/', ['declaraform.netlify.app']) ?? '#',
  declaraformRepo:
    sanitizeExternalUrl(
      'https://github.com/ElXprogramming/declaration-form-filler',
      ['github.com']
    ) ?? '#',
  mailto: sanitizeMailtoUrl(PROFILE.email),
  tel: sanitizeTelUrl(PROFILE.phone),
} as const;

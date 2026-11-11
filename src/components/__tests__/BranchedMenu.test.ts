import { describe, expect, it } from 'vitest';
import type { BranchedMenuItem } from '../BranchedMenu';

describe('BranchedMenu item structures and navigation', () => {
  const testMenu: BranchedMenuItem[] = [
    {
      label: 'Navigation',
      children: [
        { value: 'hero', label: 'Home' },
        { value: 'about', label: 'About' },
        { value: 'skills', label: 'Skills' },
        { value: 'projects', label: 'Projects' },
        { value: 'education', label: 'Education' },
        { value: 'contact', label: 'Contact' }
      ]
    },
    {
      label: 'Connect',
      children: [
        { value: 'github', label: 'GitHub' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'email', label: 'Email' }
      ]
    }
  ];

  it('contains expected navigation section and children', () => {
    const navSection = testMenu.find(s => s.label === 'Navigation');
    expect(navSection).toBeDefined();
    expect(navSection?.children?.map(c => c.value)).toEqual([
      'hero',
      'about',
      'skills',
      'projects',
      'education',
      'contact'
    ]);
  });

  it('contains expected connect links', () => {
    const connectSection = testMenu.find(s => s.label === 'Connect');
    expect(connectSection).toBeDefined();
    expect(connectSection?.children?.map(c => c.value)).toEqual(['github', 'linkedin', 'email']);
  });

  it('finds active section index correctly', () => {
    const findSection = (activeVal: string) =>
      testMenu.findIndex(it => it.children?.some(kid => kid.value === activeVal));

    expect(findSection('hero')).toBe(0);
    expect(findSection('projects')).toBe(0);
    expect(findSection('github')).toBe(1);
    expect(findSection('non-existent')).toBe(-1);
  });
});

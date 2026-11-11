import { describe, expect, it } from 'vitest';
import React from 'react';
import { Home } from 'lucide-react';
import { type BranchedMenuItem } from '../BranchedMenu';
import { renderIcon } from '../../lib/branchedMenuUtils.tsx';

describe('BranchedMenu item structures and navigation', () => {
  const testMenu: BranchedMenuItem[] = [
    {
      label: 'Portfolio',
      children: [
        { value: 'hero', label: 'Home' },
        { value: 'about', label: 'About' },
        { value: 'skills', label: 'Skills' },
        { value: 'projects', label: 'Projects' },
        { value: 'education', label: 'Education' }
      ]
    }
  ];

  it('contains expected Portfolio section and children', () => {
    const portfolioSection = testMenu.find(s => s.label === 'Portfolio');
    expect(portfolioSection).toBeDefined();
    expect(portfolioSection?.children?.map(c => c.value)).toEqual([
      'hero',
      'about',
      'skills',
      'projects',
      'education'
    ]);
  });

  it('finds active section index correctly', () => {
    const findSection = (activeVal: string) =>
      testMenu.findIndex(it => it.children?.some(kid => kid.value === activeVal));

    expect(findSection('hero')).toBe(0);
    expect(findSection('projects')).toBe(0);
    expect(findSection('education')).toBe(0);
    expect(findSection('non-existent')).toBe(-1);
  });

  describe('renderIcon safety', () => {
    it('returns null for falsy icon', () => {
      expect(renderIcon(null)).toBeNull();
      expect(renderIcon(undefined)).toBeNull();
    });

    it('handles Lucide forwardRef icon objects without throwing', () => {
      const node = renderIcon(Home);
      expect(React.isValidElement(node)).toBe(true);
    });

    it('handles function components without throwing', () => {
      const CustomIcon = () => React.createElement('span', null, 'icon');
      const node = renderIcon(CustomIcon);
      expect(React.isValidElement(node)).toBe(true);
    });

    it('handles pre-instantiated React elements', () => {
      const element = React.createElement('svg');
      expect(renderIcon(element)).toBe(element);
    });

    it('safely handles non-array arbitrary objects by returning null instead of throwing', () => {
      expect(renderIcon({ invalid: 'shape' })).toBeNull();
      expect(renderIcon('plain string')).toBeNull();
      expect(renderIcon(123)).toBeNull();
    });
  });
});

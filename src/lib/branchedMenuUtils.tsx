import React, { isValidElement } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';

export const renderIcon = (icon: unknown): React.ReactNode => {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;

  // React component: function component or forwardRef object (e.g. Lucide icons, custom SVG components)
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))
  ) {
    const Component = icon as React.ComponentType<{ className?: string; size?: number }>;
    return <Component size={16} className="w-4 h-4 flex-shrink-0" />;
  }

  // Hugeicons icon array: Array of [tag, attributes] tuples
  if (Array.isArray(icon)) {
    return <HugeiconsIcon icon={icon as Parameters<typeof HugeiconsIcon>[0]['icon']} size={16} strokeWidth={1.8} />;
  }

  return null;
};

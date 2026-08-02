import { Mountain, Building2, Waves } from 'lucide-react';

/**
 * Verified project/case-study entries. Schema (fill only what's verified —
 * `location`/`date` are intentionally omitted below since they aren't
 * confirmed; add them per-entry once available, no component change needed):
 *   { id, title, context, responsibility, tools[], result: { value, label },
 *     icon, theme, location?, date? }
 */
export const projects = [
  {
    id: 'northern-highway-expansion',
    title: 'Northern Highway Expansion',
    context: 'Mountain Terrain',
    responsibility:
      'Executed controlled blasting and precise leveling for a 50 km highway stretch through rocky mountain passes.',
    tools: ['Blasting', 'Surveying', 'GPS'],
    result: { value: '50 km', label: 'Highway carved' },
    icon: Mountain,
    theme: 'sky',
  },
  {
    id: 'city-central-mall',
    title: 'City Central Mall',
    context: 'Commercial Layout',
    responsibility:
      'Managed the full site layout from initial blueprints to foundations using Civil 3D, ensuring millimeter-level precision.',
    tools: ['AutoCAD', 'Civil 3D', 'Supervision'],
    result: { value: '±1 mm', label: 'Layout precision' },
    icon: Building2,
    theme: 'emerald',
  },
  {
    id: 'river-dam-support-base',
    title: 'River Dam Support Base',
    context: 'Infrastructure',
    responsibility:
      'Coordinated logistics and heavy machinery placement on uneven riverside terrain with zero safety incidents.',
    tools: ['Logistics', 'Safety', 'Document Control'],
    result: { value: '0', label: 'Safety incidents' },
    icon: Waves,
    theme: 'amber',
  },
];

import { Ruler, Flame, Building2 } from 'lucide-react';

/**
 * Reverse-chronological work history. `theme` keys into the color treatment
 * defined in Experience.jsx (kept out of this file so data stays presentation-free).
 */
export const experience = [
  {
    id: 'survey-engineer-document-controller',
    role: 'Survey Engineer & Document Controller',
    company: 'Infrastructure Projects',
    location: 'Pakistan',
    startDate: '2020',
    endDate: 'Present',
    duration: '4+ yrs',
    description:
      'Leading land survey operations for large-scale infrastructure projects while managing document control — ensuring accurate records and seamless team communication using Oracle and MS Excel.',
    tags: ['Oracle', 'MS Excel', 'GPS Surveying'],
    icon: Ruler,
    theme: 'accent',
  },
  {
    id: 'blasting-supervisor',
    role: 'Blasting Supervisor',
    company: 'Mountain Construction Projects',
    location: 'Northern Mountains, PK',
    startDate: '2016',
    endDate: '2020',
    duration: '4 yrs',
    description:
      'Supervised controlled blasting operations on steep mountainous terrain, enabling major highway expansions through rocky passes with rigorous safety compliance and zero incidents.',
    tags: ['Safety Compliance', 'Mountain Terrain'],
    icon: Flame,
    theme: 'amber',
  },
  {
    id: 'civil-supervisor-drawing-expert',
    role: 'Civil Supervisor & Drawing Expert',
    company: 'Construction Division',
    location: 'Pakistan',
    startDate: '2012',
    endDate: '2016',
    duration: '4 yrs',
    description:
      'Managed site operations end-to-end — from Civil 3D and AutoCAD drawing interpretation to coordinating material logistics and teams for commercial and infrastructure projects.',
    tags: ['Civil 3D', 'AutoCAD', 'Site Management'],
    icon: Building2,
    theme: 'emerald',
  },
];

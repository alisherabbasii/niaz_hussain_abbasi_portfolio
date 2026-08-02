import { Ruler, HardHat, ClipboardList, Mountain } from 'lucide-react';

export const skillCategories = [
  {
    id: 'civil-engineering-survey',
    title: 'Civil Engineering & Survey',
    description: 'Civil 3D and AutoCAD drawing work, GPS-based survey, and precise site leveling.',
    icon: Ruler,
    theme: 'accent',
    skills: ['Civil 3D', 'AutoCAD', 'GPS Surveying', 'Construction Drawings', 'Site Leveling'],
  },
  {
    id: 'construction-supervision',
    title: 'Construction Supervision',
    description: 'On-site oversight of civil works and controlled blasting operations, with a zero-incident safety record.',
    icon: HardHat,
    theme: 'emerald',
    skills: ['Team Supervision', 'Safety Compliance', 'Controlled Blasting'],
  },
  {
    id: 'documentation-coordination',
    title: 'Documentation & Coordination',
    description: 'Maintaining accurate project records and team coordination through Oracle and Excel-based systems.',
    icon: ClipboardList,
    theme: 'violet',
    skills: ['Document Control', 'Oracle', 'MS Excel'],
  },
  {
    id: 'specialized-terrain',
    title: 'Specialized Terrain',
    description: 'Extreme-terrain experience across rocky, high-altitude, and erosion-prone sites.',
    icon: Mountain,
    theme: 'amber',
    skills: ['Rocky Terrains', 'High-Altitude Sites', 'Erosion Control', 'Trenching'],
  },
];

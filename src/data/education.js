/**
 * Verified education records only — do not add placeholder entries. The
 * Education section (src/sections/Education.jsx) renders nothing while this
 * array is empty, so a new verified entry is the only change needed to make
 * the section appear.
 *
 * Schema:
 *   {
 *     id: string,
 *     institution: string,
 *     credential: string,   // degree/diploma title
 *     field?: string,
 *     startDate?: string,
 *     endDate?: string,     // or 'Present'
 *     location?: string,
 *   }
 */
export const education = [];

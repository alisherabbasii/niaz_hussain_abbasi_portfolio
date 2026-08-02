/**
 * Verified professional certifications only — do not add placeholder or
 * illustrative entries. The Certifications section (src/sections/Certifications.jsx)
 * renders nothing while this array is empty, so a new verified entry is the
 * only change needed to make the section appear.
 *
 * Schema:
 *   {
 *     id: string,
 *     name: string,            // credential title
 *     issuer: string,          // issuing body
 *     issueDate: string,       // e.g. '2023' or '2023-06'
 *     expiryDate?: string,     // omit if it doesn't expire
 *     credentialId?: string,
 *     credentialUrl?: string,  // link to verify, if public
 *   }
 */
export const certifications = [];

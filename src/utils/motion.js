/**
 * Shared framer-motion primitives for the ui/ component layer. Existing
 * sections each declare their own near-identical fadeUp/stagger variants
 * inline (see docs/01-WEBSITE-AUDIT-AND-ROADMAP.md §10.2) — this is the
 * single source of truth for new code so the motion language doesn't drift.
 * Individual section files are left as-is for this session; migrating them
 * is a follow-up, not a requirement to use these.
 */

export const EASE_PREMIUM = [0.22, 1, 0.36, 1];

export const DURATION = {
  fast: 0.2,
  base: 0.45,
  slow: 0.7,
};

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_PREMIUM } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.base, ease: EASE_PREMIUM } },
};

export const stagger = (staggerChildren = 0.12, delayChildren = 0.05) => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

export const viewportOnce = { once: true, margin: '-80px' };

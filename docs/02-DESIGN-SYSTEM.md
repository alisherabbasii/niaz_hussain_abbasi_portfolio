# Design System — niazabbasi.com

**Scope of this session:** design foundation and reusable components only. No homepage section was redesigned or restructured; existing sections keep their current layouts, breakpoints, and content. This document defines the token layer and primitive component library that future sessions (including the Phase 1–5 roadmap in `docs/01-WEBSITE-AUDIT-AND-ROADMAP.md`) should build on instead of re-inventing per section.

---

## 1. Design Principles

1. **Precision over decoration.** The audience is civil engineers, site supervisors, and construction clients — the UI should read as accurate and considered, the same way a well-drafted survey does. Prefer a tight grid, consistent spacing, and restrained color over ornamental effects.
2. **One system, not per-section improvisation.** Every visual decision (a shadow, a radius, a color) should trace back to a token or a shared component class, not a one-off value invented inside a single section file.
3. **Accessible by default, not by exception.** Contrast, focus visibility, and reduced-motion support live in the base layer and the primitives themselves, so new UI inherits them automatically instead of relying on every author remembering to add them.
4. **Motion supports hierarchy, it doesn't perform.** Fade/slide-up on scroll, once — no bouncing, no looping, no attention-seeking animation. Everything respects `prefers-reduced-motion`.
5. **Extend, don't replace.** The existing slate + sky palette, Outfit/Inter type pairing, and card/shadow language were already cohesive (see audit §3). This system formalizes and completes it rather than starting over.

---

## 2. Color Tokens

Defined in `src/index.css` under `@theme`. Tailwind v4 auto-generates `bg-*`/`text-*`/`border-*`/`ring-*` utilities from each `--color-*` variable.

| Token | Value | Role |
|---|---|---|
| `--color-primary` | `#0f172a` (slate-900) | Body text, headings |
| `--color-primary-light` | `#1e293b` (slate-800) | Secondary dark surfaces |
| `--color-secondary` | `#f8fafc` (slate-50) | Page background |
| `--color-accent` | `#0ea5e9` (sky-500) | **Decorative only**: icons, gradients, badge fills, glows, backgrounds. ~2.8:1 on white — not AA-safe as text. |
| `--color-accent-dark` | `#0284c7` (sky-600) | Hover shade for decorative accent surfaces |
| `--color-accent-strong` | `#0369a1` (sky-700) | **AA-safe accent for text** (5.9:1 on white). Use for eyebrow labels, links, and any solid button background carrying white text. |
| `--color-accent-strong-dark` | `#075985` (sky-800) | Hover/active state for accent-strong |
| `--color-success` | `#10b981` (emerald-500) | Badge/IconBox `success` variant |
| `--color-warning` | `#f59e0b` (amber-500) | Badge/IconBox `warning` variant |
| `--color-danger` | `#f43f5e` (rose-500) | Badge/IconBox `danger` variant, form error states |

**Neutrals are Tailwind's stock slate scale** — no custom tokens were added for them, to avoid a parallel naming system for values Tailwind already provides. The usage rule (fixes audit §6.1):

| Class | Contrast on white | Use for |
|---|---|---|
| `text-slate-600` | ~7.6:1 | Primary secondary-text (body copy, descriptions) |
| `text-slate-500` | ~4.76:1 | Meta text, labels, captions — the **minimum** for real text content |
| `text-slate-400` | ~2.56:1 | **Decorative/icon color only.** Never real text on a light background. |

### Why `accent-strong` exists

The original single `--color-accent` (#0ea5e9) fails WCAG AA when used as text or as a background under white text — it was being used for exactly that in eyebrow labels (`text-accent` at 12px bold, ~2.8:1) and in `.btn-primary` (white text on `bg-accent`, ~2.8:1). Rather than dull down the brand color everywhere, `accent` stays vivid for decoration and `accent-strong` (a darker step, same hue family) carries text and button fills. This was applied to:
- `.btn-primary`, `.eyebrow`, `.link` (index.css)
- Navbar/Footer brand wordmark, Hero role subtitle, Contact "Get In Touch" eyebrow + "Let's talk." headline, and the eyebrow labels in About/Skills/Experience/WorkHighlights

**Known remaining gap:** Hero's bespoke "Start a Project" CTA uses a custom `from-accent to-sky-500` gradient with white text, not `.btn-primary` — it wasn't touched this session (it's section-specific decoration, and this session didn't redesign sections) but has the same contrast issue and should move to `accent-strong` (or a dedicated gradient built from AA-safe stops) in a future pass. Icon-on-accent-background combinations (e.g. white icons on `bg-accent` in Experience's timeline dots) also sit under the 3:1 non-text contrast minimum; lower severity, not addressed here.

---

## 3. Typography

- **Headings:** Outfit (`font-heading`), weights 400–900. Loaded via Google Fonts `@import` (unchanged this session — see audit §7.3 for the render-blocking follow-up).
- **Body:** Inter (`font-sans`), weights 300–700.
- All `h1`–`h6` get `font-heading text-primary font-bold tracking-tight` from the base layer automatically.

| Class | Size | Use |
|---|---|---|
| `.section-title` | `text-4xl` → `md:text-5xl` → `lg:text-[3.5rem]` | Every section's H2 |
| `.section-subtitle` | `text-base` → `md:text-lg`, slate-500 | Section-level supporting copy |
| `.eyebrow` | `text-xs font-bold uppercase tracking-[0.18em]`, accent-strong | Micro-label above a section title |
| `.link` | inherits body size, accent-strong, underline on hover | Inline text links |

Hero's H1 and other one-off display sizes remain section-specific (e.g. `text-5xl md:text-[4.75rem]`) — not tokenized, since only one element in the whole site uses that scale.

---

## 4. Spacing & Containers

- **Content width:** `max-w-7xl` (1280px), applied automatically to every `<section>` via the base-layer rule in `index.css`, and available as `<Container>` for non-`<section>` contexts (nav bars, footers).
- **Section padding:** `py-24 px-4 md:px-8 lg:px-16` — also global via the base `section` rule. New sections don't need to repeat this.
- **Card padding:** `p-6` default (`.card`), `p-8` for feature-weight panels (Contact's form/CTA panel).
- No new spacing scale was introduced — Tailwind's default 4px-based scale is used as-is throughout.

---

## 5. Radius & Shadow Scale

**Radius** uses Tailwind's default scale with a consistent semantic mapping (documented here, not enforced via new tokens):
- `rounded-xl` — buttons, inputs, chips
- `rounded-2xl` — cards, icon boxes (lg)
- `rounded-[2.5rem]` — large feature panels (Contact's outer panel, Hero's image frame)
- `rounded-full` — pills/badges, avatars

**Shadows** were consolidated into `@theme` tokens (`--shadow-xs` … `--shadow-xl`, `--shadow-accent`) in `index.css`, replacing ~15 duplicated inline `boxShadow` strings across Hero/About/Skills/Contact/Navbar (audit §10.5). Because Tailwind v4 lets a theme token override the built-in utility of the same name, `shadow-sm` / `shadow-md` / `shadow-lg` / `shadow-xl` now resolve to these values everywhere automatically.

```css
--shadow-xs: 0 1px 3px rgba(15,23,42,.04), inset 0 1px 0 rgba(255,255,255,.9);   /* resting cards, inputs */
--shadow-sm: 0 2px 8px rgba(15,23,42,.07), 0 1px 3px rgba(15,23,42,.04);         /* nav bar (scrolled), chips */
--shadow-md: 0 4px 16px rgba(15,23,42,.08), 0 1px 4px rgba(15,23,42,.05);        /* glass-card */
--shadow-lg: 0 8px 32px rgba(15,23,42,.1), 0 2px 8px rgba(15,23,42,.06);         /* hover elevation */
--shadow-xl: 0 24px 80px rgba(15,23,42,.14), 0 8px 24px rgba(15,23,42,.1);       /* hero image frame */
--shadow-accent: 0 8px 24px rgba(14,165,233,.35), 0 1px 3px rgba(15,23,42,.1);   /* primary button glow */
```

Existing per-section bespoke shadows (Hero's floating badges, WorkHighlights' hover glow, Personal's colored card glows) were left as inline values — they're intentionally unique per section, not shared UI, so tokenizing them wouldn't reduce duplication.

---

## 6. Components

All primitives live in `src/components/ui/` and are re-exported from `src/components/ui/index.js`.

| Component | Purpose |
|---|---|
| `Container` | `max-w-7xl` + responsive padding, for non-`<section>` contexts |
| `Section` | Semantic `<section>` + optional `SectionHeading` + scroll-stagger wrapper, for **new** sections |
| `SectionHeading` | Eyebrow + title + subtitle header block (replaces the copy-pasted pattern in About/Skills/Experience/WorkHighlights) |
| `Button` | `variant`: `primary` \| `outline` \| `ghost`; renders `<a>` if `href` is passed, else `<button>` |
| `Badge` | `variant`: `neutral` \| `accent` \| `success` \| `warning` \| `danger` \| `outline` \| `dark`; `size`: `sm` \| `md` |
| `Card` | Wraps `.card`; `accent` prop for the left-border-color treatment used in About; `hover` for the lift interaction |
| `IconBox` | Tinted rounded icon container (`tone`, `size`, `shape`) |
| `SocialLink` | Icon-only external link button; requires `label`; auto-applies `target="_blank" rel="noopener noreferrer"` only for real `https://` URLs (not placeholder `#` hrefs) |
| `Input` / `Textarea` | Label is mandatory and always paired via `htmlFor`/`id` (auto-generated with `useId` if no `id` given); supports `hint` and `error` with `aria-describedby`/`aria-invalid` |
| `SkipToContent` | Visually-hidden-until-focused link to `#main-content` |
| `Skeleton` | Loading placeholder (`text` \| `title` \| `circle` \| `block`); shimmer disabled under reduced motion |

Shared CSS-layer classes (`src/index.css`): `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.card`, `.section-title`, `.section-subtitle`, `.eyebrow`, `.link`, `.field-label`, `.field-input`, `.field-hint`, `.field-error`, `.skeleton`, `.glass-card`.

### What was and wasn't wired up this session

**Wired up** (concrete, verified integrations):
- `App.jsx` — `SkipToContent`, `<header>`/`<main id="main-content">` landmarks, `MotionConfig reducedMotion="user"`.
- `Navbar.jsx` — `aria-expanded`/`aria-controls` on the mobile menu toggle, shadow token instead of inline style.
- `Footer.jsx` — `SocialLink` for the three icon links.
- `Contact.jsx` — `Input`/`Textarea` for all three form fields (fixes the unassociated-label issue in audit §6.2).

**Not wired up** (primitives exist and are documented, but no existing section was migrated to them, per this session's "don't redesign sections" scope):
- `Section` / `SectionHeading` — About, Skills, Experience, WorkHighlights, Personal, Values, Contact all keep their current hand-rolled header markup. Migrating them is a pure refactor (identical visual output) recommended as the first task of the next session.
- `Card` / `IconBox` / `Badge` / `Button` — not retrofitted into existing section markup (About's highlight cards, Skills' category cards, Hero's badges, WorkHighlights' category pill, etc.) to avoid touching section-specific visuals this session. Use them for any *new* UI going forward.
- `Skeleton` — nothing on the site currently loads asynchronously; this is groundwork for the blog (audit §14).

---

## 7. Responsive Behavior

No breakpoint changes were made this session — the inconsistency documented in audit §5.1 (some sections switch to multi-column at `md:`, others at `lg:`) is unchanged and remains a Phase 1 item. `Container`/`Section` use the same `max-w-7xl` + `px-4 md:px-8 lg:px-16` pattern already established, so any new section built on them will be consistent with Hero/About/Contact's `lg:` convention specifically — if adopted, this effectively starts resolving §5.1 by making the *new* default match the majority-safe breakpoint, without touching the sections that already ship.

---

## 8. Accessibility Rules

- **Contrast:** all real text must hit 4.5:1 on its background (3:1 for ≥24px or ≥19px-bold text). Use `slate-500`+ for neutral text, `accent-strong` for accent-colored text — never `slate-400` or `accent` for text content.
- **Focus:** every interactive element gets a visible focus indicator. A global `:focus-visible` outline (`index.css` base layer) is the safety net; primitives (`Button`, `Input`, `Textarea`) layer their own `focus-visible:ring-*` on top.
- **Forms:** every field has a real `<label>` tied via `htmlFor`/`id`. Errors use `role="alert"` and `aria-invalid`/`aria-describedby`.
- **Landmarks:** `<header>` wraps the nav, `<main id="main-content">` is the skip-link target, `<footer>` was already correct.
- **Motion:** `MotionConfig reducedMotion="user"` (App.jsx) handles all framer-motion animation; a global `@media (prefers-reduced-motion: reduce)` block (index.css base layer) catches everything else (CSS transitions, `animate-pulse`, the skeleton shimmer, `scroll-smooth`).
- **Skip link:** first focusable element on the page, jumps past the nav to `#main-content`.

---

## 9. Animation Rules

- Centralized in `src/utils/motion.js`: `fadeUp`, `fadeIn`, `stagger()`, `EASE_PREMIUM` (`[0.22, 1, 0.36, 1]`), and `viewportOnce` (`{ once: true, margin: '-80px' }`). New code should import from here instead of re-declaring local variants.
- Existing sections keep their own locally-declared variants (near-identical to these) — not migrated this session, see audit §10.2. Consolidating them is safe, mechanical follow-up work.
- Animate on scroll **once** (`whileInView` + `viewport={{ once: true }}`), never on every scroll pass.
- No animation should be load-bearing for content visibility — everything must still be readable/usable with `prefers-reduced-motion: reduce` or JS disabled.

---

## 10. Usage Examples

**New section using `Section` + `SectionHeading`:**
```jsx
import { Section, Card, IconBox } from '../components/ui';
import { ShieldCheck } from 'lucide-react';

<Section
  id="example"
  eyebrow="Example"
  title="Section Title"
  subtitle="One sentence of supporting copy."
>
  <div className="grid md:grid-cols-3 gap-6 mt-12">
    <Card hover accent="accent" className="flex items-start gap-4">
      <IconBox icon={ShieldCheck} tone="accent" />
      <div>
        <h3 className="text-lg font-bold text-primary mb-1">Title</h3>
        <p className="text-sm text-slate-500">Description.</p>
      </div>
    </Card>
  </div>
</Section>
```

**Buttons:**
```jsx
import { Button } from '../components/ui';
import { ArrowRight } from 'lucide-react';

<Button href="#contact" icon={ArrowRight}>Start a Project</Button>
<Button variant="outline" href="#experience">View Experience</Button>
<Button variant="ghost" type="submit">Cancel</Button>
```

**Accessible form field:**
```jsx
import { Input, Textarea } from '../components/ui';

<Input id="name" label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
<Textarea id="message" label="Message" error={errors.message} value={message} onChange={(e) => setMessage(e.target.value)} />
```

**Badge:**
```jsx
import { Badge } from '../components/ui';

<Badge variant="success" dot>Available for new projects</Badge>
```

---

## 11. Validation

- `npm run lint` — 0 errors (previously 13, all `no-unused-vars`; fixed by removing unused `React` imports across all 11 component/section files and the two dead `lucide-react` icon imports + commented-out CV block in `Hero.jsx`).
- `npm run build` — succeeds. CSS bundle grew 70KB → 80KB (12.25KB gzipped) from the expanded token/component layer; JS bundle unchanged (369.5KB, no new runtime dependency was added).
- **Not done:** a live browser visual pass. Chrome browser automation was unavailable in this environment (same blocker noted in `docs/01-WEBSITE-AUDIT-AND-ROADMAP.md` §21) — verification here is lint/build success plus manual review of the JSX diffs, not a rendered check. A visual QA pass at 375/430/768/1024/1440px, with particular attention to the Contact form and mobile nav menu (both had real markup changes, not just token swaps), should be the first thing done with a browser attached.

---

## 12. File-by-File Change Summary

**New files:**
- `src/utils/cn.js` — minimal className-join helper (no new dependency)
- `src/utils/motion.js` — centralized framer-motion variants (`fadeUp`, `fadeIn`, `stagger`, `EASE_PREMIUM`, `viewportOnce`)
- `src/components/ui/{Container,Section,SectionHeading,Button,Badge,Card,IconBox,SocialLink,Input,Textarea,SkipToContent,Skeleton}.jsx` + `index.js` barrel

**Modified:**
- `src/index.css` — added `accent-strong`/`accent-strong-dark`/`success`/`warning`/`danger` color tokens, full shadow scale (`--shadow-xs`…`--shadow-xl`, `--shadow-accent`), `:focus-visible` base rule, global `prefers-reduced-motion` block, new `.btn-ghost`/`.eyebrow`/`.link`/`.field-*`/`.skeleton` component classes; existing `.btn-primary`/`.btn-outline`/`.card`/`.glass-card` repointed to the shadow tokens
- `src/App.jsx` — `MotionConfig`, `SkipToContent`, `<header>`/`<main id="main-content">` landmarks; removed unused `React` import
- `src/components/Navbar.jsx` — `aria-expanded`/`aria-controls` on mobile toggle, shadow token instead of inline style, brand accent → `accent-strong`; removed unused `React` import
- `src/sections/Footer.jsx` — social icons now use `SocialLink`; `text-slate-400` → `text-slate-500` on real text; brand accent → `accent-strong`
- `src/sections/Contact.jsx` — form fields now use `Input`/`Textarea` (fixes label association); eyebrow and headline accent → `accent-strong`; `text-slate-400` → `text-slate-500` on real text; removed unused `React` import
- `src/sections/Hero.jsx` — removed dead commented-out CV-download block and its two unused icon imports; role-subtitle accent → `accent-strong`; badge mini-labels `text-slate-400` → `text-slate-500`; removed unused `React` import
- `src/sections/Experience.jsx` — eyebrow and date-badge accent → `accent-strong`; `text-slate-400` → `text-slate-500` on real text; removed unused `React` import
- `src/sections/{About,Skills,WorkHighlights}.jsx` — eyebrow accent → `accent-strong`; removed unused `React` import
- `src/sections/Personal.jsx`, `src/sections/Values.jsx` — removed unused `React` import only (no other changes)

**Not changed:** section layouts, breakpoints, copy/content, `index.html`, the 893KB image/favicon, `.htaccess` — all explicitly out of scope for this session (see audit Phase 0/1 for those).

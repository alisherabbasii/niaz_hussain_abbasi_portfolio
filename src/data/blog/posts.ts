import type { BlogPostFrontmatter } from '../../features/blog/types';

/**
 * Hand-authored blog content, run through `normalizeBlogPost` by
 * `features/blog/content.ts` before anything renders. There's no CMS or
 * filesystem content pipeline behind this — see docs/NEXTJS-BLOG-REUSE-AUDIT.md,
 * which explicitly recommends against building admin/auth for a static
 * portfolio blog.
 */
export const BLOG_POSTS: BlogPostFrontmatter[] = [
  {
    title: 'Surveying Rocky Terrain: Lessons from Ten Years in the Field',
    slug: 'surveying-rocky-terrain-lessons',
    description:
      'What a decade of GPS surveying on mountainous, rock-heavy sites has taught me about preparation, instrument discipline, and knowing when to trust — or distrust — a reading.',
    date: '2026-06-18',
    author: 'Niaz Hussain Abbasi',
    category: 'Survey Engineering',
    tags: ['Survey Engineering', 'GPS Surveying', 'Field Work'],
    featured: true,
    content: `Every survey engineer learns the same lesson eventually: the terrain doesn't care about your schedule. On flat, cleared ground, a GPS survey is almost mechanical — set up, log, move on. On the mountain and rocky sites I've spent most of my career working, that same task can eat an entire day, and the readings you get back still need to be questioned before they're trusted.

## Preparation beats improvisation

The single biggest difference between a smooth survey day and a wasted one is what happened the night before. Before any crew moves onto a rocky slope, I want three things confirmed:

- Base station location checked against known control points, not just satellite lock
- Access routes walked or at least reviewed on recent imagery, not last season's
- A backup instrument on site, because rock dust and drops happen more often than anyone admits

Skipping any one of these has cost me a full day at some point in my career. It never costs less the second time.

## Reading the ground, not just the instrument

**Satellite geometry and signal multipath are the two things that quietly ruin a rocky-terrain survey.** Steep rock faces reflect GPS signals in ways that can produce a reading that looks confident and is simply wrong. I've trained every junior surveyor I've supervised to treat a suspiciously clean reading near a rock face with the same suspicion as an obviously bad one — cross-check with a second occupation, or a total station tie-in, before it goes into the record.

### A habit worth building

1. Occupy every critical point twice, at different times of day if the schedule allows
2. Compare against at least one independent method for anything feeding into a safety-critical calculation
3. Log environmental conditions alongside coordinates — wind, dust, and temperature swings all show up in the data eventually

*None of this is glamorous work, but it's the difference between a survey that holds up under a design review and one that quietly introduces error into everything built on top of it.*

## Equipment care in harsh conditions

Rock dust, temperature swings, and steep scrambles are hard on instruments in ways a flat urban site never tests. A GPS receiver or total station that's been dropped, baked in direct sun for hours, or caked in fine dust doesn't always fail obviously — sometimes it just drifts slightly out of calibration and keeps producing numbers that look plausible. That's the dangerous failure mode, not the dead battery.

- Calibration checks against a known point at the start of every session, not just after a suspected impact
- Storage and transport that actually protects the instrument on a rock scramble, not just a padded bag left in direct sun
- A logged maintenance history per instrument, so a pattern of drift shows up before it becomes a bad dataset

### Training juniors to trust the process, not the display

The newest surveyors on any crew I've supervised tend to trust whatever number the screen shows. Part of the job of a senior surveyor is teaching them not to — not out of paranoia, but because a display has no way of knowing when multipath, a knocked antenna, or a stale calibration has quietly compromised a reading. That skepticism has to be trained deliberately; it doesn't develop on its own from experience alone.

## Working with the design team

A survey dataset is only as useful as the design team's ability to trust it without re-verifying everything themselves. That trust gets built through consistency: the same control points referenced project after project, the same reporting format, and flagging uncertainty explicitly rather than presenting every number with equal confidence. **A surveyor who clearly marks a low-confidence reading is more valuable than one who never admits doubt.** Designers can work around a known gap. They can't work around a hidden one.

## Where the discipline pays off

Document control and survey accuracy are more connected than people outside the field usually assume. A coordinate that's off by centimeters on a rocky slope can turn into a real discrepancy once it's propagated through drawings, cut-and-fill calculations, and blasting layouts. The habits above aren't about being cautious for its own sake — they're about not passing a small, quiet error down the line to someone who has no way of catching it.

Ten years in, the tools have improved considerably. The discipline required to use them well hasn't changed at all.`,
  },
  {
    title: 'Why Document Control Is the Backbone of Every Project',
    slug: 'why-document-control-is-the-backbone',
    description:
      'Document control rarely gets credit when a project runs smoothly, and rarely escapes blame when it doesn’t. Here’s what the role actually protects, and why Oracle and Excel discipline still matters.',
    date: '2026-05-02',
    author: 'Niaz Hussain Abbasi',
    category: 'Document Control',
    tags: ['Document Control', 'Oracle', 'Project Management'],
    featured: true,
    content: `Ask most people on a construction site what a document controller does, and you'll get a shrug. Ask the same question after a revision mismatch has sent the wrong drawing to the field, and you'll get a very different answer.

## What the role actually protects

Document control isn't paperwork for its own sake. It's the mechanism that guarantees the person pouring concrete, laying rebar, or setting out a blasting pattern is working from the current, approved version of a drawing — not last month's, and not a version someone printed before a late-stage revision.

On projects I've supported, the document control function typically owns:

- Revision tracking across every discipline's drawing set
- Transmittal records: who received what, and when
- RFI (request for information) logging and closeout status
- Change management traceability back to an approved instruction

**None of these are exciting, and all of them are the reason a dispute six months later can be resolved with a paper trail instead of a guess.**

### Oracle and Excel, still doing the heavy lifting

A lot of newer platforms promise to replace spreadsheet-based document control entirely. In practice, most active sites I've worked on still run on a combination of Oracle-based project systems for the official record and disciplined Excel tracking for the day-to-day reality of who has what, right now. That combination works because it matches how field teams actually operate — Oracle enforces the formal process, Excel keeps pace with a fast-moving site.

The failure mode isn't the tools. It's inconsistency between them. A transmittal logged in Oracle but not reflected in the working tracker — or the reverse — is where confusion creeps in.

## The habit that prevents most problems

*Close the loop the same day, every time, without exception.*

If a drawing goes out, the log reflects it before the end of that shift. If a revision comes back, superseded copies are pulled from circulation immediately, not "by end of week." Small delays compound. A missed update on a Tuesday becomes a wrong drawing at a Friday pour.

## Training the next document controller

Most people who end up in document control arrive from another discipline — survey, civil supervision, design — rather than choosing it as a first career. That's usually a strength, not a gap, because they already understand why a wrong revision in the field matters. What they don't arrive with is the administrative discipline the role demands, and that has to be built deliberately.

- Shadow an existing controller through a full transmittal cycle before touching the log independently
- Walk through at least one real historical dispute and how the paper trail resolved it
- Practice the same-day close-out habit on low-stakes documents before it's tested under real schedule pressure

### What separates a good controller from an adequate one

An adequate document controller keeps the log accurate. A good one notices the pattern before it becomes a problem — the discipline that's consistently late with transmittal acknowledgements, the drawing set that keeps generating RFIs against the same clause, the revision that's been "in review" for two weeks longer than it should be. **That pattern recognition is the part of the role that can't be taught from a procedure manual; it comes from paying attention across enough projects to know what normal looks like.**

## When the paper trail becomes the deciding factor

Every experienced document controller eventually sees a dispute where the paper trail is the only thing that settles it — a claim about what was approved, when, and by whom, that no one's memory can be trusted to answer six months later. Those moments are rare, but they're the reason the daily discipline matters even when nothing appears to be going wrong. A transmittal log kept perfectly for a year and never once needed to prove anything still did its job; it just did it quietly.

## It's a trust function, not an admin function

Good document control means engineers, supervisors, and crews stop double-checking version numbers because they've learned they don't have to. That trust is earned slowly and lost instantly. It's also, in my experience, one of the most underrated skills a technical career can be built around — because everyone eventually needs it, and very few people are willing to do it with the necessary discipline.`,
  },
  {
    title: 'Mountain Blasting: A Zero-Incident Safety Record, Explained',
    slug: 'mountain-blasting-zero-incident-safety-record',
    description:
      'Supervising blasting operations on mountainous terrain leaves no room for improvisation. Here’s the layered approach behind a zero-incident record across high-risk sites.',
    date: '2026-03-14',
    author: 'Niaz Hussain Abbasi',
    category: 'Site Safety',
    tags: ['Site Safety', 'Blasting', 'Leadership'],
    content: `Blasting supervision is the part of my career where there's genuinely no margin for "close enough." A survey error gets corrected in a revision. A blasting error can hurt people. That difference shapes everything about how I approach it.

## Safety isn't a checklist, it's a sequence

Every blast on a mountainous or rocky site I've supervised follows the same layered sequence, and the sequence doesn't compress no matter how tight the schedule gets:

1. Site assessment and exclusion zone definition, confirmed against current survey data
2. Drilling pattern review against the geotechnical profile of that specific face
3. Charge calculation, independently checked by a second qualified person
4. Full clearance and headcount confirmation before any charge is armed
5. Post-blast inspection before anyone re-enters the zone

Removing or rushing any single step in that sequence is how "we've done this a hundred times" turns into an incident report.

## The exclusion zone is not negotiable

**The most common source of near-misses I've seen on other sites isn't the blast itself — it's someone inside the exclusion zone who shouldn't be.** Enforcing that boundary strictly, every single time, without exceptions for "just checking one thing," is the single highest-leverage safety decision on a blasting operation.

### What strict enforcement looks like in practice

- A visible, physically marked boundary — not just a radio call
- A named person responsible for headcount, separate from the blast lead
- No exceptions for schedule pressure, ever, from anyone

## Coordination is a safety function too

A zero-incident record isn't the result of one careful person. It's the result of survey, drilling, blasting, and supervision teams all working from the same current information — which is where document control and safety supervision quietly depend on each other. A blasting layout built on an outdated survey point is a safety problem wearing a paperwork disguise.

*Ten years without a blasting incident isn't luck. It's the same sequence, followed without shortcuts, on every single operation.*

## What I'd tell someone new to this work

Respect the sequence more than you respect the schedule. Every project I've worked on eventually forgives a delay. Very few forgive a shortcut taken on a blasting site.`,
  },
  {
    title: 'From Civil Supervisor to Survey Engineer: A Career Reflection',
    slug: 'from-civil-supervisor-to-survey-engineer',
    description:
      'A look back at moving from hands-on civil supervision to survey engineering and document control — and what each role taught the next one.',
    date: '2026-01-20',
    author: 'Niaz Hussain Abbasi',
    category: 'Leadership',
    tags: ['Leadership', 'Career', 'Field Work'],
    content: `Since 2012, my title has changed more than once — Civil Supervisor, Blasting Supervisor, Survey Engineer, Document Controller. Looking back, each role taught me something the next one depended on.

## Starting on site

Civil supervision is where I learned to read a construction drawing the way it's meant to be read: as an instruction a crew has to execute correctly, under real conditions, on the first try. That grounding never leaves you. Years later, reviewing a survey dataset or a document transmittal, I'm still asking the same question a supervisor asks on site: *does this actually work in the field, or does it only work on paper?*

## What blasting supervision added

Supervising blasting operations added a level of discipline that carried into everything afterward. When the cost of an error is measured in safety rather than schedule, you stop treating process as optional. That mindset is useful even in roles that look, on the surface, much lower-risk than a blasting site.

## Becoming a survey engineer

Moving into survey engineering meant trading hands-on execution for precision at a different scale — coordinates, control points, and datasets that everything else on a project gets built from. It's quieter work than supervising a crew, but the responsibility is arguably heavier, because errors here don't announce themselves immediately. They show up later, in someone else's work.

### What stayed constant across every role

- Respect for the sequence — steps exist for a reason, even when they're inconvenient
- A bias toward verifying rather than assuming
- Treating documentation as part of the job, not an afterthought to it

## Document control as the natural next step

Taking on document control responsibilities felt less like a career pivot and more like a continuation. Someone who has supervised a crew, run a survey, and stood next to a blasting operation understands exactly why a wrong revision reaching the field is dangerous — not abstractly, but specifically.

*A decade of moving between these roles has convinced me that the best document controllers, survey engineers, and supervisors are usually the ones who've spent real time in each other's positions.* It's much harder to cut a corner in a role you've seen the consequences of, from the other side.`,
  },
  {
    title: 'Civil 3D and AutoCAD: Tools That Actually Save Time on Site',
    slug: 'civil-3d-and-autocad-tools-that-save-time',
    description:
      'Not every feature in Civil 3D and AutoCAD earns its place in a real workflow. These are the ones that consistently do, on active survey and civil projects.',
    date: '2025-11-05',
    author: 'Niaz Hussain Abbasi',
    category: 'Survey Engineering',
    tags: ['Survey Engineering', 'Civil 3D', 'AutoCAD'],
    content: `Software vendors will tell you every feature matters. On an active project with a tight schedule, only a handful actually do. These are the ones I reach for most, and rely on most.

## Surface modeling as the shared reference

Building an accurate surface model early — from survey data, not assumptions — gives every downstream calculation a common reference point. Cut-and-fill volumes, drainage planning, and grading all get more reliable the moment they're built against a surface that reflects what's actually on the ground rather than a design intent drawing.

## Point cloud and survey data import

Getting raw survey data into Civil 3D cleanly, without manual re-entry, is one of the more mundane-sounding time savers that has the biggest real-world impact. Manual re-entry isn't just slow, it's a place errors quietly get introduced between the instrument and the drawing.

### Where the time actually goes

- Clean data import and validation against known control points
- Corridor and alignment tools for anything linear — roads, drainage, access tracks
- Annotation and labeling standards kept consistent across a drawing set, so a reviewer isn't relearning conventions on every sheet

## AutoCAD for what it's still best at

Civil 3D handles the modeling. AutoCAD is still where a lot of the fine detail and coordination drawing work happens, especially for markups and quick clarifications that need to move fast between office and site. Keeping both in a consistent layer and standards setup — instead of letting each drawing evolve its own conventions — pays for itself the first time two people need to work from the same file.

*The tools change every few years. The discipline of keeping data clean, consistent, and traceable back to a real survey doesn't.* That's the part worth investing in.`,
  },
  {
    title: 'Coordinating Teams Across Remote Project Sites',
    slug: 'coordinating-teams-across-remote-project-sites',
    description:
      'Remote and mountainous project sites make communication harder in ways that don’t show up until something goes wrong. Some practical habits that hold teams together anyway.',
    date: '2025-09-10',
    author: 'Niaz Hussain Abbasi',
    category: 'Leadership',
    tags: ['Leadership', 'Team Coordination', 'Field Work'],
    content: `A project site with reliable connectivity and easy access has a way of hiding coordination problems — there's always time to send another message or walk over and clarify. Remote, mountainous sites don't offer that safety net, so the coordination habits that work everywhere else have to be more deliberate here.

## Over-communicate before the gap forces you to

**On a remote site, the cost of a missed handoff is much higher, because there's often no quick way to fix it once the shift changes or the crew moves to a different part of the site.** I've found that briefings which feel slightly over-explained on an easy-access site are exactly the right amount of detail on a remote one.

- Start-of-shift briefings that confirm what changed since the last one, not just the plan for today
- A single point of contact for each discipline, so questions don't get lost between people
- Written confirmation for anything safety-critical, even when a verbal instruction would normally be enough

## Documentation is coordination

This is where document control and team coordination overlap more than people expect. On a remote site, the drawing set and the transmittal log often *are* the communication channel — not a supplement to conversation, but the primary way information reaches a crew that isn't in daily contact with the office.

## Trust built in smaller sites travels

Every team I've coordinated across a difficult, remote location has been built from the same starting point: consistency on smaller, easier sites first. People trust a process under pressure because they've already seen it work when the pressure was lower. That trust doesn't transfer automatically — it has to be built deliberately, project by project.

*The terrain makes coordination harder. It doesn't make it optional.*`,
  },
  {
    title: 'Notes on GPS Base Station Calibration',
    slug: 'notes-on-gps-base-station-calibration',
    description: 'Working notes on base station calibration, not yet ready for publication.',
    date: '2025-12-01',
    author: 'Niaz Hussain Abbasi',
    category: 'Survey Engineering',
    tags: ['Survey Engineering', 'GPS Surveying'],
    draft: true,
    content: `Draft notes on base station calibration procedure — not finished yet.

## Placeholder section

This entry is still being written and isn't published.`,
  },
];

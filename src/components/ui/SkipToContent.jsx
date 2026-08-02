/**
 * First focusable element on every page. Invisible until it receives
 * keyboard focus, then jumps straight to #main-content — lets keyboard/
 * screen-reader users bypass the nav on every load (docs §6.4).
 */
const SkipToContent = ({ targetId = 'main-content' }) => (
  <a
    href={`#${targetId}`}
    className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[100] focus-visible:px-5 focus-visible:py-3 focus-visible:rounded-xl focus-visible:bg-primary focus-visible:text-white focus-visible:text-sm focus-visible:font-semibold focus-visible:shadow-lg"
  >
    Skip to content
  </a>
);

export default SkipToContent;

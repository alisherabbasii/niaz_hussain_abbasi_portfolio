/**
 * Joins class names, skipping falsy values. Deliberately not a full
 * clsx/tailwind-merge replacement — just enough for conditional className
 * composition in the ui/ primitives without adding a dependency.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

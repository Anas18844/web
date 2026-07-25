/** Minimal class-name joiner — avoids pulling in a dependency for this. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

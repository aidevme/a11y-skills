/** Shared WCAG success-criterion metadata for reporters and docs. */

export const SC_INFO: Record<string, { name: string; slug: string }> = {
  '1.1.1': { name: 'Non-text Content', slug: 'non-text-content' },
  '1.2.2': { name: 'Captions (Prerecorded)', slug: 'captions-prerecorded' },
  '1.3.1': { name: 'Info and Relationships', slug: 'info-and-relationships' },
  '1.3.4': { name: 'Orientation', slug: 'orientation' },
  '1.3.5': { name: 'Identify Input Purpose', slug: 'identify-input-purpose' },
  '1.4.2': { name: 'Audio Control', slug: 'audio-control' },
  '1.4.3': { name: 'Contrast (Minimum)', slug: 'contrast-minimum' },
  '1.4.10': { name: 'Reflow', slug: 'reflow' },
  '1.4.12': { name: 'Text Spacing', slug: 'text-spacing' },
  '2.1.1': { name: 'Keyboard', slug: 'keyboard' },
  '2.1.2': { name: 'No Keyboard Trap', slug: 'no-keyboard-trap' },
  '2.2.2': { name: 'Pause, Stop, Hide', slug: 'pause-stop-hide' },
  '2.3.1': { name: 'Three Flashes or Below Threshold', slug: 'three-flashes-or-below-threshold' },
  '2.4.1': { name: 'Bypass Blocks', slug: 'bypass-blocks' },
  '2.4.3': { name: 'Focus Order', slug: 'focus-order' },
  '2.4.4': { name: 'Link Purpose (In Context)', slug: 'link-purpose-in-context' },
  '2.4.6': { name: 'Headings and Labels', slug: 'headings-and-labels' },
  '3.1.1': { name: 'Language of Page', slug: 'language-of-page' },
  '3.3.1': { name: 'Error Identification', slug: 'error-identification' },
  '3.3.2': { name: 'Labels or Instructions', slug: 'labels-or-instructions' },
  '4.1.2': { name: 'Name, Role, Value', slug: 'name-role-value' },
  '4.1.3': { name: 'Status Messages', slug: 'status-messages' },
};

export function scName(ref: string): string {
  return SC_INFO[ref]?.name ?? '';
}

export function understandingUrl(ref: string): string | undefined {
  const slug = SC_INFO[ref]?.slug;
  return slug ? `https://www.w3.org/WAI/WCAG22/Understanding/${slug}.html` : undefined;
}

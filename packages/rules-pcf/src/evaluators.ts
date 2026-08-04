import { DOMParser } from 'linkedom';
import type { ConditionEvaluator, ConditionMatch } from '@aidevme/a11y-rules-engine';

function isEmpty(value: string | null): boolean {
  return value === null || value.trim() === '';
}

/** Best-effort human-readable identifier for {{name}} substitution. */
function elementPlaceholders(el: Element): Record<string, string> {
  const name =
    el.getAttribute('name') ?? el.getAttribute('constructor') ?? el.getAttribute('id') ?? el.tagName.toLowerCase();
  return { name };
}

function lastTagOf(selector: string): string {
  const parts = selector.split(/[\s>]+/).filter(Boolean);
  return (parts[parts.length - 1] ?? selector).replace(/\[.*$/, '');
}

/**
 * Maps each `<tagName>` element (in document order) to its 1-based source
 * line, by zipping linkedom's parsed element order against raw-text tag
 * occurrences — linkedom doesn't track source positions itself, but XML
 * has no reordering, so document order and raw-text order always agree.
 */
function buildLineMap(content: string, doc: Document, tagName: string): Map<Element, number> {
  const positions: number[] = [];
  const re = new RegExp(`<${tagName}(?=[\\s/>])`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) positions.push(m.index);

  const elements = Array.from(doc.querySelectorAll(tagName)) as unknown as Element[];
  const map = new Map<Element, number>();
  elements.forEach((el, i) => {
    const pos = positions[i];
    map.set(el, pos !== undefined ? content.slice(0, pos).split('\n').length : 1);
  });
  return map;
}

function parseXml(content: string): Document {
  return new DOMParser().parseFromString(content, 'text/xml') as unknown as Document;
}

/**
 * `{type: "attribute-present", selector, attribute, expect?: "present"|"absent"}`
 * Fires once per element matching `selector` whose `attribute` violates
 * `expect` (default "present": fires when missing or empty).
 */
export const attributePresent: ConditionEvaluator = (content, condition) => {
  const selector = condition.selector as string;
  const attribute = condition.attribute as string;
  const expect = (condition.expect as 'present' | 'absent' | undefined) ?? 'present';
  const doc = parseXml(content);
  const lineMap = buildLineMap(content, doc, lastTagOf(selector));
  const elements = Array.from(doc.querySelectorAll(selector)) as unknown as Element[];

  const matches: ConditionMatch[] = [];
  for (const el of elements) {
    const value = el.getAttribute(attribute);
    const violates = expect === 'present' ? isEmpty(value) : !isEmpty(value);
    if (!violates) continue;
    matches.push({ placeholders: elementPlaceholders(el), line: lineMap.get(el) ?? 1 });
  }
  return matches;
};

/**
 * `{type: "attribute-value", selector, attribute, equals?: string, notEquals?: string}`
 * Fires once per element matching `selector` whose `attribute` value
 * equals `equals`, or does not equal `notEquals` (an absent attribute
 * counts as not-equal to any given value).
 */
export const attributeValue: ConditionEvaluator = (content, condition) => {
  const selector = condition.selector as string;
  const attribute = condition.attribute as string;
  const equalsVal = condition.equals as string | undefined;
  const notEqualsVal = condition.notEquals as string | undefined;
  const doc = parseXml(content);
  const lineMap = buildLineMap(content, doc, lastTagOf(selector));
  const elements = Array.from(doc.querySelectorAll(selector)) as unknown as Element[];

  const matches: ConditionMatch[] = [];
  for (const el of elements) {
    const value = el.getAttribute(attribute);
    let violates = false;
    if (equalsVal !== undefined && value === equalsVal) violates = true;
    if (notEqualsVal !== undefined && value !== notEqualsVal) violates = true;
    if (!violates) continue;
    matches.push({ placeholders: elementPlaceholders(el), line: lineMap.get(el) ?? 1 });
  }
  return matches;
};

/**
 * `{type: "control-property", check: "no-associated-label" | "no-description", usage?: string[]}`
 * PCF-domain-specific: iterates a manifest's `<property>` elements
 * (optionally filtered to a `usage` allow-list), checking `display-name-key`
 * ("no-associated-label") or `description-key` ("no-description").
 */
export const controlProperty: ConditionEvaluator = (content, condition) => {
  const check = condition.check as 'no-associated-label' | 'no-description';
  const usageFilter = condition.usage as string[] | undefined;
  const attribute = check === 'no-associated-label' ? 'display-name-key' : 'description-key';
  const doc = parseXml(content);
  const lineMap = buildLineMap(content, doc, 'property');
  const properties = Array.from(doc.querySelectorAll('property')) as unknown as Element[];

  const matches: ConditionMatch[] = [];
  for (const prop of properties) {
    const usage = prop.getAttribute('usage');
    if (usageFilter && (!usage || !usageFilter.includes(usage))) continue;
    if (!isEmpty(prop.getAttribute(attribute))) continue;
    matches.push({ placeholders: elementPlaceholders(prop), line: lineMap.get(prop) ?? 1 });
  }
  return matches;
};

export const PCF_EVALUATORS: Record<string, ConditionEvaluator> = {
  'attribute-present': attributePresent,
  'attribute-value': attributeValue,
  'control-property': controlProperty,
};

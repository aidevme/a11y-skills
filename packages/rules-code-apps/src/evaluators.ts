import ts from 'typescript';
import type { ConditionEvaluator, ConditionMatch } from '@aidevme/a11y-rules-engine';

interface JsxInfo {
  tagName: string;
  attrs: Record<string, string>;
  hasAttr: (name: string) => boolean;
  childrenText: string;
  line: number;
}

function attrValueText(sourceFile: ts.SourceFile, attr: ts.JsxAttribute): string {
  const init = attr.initializer;
  if (!init) return 'true'; // valueless attribute, e.g. `disabled`
  if (ts.isStringLiteral(init)) return init.text;
  if (ts.isJsxExpression(init) && init.expression) return init.expression.getText(sourceFile);
  return '';
}

function collectAttrs(sourceFile: ts.SourceFile, attributes: ts.JsxAttributes): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const prop of attributes.properties) {
    if (ts.isJsxAttribute(prop) && prop.name) {
      attrs[prop.name.getText(sourceFile)] = attrValueText(sourceFile, prop);
    }
  }
  return attrs;
}

function lineOf(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

/** Walks a TSX source file, yielding one JsxInfo per JSX element (self-closing or full). */
function walkJsxElements(sourceFile: ts.SourceFile): JsxInfo[] {
  const results: JsxInfo[] = [];

  function visit(node: ts.Node): void {
    if (ts.isJsxSelfClosingElement(node)) {
      results.push({
        tagName: node.tagName.getText(sourceFile),
        attrs: collectAttrs(sourceFile, node.attributes),
        hasAttr(name) {
          return name in this.attrs;
        },
        childrenText: '',
        line: lineOf(sourceFile, node),
      });
    } else if (ts.isJsxElement(node)) {
      const childrenText = node.children
        .map((c) => (ts.isJsxText(c) ? c.text : ts.isJsxExpression(c) && c.expression ? c.expression.getText(sourceFile) : ''))
        .join('')
        .trim();
      results.push({
        tagName: node.openingElement.tagName.getText(sourceFile),
        attrs: collectAttrs(sourceFile, node.openingElement.attributes),
        hasAttr(name) {
          return name in this.attrs;
        },
        childrenText,
        line: lineOf(sourceFile, node.openingElement),
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}

function parseTsx(content: string): ts.SourceFile {
  return ts.createSourceFile('file.tsx', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function isEmpty(value: string | undefined): boolean {
  return value === undefined || value.trim() === '';
}

/**
 * `{type: "jsx-element-attribute-present", tagNames?: string[], roleValues?: string[], hasAnyAttr: string[], requireAttr: string}`
 * Fires once per JSX element matching `tagNames` and/or `roleValues` that
 * has at least one attribute from `hasAnyAttr` but is missing `requireAttr`.
 */
export const jsxElementAttributePresent: ConditionEvaluator = (content, condition) => {
  const tagNames = (condition.tagNames as string[] | undefined) ?? [];
  const roleValues = (condition.roleValues as string[] | undefined) ?? [];
  const hasAnyAttr = condition.hasAnyAttr as string[];
  const requireAttr = condition.requireAttr as string;

  const sourceFile = parseTsx(content);
  const matches: ConditionMatch[] = [];
  for (const el of walkJsxElements(sourceFile)) {
    const tagMatches = tagNames.includes(el.tagName);
    const roleMatches = roleValues.includes(el.attrs.role ?? '');
    if (!tagMatches && !roleMatches) continue;
    if (!hasAnyAttr.some((a) => el.hasAttr(a))) continue;
    if (!isEmpty(el.attrs[requireAttr])) continue;
    matches.push({ placeholders: { name: el.childrenText || el.tagName }, line: el.line });
  }
  return matches;
};

/**
 * `{type: "jsx-element-content-shape", tagNames: string[], contentShape: "numeric-only", requireAttr: string}`
 * Fires once per JSX element matching `tagNames` whose entire child content
 * is a bare number (e.g. a pagination page-number button) and is missing
 * `requireAttr`.
 */
export const jsxElementContentShape: ConditionEvaluator = (content, condition) => {
  const tagNames = condition.tagNames as string[];
  const requireAttr = condition.requireAttr as string;
  const numericOnly = /^\d+$/;

  const sourceFile = parseTsx(content);
  const matches: ConditionMatch[] = [];
  for (const el of walkJsxElements(sourceFile)) {
    if (!tagNames.includes(el.tagName)) continue;
    if (!numericOnly.test(el.childrenText)) continue;
    if (!isEmpty(el.attrs[requireAttr]) || el.hasAttr('aria-labelledby')) continue;
    matches.push({ placeholders: { name: el.childrenText }, line: el.line });
  }
  return matches;
};

/**
 * `{type: "file-contains-without", requiresPattern: string, missingPattern: string}`
 * File-level (not per-element): fires once, at line 1, when `requiresPattern`
 * matches somewhere in the file and `missingPattern` matches nowhere.
 * Regex source strings, case-insensitive.
 */
export const fileContainsWithout: ConditionEvaluator = (content, condition) => {
  const requires = new RegExp(condition.requiresPattern as string, 'i');
  const missing = new RegExp(condition.missingPattern as string, 'i');
  if (!requires.test(content) || missing.test(content)) return [];
  return [{ line: 1 }];
};

export const CODE_APPS_EVALUATORS: Record<string, ConditionEvaluator> = {
  'jsx-element-attribute-present': jsxElementAttributePresent,
  'jsx-element-content-shape': jsxElementContentShape,
  'file-contains-without': fileContainsWithout,
};

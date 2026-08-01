/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Custom ESLint rules for Fluent UI v9 (@fluentui/react-components).
 * Every rule resolves the JSX element name against the file's imports so a
 * local component that happens to be called `Button` never triggers a
 * finding (TEST_PLAN TC-P1.4-06); aliased Fluent imports are tracked
 * (TC-P1.4-07).
 */
import type { Rule } from 'eslint';

const FLUENT_SOURCE = /^@fluentui\/react-components(\/|$)/;

type ImportMap = Map<string, string>; // localName -> imported Fluent component name

function collectFluentImports(map: ImportMap, node: any): void {
  if (!FLUENT_SOURCE.test(String(node.source?.value ?? ''))) return;
  for (const spec of node.specifiers ?? []) {
    if (spec.type === 'ImportSpecifier' && spec.imported?.name) {
      map.set(spec.local.name, spec.imported.name);
    }
  }
}

function jsxName(node: any): string | undefined {
  return node.name?.type === 'JSXIdentifier' ? node.name.name : undefined;
}

function getAttr(node: any, name: string): any {
  return (node.attributes ?? []).find(
    (a: any) => a.type === 'JSXAttribute' && a.name?.name === name,
  );
}

function attrIsFalse(attr: any): boolean {
  if (!attr?.value) return false;
  if (attr.value.type === 'Literal') return attr.value.value === 'false' || attr.value.value === false;
  if (attr.value.type === 'JSXExpressionContainer')
    return attr.value.expression?.type === 'Literal' && attr.value.expression.value === false;
  return false;
}

function hasMeaningfulChildren(openingElement: any): boolean {
  const parent = openingElement.parent;
  if (!parent || parent.type !== 'JSXElement') return false;
  return (parent.children ?? []).some((c: any) => {
    if (c.type === 'JSXText') return c.value.trim().length > 0;
    return c.type === 'JSXElement' || c.type === 'JSXExpressionContainer' || c.type === 'JSXFragment';
  });
}

interface ComponentCheck {
  component: string;
  messageId: string;
  message: string;
  check(node: any): boolean; // true = report
}

function makeFluentRule(check: ComponentCheck): Rule.RuleModule {
  return {
    meta: {
      type: 'problem',
      messages: { [check.messageId]: check.message },
      schema: [],
    },
    create(context) {
      const imports: ImportMap = new Map();
      return {
        ImportDeclaration(node: any) {
          collectFluentImports(imports, node);
        },
        JSXOpeningElement(node: any) {
          const local = jsxName(node);
          if (!local) return;
          if (imports.get(local) !== check.component) return;
          if (check.check(node)) {
            context.report({ node, messageId: check.messageId });
          }
        },
      };
    },
  };
}

export const rules: Record<string, Rule.RuleModule> = {
  'image-alt': makeFluentRule({
    component: 'Image',
    messageId: 'missingAlt',
    message: 'Fluent <Image> has no alt prop; assistive tech cannot describe it.',
    check: (node) => !getAttr(node, 'alt') && !getAttr(node, 'aria-label'),
  }),
  'button-accessible-name': makeFluentRule({
    component: 'Button',
    messageId: 'missingName',
    message:
      'Icon-only Fluent <Button> has no accessible name; add aria-label or visible content.',
    check: (node) =>
      Boolean(getAttr(node, 'icon')) &&
      !hasMeaningfulChildren(node) &&
      !getAttr(node, 'aria-label') &&
      !getAttr(node, 'aria-labelledby') &&
      !getAttr(node, 'title'),
  }),
  'dialog-aria-modal': makeFluentRule({
    component: 'Dialog',
    messageId: 'clobberedModal',
    message:
      'Fluent <Dialog> manages aria-modal itself; setting aria-modal to false breaks modal semantics for assistive tech.',
    check: (node) => attrIsFalse(getAttr(node, 'aria-modal')),
  }),
  'spinner-label': makeFluentRule({
    component: 'Spinner',
    messageId: 'missingLabel',
    message: 'Fluent <Spinner> has no label; loading state will not be announced.',
    check: (node) =>
      !getAttr(node, 'label') && !getAttr(node, 'aria-label') && !getAttr(node, 'aria-labelledby'),
  }),
  'field-label': makeFluentRule({
    component: 'Field',
    messageId: 'missingLabel',
    message: 'Fluent <Field> has no label prop; its wrapped control is unlabeled.',
    check: (node) => !getAttr(node, 'label'),
  }),
  'link-accessible-name': makeFluentRule({
    component: 'Link',
    messageId: 'missingName',
    message: 'Fluent <Link> has no content or aria-label; its purpose is not discernible.',
    check: (node) =>
      !hasMeaningfulChildren(node) &&
      !getAttr(node, 'aria-label') &&
      !getAttr(node, 'aria-labelledby'),
  }),
};

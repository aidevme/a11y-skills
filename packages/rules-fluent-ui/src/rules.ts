/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Custom ESLint rules for Fluent UI v9 (@fluentui/react-components).
 * Every rule resolves the JSX element name against the file's imports so a
 * local component that happens to be called `Button` never triggers a
 * finding (TEST_PLAN TC-P1.4-06); aliased Fluent imports are tracked
 * (TC-P1.4-07).
 *
 * Component/attribute matching (`Field`, `Label`, `DialogTitle`) is done by
 * literal JSX tag name rather than import-resolved, matching the
 * simplification already used by `hasMeaningfulChildren`'s parent check —
 * a local component that happens to share one of those names could in rare
 * cases suppress a finding, but never causes a false positive.
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

function getAttrStringValue(node: any, name: string): string | undefined {
  const attr = getAttr(node, name);
  if (attr?.value?.type === 'Literal' && typeof attr.value.value === 'string') {
    return attr.value.value;
  }
  return undefined;
}

function attrIsFalse(attr: any): boolean {
  if (!attr?.value) return false;
  if (attr.value.type === 'Literal')
    return attr.value.value === 'false' || attr.value.value === false;
  if (attr.value.type === 'JSXExpressionContainer')
    return attr.value.expression?.type === 'Literal' && attr.value.expression.value === false;
  return false;
}

function hasMeaningfulChildren(openingElement: any): boolean {
  const parent = openingElement.parent;
  if (!parent || parent.type !== 'JSXElement') return false;
  return (parent.children ?? []).some((c: any) => {
    if (c.type === 'JSXText') return c.value.trim().length > 0;
    return (
      c.type === 'JSXElement' || c.type === 'JSXExpressionContainer' || c.type === 'JSXFragment'
    );
  });
}

/** True when `node` (a JSXOpeningElement) is the immediate child of a `<Field>`, which wires labelling for its wrapped control. */
function isWrappedInField(node: any): boolean {
  const ownElement = node.parent;
  const wrapper = ownElement?.parent;
  return wrapper?.type === 'JSXElement' && jsxName(wrapper.openingElement) === 'Field';
}

function isIconOnlyMissingName(node: any): boolean {
  return (
    Boolean(getAttr(node, 'icon')) &&
    !hasMeaningfulChildren(node) &&
    !getAttr(node, 'aria-label') &&
    !getAttr(node, 'aria-labelledby') &&
    !getAttr(node, 'title')
  );
}

/** Recursively searches an element's descendants (through fragments and simple &&/?: expressions) for a JSX tag named `tagName`. */
function containsDescendantNamed(element: any, tagName: string, depth = 0): boolean {
  if (!element || depth > 20) return false;
  const children: any[] =
    element.type === 'JSXElement' || element.type === 'JSXFragment' ? (element.children ?? []) : [];
  for (const child of children) {
    if (child.type === 'JSXElement') {
      if (jsxName(child.openingElement) === tagName) return true;
      if (containsDescendantNamed(child, tagName, depth + 1)) return true;
    } else if (child.type === 'JSXFragment') {
      if (containsDescendantNamed(child, tagName, depth + 1)) return true;
    } else if (child.type === 'JSXExpressionContainer') {
      const expr = child.expression;
      for (const candidate of [expr?.left, expr?.right, expr?.consequent, expr?.alternate, expr]) {
        if (candidate?.type === 'JSXElement' && jsxName(candidate.openingElement) === tagName)
          return true;
        if (candidate?.type === 'JSXElement' || candidate?.type === 'JSXFragment') {
          if (containsDescendantNamed(candidate, tagName, depth + 1)) return true;
        }
      }
    }
  }
  return false;
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

interface LabelRequirementCheck {
  component: string;
  messageId: string;
  message: string;
  /** Extra check accepted as satisfying the label requirement (e.g. Checkbox's own `label` prop). */
  hasOwnLabel?(node: any): boolean;
}

/**
 * Requires one of: `aria-label`, `aria-labelledby`, an ancestor `<Field>`
 * wrapper, a sibling `<Label htmlFor>` matching this element's `id`, or (if
 * provided) the component's own label mechanism. Label collection happens
 * file-wide and findings are reported at `Program:exit` so a `<Label>` may
 * appear before or after the control it labels.
 */
function makeLabelRequirementRule(check: LabelRequirementCheck): Rule.RuleModule {
  return {
    meta: {
      type: 'problem',
      messages: { [check.messageId]: check.message },
      schema: [],
    },
    create(context) {
      const imports: ImportMap = new Map();
      const labelHtmlFor = new Set<string>();
      const candidates: any[] = [];

      return {
        ImportDeclaration(node: any) {
          collectFluentImports(imports, node);
        },
        JSXOpeningElement(node: any) {
          const local = jsxName(node);
          if (!local) return;
          if (local === 'Label') {
            const htmlFor = getAttrStringValue(node, 'htmlFor');
            if (htmlFor) labelHtmlFor.add(htmlFor);
            return;
          }
          if (imports.get(local) !== check.component) return;
          candidates.push(node);
        },
        'Program:exit'() {
          for (const node of candidates) {
            if (getAttr(node, 'aria-label') || getAttr(node, 'aria-labelledby')) continue;
            if (isWrappedInField(node)) continue;
            if (check.hasOwnLabel?.(node)) continue;
            const id = getAttrStringValue(node, 'id');
            if (id && labelHtmlFor.has(id)) continue;
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
    message: 'Icon-only Fluent <Button> has no accessible name; add aria-label or visible content.',
    check: isIconOnlyMissingName,
  }),
  'menubutton-accessible-name': makeFluentRule({
    component: 'MenuButton',
    messageId: 'missingName',
    message:
      'Icon-only Fluent <MenuButton> has no accessible name; add aria-label describing the menu, or visible content.',
    check: isIconOnlyMissingName,
  }),
  'dialog-aria-modal': makeFluentRule({
    component: 'Dialog',
    messageId: 'clobberedModal',
    message:
      'Fluent <Dialog> manages aria-modal itself; setting aria-modal to false breaks modal semantics for assistive tech.',
    check: (node) => attrIsFalse(getAttr(node, 'aria-modal')),
  }),
  'dialog-title': makeFluentRule({
    component: 'Dialog',
    messageId: 'missingTitle',
    message:
      'Fluent <Dialog> has no <DialogTitle> and no aria-label/aria-labelledby; the dialog has no accessible name.',
    check: (node) =>
      !getAttr(node, 'aria-label') &&
      !getAttr(node, 'aria-labelledby') &&
      !containsDescendantNamed(node.parent, 'DialogTitle'),
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
  'checkbox-label': makeLabelRequirementRule({
    component: 'Checkbox',
    messageId: 'missingLabel',
    message:
      'Fluent <Checkbox> has no label prop, aria-label/aria-labelledby, or Field wrapper; assistive tech cannot describe it.',
    hasOwnLabel: (node) => Boolean(getAttr(node, 'label')),
  }),
  'dropdown-label': makeLabelRequirementRule({
    component: 'Dropdown',
    messageId: 'missingLabel',
    message:
      'Fluent <Dropdown> has no associated label (Label htmlFor, aria-label, aria-labelledby, or Field wrapper); its purpose is not discernible.',
  }),
  'input-label': makeLabelRequirementRule({
    component: 'Input',
    messageId: 'missingLabel',
    message:
      'Fluent <Input> has no associated label (Label htmlFor, aria-label, aria-labelledby, or Field wrapper); its purpose is not discernible.',
  }),
  'radiogroup-label': makeLabelRequirementRule({
    component: 'RadioGroup',
    messageId: 'missingLabel',
    message:
      'Fluent <RadioGroup> has no group label (aria-label, aria-labelledby, or Field wrapper); the option group has no accessible name.',
  }),
  'spinbutton-label': makeLabelRequirementRule({
    component: 'SpinButton',
    messageId: 'missingLabel',
    message:
      'Fluent <SpinButton> has no associated label (Label htmlFor, aria-label, aria-labelledby, or Field wrapper); its purpose is not discernible.',
  }),
  'textarea-label': makeLabelRequirementRule({
    component: 'Textarea',
    messageId: 'missingLabel',
    message:
      'Fluent <Textarea> has no associated label (Label htmlFor, aria-label, aria-labelledby, or Field wrapper); its purpose is not discernible.',
  }),
};

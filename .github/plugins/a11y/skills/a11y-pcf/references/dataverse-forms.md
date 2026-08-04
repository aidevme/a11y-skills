# Dataverse form XML — accessibility reference

Dataverse model-driven form customizations are stored as XML with a stable schema (unchanged since CRM 2011): `<form><tabs><tab><columns><column><sections><section><rows><row><cell>`. Each `<cell>` wraps a `<labels>` block and a `<control>` bound to a column via `datafieldname`.

## The `*.form.xml` convention

Dataverse doesn't ship form customizations as one universally-named standalone file — they normally live inside an unpacked solution's `Entities/<entity>/FormXml/<formid>/` folder, or are exported as part of a full solution zip. `packages/rules-pcf` doesn't attempt to parse full solution-export folder structures (out of scope for this audit tool); instead, it recognizes any file whose name ends in `.form.xml`, wherever it sits inside a detected `pcf`-surface tree. If you're exporting or authoring a form file for auditing, name it accordingly — e.g. `ContactMainForm.form.xml`.

## Structural example (annotated)

```xml
<form>
  <tabs>
    <tab name="general" id="{...}">
      <labels>
        <label description="General" languagecode="1033" />  <!-- tab's accessible name — never leave empty -->
      </labels>
      <columns>
        <column width="100%">
          <sections>
            <section name="contact_info" showlabel="true" id="{...}">
              <labels>
                <label description="Contact Information" languagecode="1033" />  <!-- section's group name -->
              </labels>
              <rows>
                <row>
                  <cell id="{...}" showlabel="true">
                    <labels>
                      <label description="Email" languagecode="1033" />  <!-- field's label -->
                    </labels>
                    <control id="emailaddress1" classid="{4273EDBD-AC1D-40d3-9FB2-095C621B552D}" datafieldname="emailaddress1" disabled="false" />
                  </cell>
                </row>
              </rows>
            </section>
          </sections>
        </column>
      </columns>
    </tab>
  </tabs>
</form>
```

## Why `showlabel="false"` is a real accessibility bug, not a styling choice

It's tempting to reach for `showlabel="false"` when a form feels visually cluttered, on the assumption it behaves like `sr-only` CSS (hidden visually, still in the accessibility tree). It doesn't — the Dataverse form renderer omits the label element entirely when `showlabel` is false, for both sighted and assistive-tech users. A screen reader user tabbing into that field hears only "edit text", with no indication of what it's for. If you need a visually compact form, use column layout or a custom ribbon/script that keeps the label in the DOM and hides it with real CSS — not `showlabel`.

## What the automated rules check vs. what needs manual review

Automated (`packages/rules-pcf`, target `*.form.xml`):

| Rule | Checks |
| --- | --- |
| `dataverse-tab-label-empty` | Every `<tab>`'s label `description` is non-empty |
| `dataverse-section-label-empty` | Every `<section>`'s label `description` is non-empty |
| `dataverse-cell-label-empty` | Every `<cell>`'s label `description` is non-empty |
| `dataverse-section-label-hidden` | No `<section showlabel="false">` |
| `dataverse-cell-label-hidden` | No `<cell showlabel="false">` |

Needs manual review (not statically checkable from form XML alone):

- **Tab order vs. visual order** — the XML's document order should match the intended reading/tab order; a form editor can silently reorder visually without reordering the underlying XML.
- **Required-field indication** — whether a required column shows a clear, non-color-only required indicator is a column-metadata + form-rendering concern, not something the form XML alone determines.
- **Business Process Flow stage accessibility** — BPF stage controls live outside the `<form>` XML tree covered here.

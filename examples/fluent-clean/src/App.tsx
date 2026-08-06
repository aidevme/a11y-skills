import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Field,
  Image,
  Input,
  Label,
  Link,
  MenuButton,
  Option,
  RadioGroup,
  Spinner,
  SpinButton,
  Textarea,
} from '@fluentui/react-components';

export function App() {
  return (
    <>
      <Image src="preview.png" alt="Document preview" />
      <Button icon={<span aria-hidden="true">+</span>} aria-label="Add item" />
      <Dialog>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm action</DialogTitle>
            Dialog content
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <Spinner label="Loading results" />
      <Field label="Email">
        <Input />
      </Field>
      <Link href="/docs">Documentation</Link>
      <Field label="Subscribe to newsletter">
        <Checkbox />
      </Field>
      <Label htmlFor="favorite-fruit">Favorite fruit</Label>
      <Dropdown id="favorite-fruit">
        <Option>Apple</Option>
      </Dropdown>
      <Label htmlFor="full-name">Full name</Label>
      <Input id="full-name" />
      <RadioGroup aria-label="Favorite fruit" />
      <Label htmlFor="quantity">Quantity</Label>
      <SpinButton id="quantity" />
      <Field label="Description">
        <Textarea />
      </Field>
      <MenuButton icon={<span aria-hidden="true">+</span>} aria-label="More actions" />
    </>
  );
}

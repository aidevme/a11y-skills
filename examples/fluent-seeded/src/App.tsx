import {
  Button as Btn,
  Checkbox,
  Dialog,
  DialogBody,
  DialogSurface,
  Dropdown,
  Field,
  Image,
  Input,
  Link,
  MenuButton,
  Option,
  RadioGroup,
  Spinner,
  SpinButton,
  Textarea,
} from '@fluentui/react-components';

function LocalButton(props: { icon?: unknown }) {
  return <button type="button">local {String(props.icon)}</button>;
}
const Button = LocalButton;

export function App() {
  return (
    <>
      <Image src="preview.png" />
      <Btn icon={<span aria-hidden="true">+</span>} />
      <Dialog aria-modal="false">
        <DialogSurface>
          <DialogBody>Dialog content</DialogBody>
        </DialogSurface>
      </Dialog>
      <Spinner />
      <Field>
        <Input />
      </Field>
      <Link />
      <Checkbox />
      <Dropdown>
        <Option>One</Option>
      </Dropdown>
      <Input />
      <RadioGroup />
      <SpinButton />
      <Textarea />
      <MenuButton icon={<span aria-hidden="true">+</span>} />
      <Button icon="plus" />
    </>
  );
}

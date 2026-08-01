import {
  Button as Btn,
  Dialog,
  Field,
  Image,
  Input,
  Link,
  Spinner,
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
      <Dialog aria-modal="false">Dialog content</Dialog>
      <Spinner />
      <Field>
        <Input />
      </Field>
      <Link />
      <Button icon="plus" />
    </>
  );
}

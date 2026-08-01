import { Button, Dialog, Field, Image, Input, Link, Spinner } from '@fluentui/react-components';

export function App() {
  return (
    <>
      <Image src="preview.png" alt="Document preview" />
      <Button icon={<span aria-hidden="true">+</span>} aria-label="Add item" />
      <Dialog>Dialog content</Dialog>
      <Spinner label="Loading results" />
      <Field label="Email">
        <Input />
      </Field>
      <Link href="/docs">Documentation</Link>
    </>
  );
}

export function App() {
  return (
    <div>
      <img src="logo.png" />
      <a onClick={() => undefined}>Click me</a>
      <div onClick={() => undefined}>Open dialog</div>
      <span tabIndex={3}>Focusable</span>
      <div role="banana">Fruit</div>
      <p aria-labeledby="missing">Labelled</p>
      <marquee>Breaking news</marquee>
    </div>
  );
}

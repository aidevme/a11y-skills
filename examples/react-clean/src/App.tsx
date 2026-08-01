export function App() {
  return (
    <main>
      <h1>Accessible example</h1>
      <img src="logo.png" alt="Company logo" />
      <label htmlFor="name">Name</label>
      <input id="name" type="text" />
      <button type="button" onClick={() => undefined}>
        Save
      </button>
      <a href="/docs">Documentation</a>
    </main>
  );
}

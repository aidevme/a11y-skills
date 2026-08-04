export interface Account {
  id: string;
  name: string;
  email: string;
}

function sortBy(field: string) {
  return field;
}

export function AccountsGrid({ accounts, loading }: { accounts: Account[]; loading: boolean }) {
  return (
    <div>
      <img src="logo.png" alt="Company logo" />
      <div role="status" aria-live="polite">
        {loading ? 'Loading accounts…' : `${accounts.length} accounts loaded`}
      </div>
      <table>
        <thead>
          <tr>
            <th aria-sort="ascending" onClick={() => sortBy('name')}>
              Name
            </th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>{account.name}</td>
              <td>{account.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <nav aria-label="Pagination">
        <button aria-label="Go to page 1">1</button>
        <button aria-label="Go to page 2">2</button>
      </nav>
    </div>
  );
}

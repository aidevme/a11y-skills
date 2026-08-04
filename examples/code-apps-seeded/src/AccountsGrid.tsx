export interface Account {
  id: string;
  name: string;
  email: string;
}

function sortBy(field: string) {
  return field;
}

export function AccountsGrid({ accounts }: { accounts: Account[] }) {
  return (
    <div>
      <img src="logo.png" />
      <table>
        <thead>
          <tr>
            <th onClick={() => sortBy('name')}>Name</th>
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
      <nav>
        <button>1</button>
        <button aria-label="Go to page 2">2</button>
      </nav>
    </div>
  );
}

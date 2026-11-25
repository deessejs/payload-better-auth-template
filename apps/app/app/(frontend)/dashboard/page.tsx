import { verifySession } from '../../../lib/dal';
import { getMyExamples } from '../../../lib/payload';
import { addExample } from './actions';
import { SignOutButton } from './SignOutButton';

export default async function DashboardPage() {
  // Page-level guard. Protected data loading below also verifies and authorizes independently.
  const { user } = await verifySession();
  const examples = await getMyExamples();

  return (
    <main className="dashboard-wrap">
      <div className="dashboard-top">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1>Dashboard</h1>
        </div>
        <SignOutButton />
      </div>
      <p className="muted">Signed in as {user.email}. This session belongs to Better Auth.</p>
      <section className="dashboard-card" style={{ width: '100%', margin: '32px 0' }}>
        <h2>Your example records</h2>
        <p className="muted">
          Records are fetched through Payload Local API after a Better Auth check and scoped to your
          account.
        </p>
        <ul className="example-list">
          {examples.map((example) => (
            <li key={example.id}>{example.title}</li>
          ))}
          {examples.length === 0 && <li className="muted">No records yet.</li>}
        </ul>
        <form className="form" action={addExample}>
          <label>
            New record title
            <input name="title" maxLength={120} required />
          </label>
          <button className="button">Add example</button>
        </form>
      </section>
    </main>
  );
}

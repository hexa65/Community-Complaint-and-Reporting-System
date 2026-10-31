// Temporary landing screen for M2-T1. M2-T3 replaces this with the router layout.
const statuses = [
  { label: "Pending", className: "bg-pending-soft text-pending" },
  { label: "In Progress", className: "bg-progress-soft text-progress" },
  { label: "Resolved", className: "bg-resolved-soft text-resolved" },
];

export default function App() {
  const apiUrl = import.meta.env.VITE_API_URL || "not set (copy .env.example to .env)";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">CivicTrack</h1>
      <p className="text-lg text-asphalt">
        Report it. Track it. See it fixed. The web app scaffold is running.
      </p>
      <ul className="flex flex-wrap gap-2" aria-label="Complaint statuses">
        {statuses.map((status) => (
          <li
            key={status.label}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}
          >
            {status.label}
          </li>
        ))}
      </ul>
      <p className="border-l-4 border-paint pl-3 text-sm text-asphalt">
        API URL: <code>{apiUrl}</code>
      </p>
    </main>
  );
}
const fields = ["amount", "wallet", "category", "occurredAt", "note"];

export default function NewEntryModalLoading() {
  return (
    <div className="flex flex-col gap-4">
      <span className="h-control w-full rounded-[var(--radius)] bg-sunken" />
      <div className="flex flex-col gap-3">
        {fields.map((field) => (
          <div key={field} className="flex flex-col gap-1.5">
            <span className="h-3 w-16 rounded-[var(--radius)] bg-sunken" />
            <span className="h-control w-full rounded-[var(--radius)] bg-sunken" />
          </div>
        ))}
      </div>
    </div>
  );
}

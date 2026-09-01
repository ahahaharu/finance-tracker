import NotFoundView from "./not-found-view";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-start justify-center px-page pb-section">
      <div className="w-full max-w-[320px] pt-section">
        <NotFoundView />
      </div>
    </main>
  );
}

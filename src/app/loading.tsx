export default function RootLoading() {
  return (
    <div className="min-h-dvh w-full animate-pulse bg-[var(--paper)] p-6" aria-busy="true">
      <div className="mx-auto h-20 max-w-5xl rounded-3xl bg-[#efe3cf]" />
    </div>
  );
}

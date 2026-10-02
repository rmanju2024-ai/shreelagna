export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse space-y-4 px-4 py-8" aria-busy="true">
      <div className="h-24 rounded-3xl bg-[#efe3cf]" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 rounded-3xl bg-[#efe3cf]" />
        <div className="h-40 rounded-3xl bg-[#efe3cf]" />
        <div className="h-40 rounded-3xl bg-[#efe3cf]" />
        <div className="h-40 rounded-3xl bg-[#efe3cf]" />
      </div>
    </div>
  );
}

import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="container mx-auto max-w-lg p-6 text-center space-y-4">
      <h1 className="text-2xl font-semibold">You are offline</h1>
      <p className="text-muted-foreground">Some features may be unavailable without an internet connection.</p>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">You can still open the app, view cached pages, and continue logging. Your data is stored locally and will sync when back online.</p>
        <Link href="/" className="inline-flex h-10 items-center justify-center rounded-md bg-pink-200 px-4 text-pink-900 hover:bg-pink-300">Go to Dashboard</Link>
      </div>
    </main>
  );
}
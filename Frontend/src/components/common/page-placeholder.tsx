/** Temporary body for pages whose design has not been built yet. Delete once the page is real. */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Design pending.</p>
    </div>
  )
}

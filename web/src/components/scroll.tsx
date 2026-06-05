export function Scroll({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-y-auto px-4 pb-8 sm:px-6">{children}</div>;
}

export function LoadingSpinner({ className = 'py-24' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-secondary" />
    </div>
  )
}

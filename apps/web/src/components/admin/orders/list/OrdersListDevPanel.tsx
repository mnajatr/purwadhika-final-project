interface OrdersListDevPanelProps {
  devUserId: string | null;
  onReload: () => void;
  onClear: () => void;
  isLikelyNonAdmin: boolean;
}

export default function OrdersListDevPanel({
  devUserId,
  onReload,
  onClear,
  isLikelyNonAdmin,
}: OrdersListDevPanelProps) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-accent/10 border border-accent rounded-lg text-sm">
      <div className="flex items-center justify-between">
        <div>
          <strong>Dev user:</strong> {devUserId ?? "(none)"}
          <span className="ml-3 text-muted-foreground">
            (used for x-dev-user-id header)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 bg-gray-200 rounded text-sm"
            onClick={onReload}
          >
            Reload
          </button>
          <button
            className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>
      {isLikelyNonAdmin && (
        <div className="mt-2 text-sm text-yellow-700">
          Dev user looks like a non-admin ({devUserId ?? "(none)"}). Select{" "}
          <strong>2</strong> or <strong>3</strong> in the Dev user switch
          (sidebar).
        </div>
      )}
    </div>
  );
}

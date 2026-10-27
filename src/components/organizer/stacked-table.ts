// Classes for docs/08's "data table with phone fallback": a table from md up;
// below it each row is a stacked item with the key column first and the other
// cells as label/value pairs. Each non-key cell starts with a label that only
// shows on phone, where the table header is hidden.

export const stacked = {
  table: "block md:table",
  header: "hidden md:table-header-group",
  body: "block md:table-row-group",
  row: "block py-3 hover:bg-transparent md:table-row md:py-0 md:hover:bg-muted/50",
  keyCell: "block px-0 py-1 align-top whitespace-normal md:table-cell md:p-2",
  cell: "flex gap-3 px-0 py-1 align-top whitespace-normal md:table-cell md:p-2",
  label: "w-28 shrink-0 text-muted-foreground md:hidden",
} as const;

/** A text link that passes contrast: foreground and underlined, never primary (SYNC #4). */
export const textLink =
  "rounded-sm text-foreground underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring/50";

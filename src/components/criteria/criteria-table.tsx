import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Criterion = { name: string; weightPercent: number; maxScore: number };

/**
 * The criteria read-only, for the locked state. On phone each row becomes a
 * stacked item with the name first (docs/08 > Data table with phone fallback).
 */
export function CriteriaTable({ criteria }: { criteria: Criterion[] }) {
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {criteria.map((c) => (
          <li key={c.name} className="rounded-xl border bg-card p-4 text-card-foreground">
            <p className="font-medium break-words">{c.name}</p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Weight</dt>
                <dd>{c.weightPercent}%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Max score</dt>
                <dd>{c.maxScore}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Criterion</TableHead>
              <TableHead className="text-right">Weight</TableHead>
              <TableHead className="text-right">Max score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {criteria.map((c) => (
              <TableRow key={c.name}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-right tabular-nums">{c.weightPercent}%</TableCell>
                <TableCell className="text-right tabular-nums">{c.maxScore}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

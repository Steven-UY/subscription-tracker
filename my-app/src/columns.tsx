import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export type Subscription = {
  id: number
  name: string
  cost: number
  renews: Date
  category: string
  billing_cycle: string
  created_at: string
}

export function makeColumns(
  onDelete: (id: number) => void,
  mutedIds: Set<number>,
  onToggleMute: (id: number) => void
): ColumnDef<Subscription>[] {
  return [
    {
      id: "mute",
      cell: ({ row }) => (
        <Switch
          checked={!mutedIds.has(row.original.id)}
          onCheckedChange={() => onToggleMute(row.original.id)}
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "cost",
      header: "Cost",
    },
    {
      accessorKey: "billing_cycle",
      header: "Billing Cycle",
    },
    {
      accessorKey: "renews",
      header: "Renews",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(row.original.id)}
        >
          Delete
        </Button>
      ),
    },
  ]
}

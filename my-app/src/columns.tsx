import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"

export type Subscription = {
  id: number
  name: string
  cost: number
  category: string
  billing_cycle: string
  created_at: string
  start_date: string
}

function EditableCost({ sub, onUpdate }: {
  sub: Subscription
  onUpdate: (id: number, cost: number, billing_cycle: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")

  function startEdit() {
    setValue(String(sub.cost))
    setEditing(true)
  }

  function save() {
    const parsed = Number(value)
    if (!isNaN(parsed) && parsed > 0) onUpdate(sub.id, parsed, sub.billing_cycle)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        type="number"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') setEditing(false)
        }}
        autoFocus
        className="w-20 border rounded px-1 py-0.5 text-sm"
      />
    )
  }

  return (
    <span className="cursor-pointer underline decoration-dotted" onClick={startEdit}>
      ${sub.cost.toFixed(2)}
    </span>
  )
}

function EditableBillingCycle({ sub, onUpdate }: {
  sub: Subscription
  onUpdate: (id: number, cost: number, billing_cycle: string) => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <select
        value={sub.billing_cycle}
        onChange={e => {
          onUpdate(sub.id, sub.cost, e.target.value)
          setEditing(false)
        }}
        onBlur={() => setEditing(false)}
        autoFocus
        className="border rounded px-1 py-0.5 text-sm bg-background"
      >
        <option>Monthly</option>
        <option>Yearly</option>
      </select>
    )
  }

  return (
    <span className="cursor-pointer underline decoration-dotted" onClick={() => setEditing(true)}>
      {sub.billing_cycle}
    </span>
  )
}

export function makeColumns(
  onDelete: (id: number) => void,
  mutedIds: Set<number>,
  onToggleMute: (id: number) => void,
  onUpdate: (id: number, cost: number, billing_cycle: string) => void
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
      cell: ({ row }) => <EditableCost sub={row.original} onUpdate={onUpdate} />,
    },
    {
      accessorKey: "billing_cycle",
      header: "Billing Cycle",
      cell: ({ row }) => <EditableBillingCycle sub={row.original} onUpdate={onUpdate} />,
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
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

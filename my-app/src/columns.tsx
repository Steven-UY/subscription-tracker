
import  { type ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Subscription = {
  id: number
  name: string
  cost: number
  renews: Date
  category: string
  billing_cycle: string
}

export const columns: ColumnDef<Subscription>[] = [
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
]
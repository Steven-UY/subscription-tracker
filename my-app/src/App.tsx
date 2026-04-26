import { columns, type Subscription } from "@/columns"
import { DataTable } from "@/data-table"
import { useEffect, useState } from "react" 
import supabase from "@/lib/supabase"

export default function DemoPage() {
  const [data, setData] = useState<Subscription[]>([])

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
      if (!error) setData(data)
    }
    fetchData()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
import { columns, type Subscription } from "@/columns"
import { DataTable } from "@/data-table"
import { useEffect, useState } from "react" 
import supabase from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

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


  function getMonthlyCost(cost: number, billing_cycle: string): number {
    if (billing_cycle === "Yearly\n") return cost / 12
    return cost
  }

  function getYearlyCost(cost: number, billing_cycle: string): number{
    if (billing_cycle === "Monthly") return cost * 12
    return cost
  }

    const totalMonthly = data.reduce((sum, sub) => {
    return sum + getMonthlyCost(sub.cost, sub.billing_cycle)
  }, 0)

  const totalYearly = data.reduce((sum, sub) => {
    return sum + getYearlyCost(sub.cost, sub.billing_cycle)
  }, 0)

  const activeSubs = data.length

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Monthly</p>
            <CardTitle>${totalMonthly.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Yearly</p>
            <CardTitle>${totalYearly.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Total Active</p>
            <CardTitle>{activeSubs}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  )
}


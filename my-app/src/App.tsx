import { makeColumns, type Subscription } from "@/columns"
import { ChartAreaStep } from "@/stepChart"
import { DataTable } from "@/data-table"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "@/lib/supabase"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog"

const emptyForm = { name: "", cost: "", billing_cycle: "Monthly", category: "", start_date: "" }

function getNextRenewal(start_date: string, billing_cycle: string): Date {
  const start = new Date(start_date)
  const now = new Date()
  const isYearly = billing_cycle.trim() === 'Yearly'
  const next = new Date(start)
  while (next <= now) {
    isYearly ? next.setFullYear(next.getFullYear() + 1) : next.setMonth(next.getMonth() + 1)
  }
  return next
}

export default function DemoPage() {
  const [data, setData] = useState<Subscription[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [mutedIds, setMutedIds] = useState<Set<number>>(new Set())
  const [view, setView] = useState<"table" | "chart">("table")

  function handleToggleMute(id: number) {
    setMutedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate("/login")
  }

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
    if (billing_cycle === "Yearly") return cost / 12
    return cost
  }

  function getYearlyCost(cost: number, billing_cycle: string): number {
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

  const chartData = (() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0)
      const total = data
        .filter(sub => new Date(sub.start_date) <= monthEnd)
        .reduce((sum, sub) => sum + getMonthlyCost(sub.cost, sub.billing_cycle), 0)
      return {
        month: monthStart.toLocaleString('default', { month: 'long' }),
        total: parseFloat(total.toFixed(2)),
      }
    })
  })()

  const chartDateRange = `${chartData[0].month} – ${chartData[5].month} ${new Date().getFullYear()}`

  const savedMonthly = data
    .filter(sub => mutedIds.has(sub.id))
    .reduce((sum, sub) => sum + getMonthlyCost(sub.cost, sub.billing_cycle), 0)

  const ifCancelledMonthly = totalMonthly - savedMonthly
  const yearlySavings = savedMonthly * 12

  const renewingSoon = (() => {
    const now = new Date()
    return data.filter(sub => {
      if (!sub.start_date) return false
      const renews = getNextRenewal(sub.start_date, sub.billing_cycle)
      const daysUntil = (renews.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return daysUntil >= 0 && daysUntil <= 7
    })
  })()

  async function handleUpdate(id: number, cost: number, billing_cycle: string) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ cost, billing_cycle })
      .eq('id', id)
    if (!error) {
      setData(prev => prev.map(sub => sub.id === id ? { ...sub, cost, billing_cycle } : sub))
    }
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from('subscriptions').delete().eq('id', id)
    if (!error) setData(prev => prev.filter(sub => sub.id !== id))
  }

  async function handleAdd() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: inserted, error } = await supabase
      .from('subscriptions')
      .insert([{
        name: form.name,
        cost: Number(form.cost),
        billing_cycle: form.billing_cycle,
        category: form.category,
        start_date: form.start_date,
        user_id: user.id
      }])
      .select()

    if (!error && inserted) {
      setData(prev => [...prev, ...inserted])
      setForm(emptyForm)
      setOpen(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleLogout}>Log Out</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add Subscription</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Subscription</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Name"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
              <Input
                placeholder="Cost"
                type="number"
                value={form.cost}
                onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
              />
              <select
                value={form.billing_cycle}
                onChange={e => setForm(p => ({ ...p, billing_cycle: e.target.value }))}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option>Monthly</option>
                <option>Yearly</option>
              </select>
              <Input
                placeholder="Category"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              />
              <Input
                type="date"
                placeholder="Start Date"
                value={form.start_date}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="button" onClick={handleAdd}>Save</Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

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

      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-2">
          {renewingSoon.length > 0 && <p className="text-sm font-medium">Upcoming Subscriptions</p>}
          <div className="flex items-center gap-2 flex-wrap">
          {renewingSoon.map(sub => {
            const daysUntil = Math.ceil((getNextRenewal(sub.start_date, sub.billing_cycle).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            const daysText = daysUntil <= 0 ? 'today' : `${daysUntil} day${daysUntil === 1 ? '' : 's'}`
            return (
              <Badge key={sub.id} variant="destructive">
                {sub.name} · {daysText} · ${sub.cost.toFixed(2)}
              </Badge>
            )
          })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        {mutedIds.size > 0 && view === "table" ? (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Current: <span className="text-foreground font-medium">${totalMonthly.toFixed(2)}/mo</span></span>
            <span>·</span>
            <span>If cancelled: <span className="text-foreground font-medium">${ifCancelledMonthly.toFixed(2)}/mo</span></span>
            <span>·</span>
            <span>Yearly savings: <span className="text-green-600 font-medium">${yearlySavings.toFixed(2)}</span></span>
          </div>
        ) : <div />}
        <div className="flex gap-2">
          <Button variant={view === "table" ? "default" : "outline"} size="sm" onClick={() => setView("table")}>Subscription List</Button>
          <Button variant={view === "chart" ? "default" : "outline"} size="sm" onClick={() => setView("chart")}>Spending Pattern</Button>
        </div>
      </div>

      {view === "table" ? (
        <DataTable
          columns={makeColumns(handleDelete, mutedIds, handleToggleMute, handleUpdate)}
          data={data}
          getRowClassName={(row) => mutedIds.has(row.original.id) ? "opacity-40" : ""}
        />
      ) : (
        <ChartAreaStep data={chartData} dateRange={chartDateRange} />
      )}
    </div>
  )
}

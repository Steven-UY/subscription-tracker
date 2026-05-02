import { makeColumns, type Subscription } from "@/columns"
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

const emptyForm = { name: "", cost: "", billing_cycle: "Monthly", renews: "", category: "" }

export default function DemoPage() {
  const [data, setData] = useState<Subscription[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
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
    if (billing_cycle === "Yearly\n") return cost / 12
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

  const renewingSoon = (() => {
    const now = new Date()
    return data.filter(sub => {
      const renews = new Date(sub.renews)
      const daysUntil = (renews.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      if (daysUntil < 0 || daysUntil > 7) return false
      const isYearly = sub.billing_cycle.trim() === 'Yearly'
      if (isYearly) return renews.getFullYear() === now.getFullYear() + 1
      return true
    })
  })()

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
        renews: form.renews,
        category: form.category,
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
                type="date"
                value={form.renews}
                onChange={e => setForm(p => ({ ...p, renews: e.target.value }))}
              />
              <Input
                placeholder="Category"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAdd}>Save</Button>
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
          <p className="text-sm font-medium">Upcoming Subscriptions</p>
          <div className="flex items-center gap-2 flex-wrap">
          {renewingSoon.map(sub => {
            const daysUntil = Math.ceil((new Date(sub.renews).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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

      <DataTable columns={makeColumns(handleDelete)} data={data} />
    </div>
  )
}

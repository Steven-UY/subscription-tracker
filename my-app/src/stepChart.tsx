"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  total: {
    label: "Monthly Spend",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

type ChartDataPoint = {
  month: string
  total: number
}

type Props = {
  data: ChartDataPoint[]
  dateRange: string
}

export function ChartAreaStep({ data, dateRange }: Props) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Monthly Spending</CardTitle>
        <CardDescription>{dateRange}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              dataKey="total"
              type="step"
              fill="var(--color-total)"
              fillOpacity={0.4}
              stroke="var(--color-total)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

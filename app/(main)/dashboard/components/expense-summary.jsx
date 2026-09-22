"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  PieChart,
  DollarSign,
  Receipt,
} from "lucide-react";
import { getCategoryById, getCategoryIcon } from "@/lib/expense-categories";
import { useCurrency } from "@/components/providers/currency-context";

export function ExpenseSummary({
  analytics,
  selectedYear,
  onYearChange,
}) {
  const { formatAmount, currencySymbol } = useCurrency();
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const targetYear = selectedYear || analytics?.selectedYear || currentYear;

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const fullMonthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Build 12 months array with real data
  const monthlyList =
    analytics?.monthlySpending || analytics?.monthlyBreakdown || [];

  const chartData = monthNames.map((name, index) => {
    const found = monthlyList.find(
      (m) =>
        m.monthIndex === index ||
        m.month === index + 1 ||
        m.monthName === name
    );
    const amount = found ? (found.total ?? found.amount ?? 0) : 0;
    const count = found ? (found.count ?? 0) : 0;
    const isCurrentMonth =
      targetYear === currentYear && index === currentMonthIdx;

    return {
      name,
      amount,
      count,
      isCurrentMonth,
    };
  });

  const activeMonthName = fullMonthNames[currentMonthIdx];

  // Available year options
  const availableYears = analytics?.availableYears?.length
    ? analytics.availableYears
    : [
        currentYear,
        currentYear - 1,
        currentYear - 2,
      ];

  // Year navigation helpers
  const handlePrevYear = () => {
    const currentIndex = availableYears.indexOf(targetYear);
    if (currentIndex < availableYears.length - 1) {
      onYearChange?.(availableYears[currentIndex + 1]);
    } else {
      onYearChange?.(targetYear - 1);
    }
  };

  const handleNextYear = () => {
    const currentIndex = availableYears.indexOf(targetYear);
    if (currentIndex > 0) {
      onYearChange?.(availableYears[currentIndex - 1]);
    } else {
      onYearChange?.(targetYear + 1);
    }
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border shadow-md rounded-xl p-3 text-xs space-y-1">
          <p className="font-semibold text-foreground">
            {label} {targetYear}
          </p>
          <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
            <span>{formatAmount(data.amount || 0)}</span>
          </div>
          <p className="text-muted-foreground text-[11px]">
            {data.count} {data.count === 1 ? "expense" : "expenses"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">
                Spending Analytics
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary text-[11px] gap-1 font-medium"
              >
                <TrendingUp className="h-3 w-3" />
                Personal Share
              </Badge>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Your personal spending breakdown for {targetYear} across all
              groups and contacts.
            </CardDescription>
          </div>

          {/* Year Switcher Controls */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              type="button"
              onClick={handlePrevYear}
              title="Previous Year"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select
              value={targetYear.toString()}
              onValueChange={(val) => onYearChange?.(parseInt(val))}
            >
              <SelectTrigger className="h-8 min-w-[95px] text-xs font-semibold rounded-lg">
                <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder={targetYear.toString()} />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((yr) => (
                  <SelectItem key={yr} value={yr.toString()} className="text-xs">
                    {yr} {yr === currentYear ? "(Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              type="button"
              onClick={handleNextYear}
              title="Next Year"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/40 border rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {targetYear === currentYear
                ? `Spent in ${activeMonthName}`
                : "Active Month"}
            </span>
            <div className="text-xl font-bold text-foreground">
              {formatAmount(analytics?.totalSpentThisMonth || 0)}
            </div>
          </div>

          <div className="bg-muted/40 border rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Total in {targetYear}
            </span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatAmount(analytics?.totalSpentThisYear || 0)}
            </div>
          </div>

          <div className="bg-muted/40 border rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Monthly Average
            </span>
            <div className="text-xl font-bold text-foreground">
              {formatAmount(analytics?.monthlyAverage || 0)}
            </div>
          </div>

          <div className="bg-muted/40 border rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Expenses ({targetYear})
            </span>
            <div className="text-xl font-bold text-foreground">
              {analytics?.totalExpensesCount || 0}
            </div>
          </div>
        </div>

        {/* Monthly Spending Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="font-semibold text-foreground">
              Monthly Trend ({targetYear})
            </span>
            <span className="text-[11px]">
              All amounts represent your personal split share
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(val) => `${currencySymbol}${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="amount"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isCurrentMonth
                          ? "#059669"
                          : entry.amount > 0
                          ? "#10b981"
                          : "hsl(var(--muted))"
                      }
                      opacity={entry.amount > 0 ? 1 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Spending Breakdown */}
        {analytics?.categoryBreakdown?.length > 0 && (
          <div className="pt-2 border-t space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  Top Categories in {targetYear}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {analytics.categoryBreakdown.length}{" "}
                {analytics.categoryBreakdown.length === 1
                  ? "category"
                  : "categories"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {analytics.categoryBreakdown.map((item) => {
                const catInfo = getCategoryById(item.categoryId);
                const IconComp = getCategoryIcon(item.categoryId);

                return (
                  <div
                    key={item.categoryId}
                    className="p-3 rounded-xl border bg-muted/20 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <IconComp className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-semibold text-foreground">
                          {catInfo?.name || item.categoryId}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">
                          {formatAmount(item.amount)}
                        </span>
                        <span className="text-[11px] text-muted-foreground ml-1">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Fill Bar */}
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Smart AI Financial Recap (USP) */}
        {analytics?.totalSpentThisYear > 0 && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white mt-0.5">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                Settlo Smart Financial Insight ({targetYear})
              </div>
              <p className="text-muted-foreground">
                {analytics.topCategory
                  ? `Your highest spending category in ${targetYear} is ${
                      getCategoryById(analytics.topCategory.categoryId)?.name ||
                      analytics.topCategory.categoryId
                    } (${formatAmount(analytics.topCategory.amount)}, ${analytics.topCategory.percentage}% of annual spend).`
                  : `You have recorded ${analytics.totalExpensesCount} shared expenses in ${targetYear}.`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

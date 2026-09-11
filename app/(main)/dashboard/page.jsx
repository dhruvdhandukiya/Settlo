"use client";

import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, CreditCard, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { ExpenseSummary } from "./components/expense-summary";
import { BalanceSummary } from "./components/balance-summary";
import { GroupList } from "./components/group-list";
import { QuickExpenseModal } from "@/components/ai/quick-expense-modal";
import { useCurrency } from "@/components/providers/currency-context";

export default function Dashboard() {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { formatAmount } = useCurrency();

  const { data: balances, isLoading: balancesLoading } = useConvexQuery(
    api.dashboard.getUserBalances
  );

  const { data: groups, isLoading: groupsLoading } = useConvexQuery(
    api.dashboard.getUserGroups
  );

  const { data: analytics, isLoading: analyticsLoading } = useConvexQuery(
    api.dashboard.getDashboardAnalytics,
    { year: selectedYear }
  );

  const isLoading = balancesLoading || groupsLoading || analyticsLoading;

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="space-y-6">
        {/* Top header with title and quick actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Overview of your shared expenses and balances
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsAiModalOpen(true)}
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white font-medium shadow-md gap-2"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>AI Quick Add</span>
            </Button>
            <Link href="/expenses/new">
              <Button variant="outline" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Add Expense</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <BarLoader width={"100%"} color="#36d7b7" />
          </div>
        ) : (
          <>
            <QuickExpenseModal
              open={isAiModalOpen}
              onOpenChange={setIsAiModalOpen}
            />

            {/* Balance overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {balances?.totalBalance > 0 ? (
                      <span className="text-green-600">
                        {formatAmount(balances?.totalBalance, { showPositiveSign: true })}
                      </span>
                    ) : balances?.totalBalance < 0 ? (
                      <span className="text-red-600">
                        {formatAmount(balances?.totalBalance)}
                      </span>
                    ) : (
                      <span>{formatAmount(0)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {balances?.totalBalance > 0
                      ? "You are owed money"
                      : balances?.totalBalance < 0
                        ? "You owe money"
                        : "All settled up!"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    You are owed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatAmount(balances?.youAreOwed || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {balances?.oweDetails?.youAreOwedBy?.length || 0} people
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    You owe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {balances?.oweDetails?.youOwe?.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-red-600">
                        {formatAmount(balances?.youOwe || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        To {balances?.oweDetails?.youOwe?.length || 0} people
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{formatAmount(0)}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        You don't owe anyone
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Expense summary */}
              <ExpenseSummary
                analytics={analytics}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Balance details */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Balance Details</CardTitle>
                    <Button variant="link" asChild className="p-0">
                      <Link href="/contacts">
                        View all
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <BalanceSummary balances={balances} />
                </CardContent>
              </Card>

              {/* Groups */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Your Groups</CardTitle>
                    <Button variant="link" asChild className="p-0">
                      <Link href="/contacts">
                        View all
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <GroupList groups={groups} />
                </CardContent>
                <CardFooter>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/contacts?createGroup=true">
                      <Users className="mr-2 h-4 w-4" />
                      Create new group
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowLeftRight, ArrowLeft } from "lucide-react";
import { ExpenseList } from "@/components/expense-list";
import { SettlementList } from "@/components/settlement-list";
import { useCurrency } from "@/components/providers/currency-context";

export default function PersonExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");
  const { formatAmount } = useCurrency();

  const { data, isLoading } = useConvexQuery(
    api.expenses.getExpensesBetweenUsers,
    { userId: params.id }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const otherUser = data?.otherUser;
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balance = data?.balance || 0;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={otherUser?.imageUrl} />
            <AvatarFallback>{otherUser?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{otherUser?.name}</h1>
            <p className="text-sm text-muted-foreground">{otherUser?.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/settlements/new?userId=${params.id}&amount=${Math.abs(
              balance
            )}`}
          >
            <Button
              variant="outline"
              className="gap-2"
              disabled={balance === 0}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Settle up
            </Button>
          </Link>
          <Link href={`/expenses/new?userId=${params.id}`}>
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <PlusCircle className="h-4 w-4" />
              Add expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Balance card */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              {balance === 0 ? (
                <p>You are all settled up</p>
              ) : balance > 0 ? (
                <p>
                  <span className="font-medium">{otherUser?.name}</span> owes
                  you
                </p>
              ) : (
                <p>
                  You owe <span className="font-medium">{otherUser?.name}</span>
                </p>
              )}
            </div>
            <div
              className={`text-2xl font-bold ${balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : ""}`}
            >
              {formatAmount(Math.abs(balance))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for expenses and settlements */}
      <Tabs
        defaultValue="expenses"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">
            Expenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="settlements">
            Settlements ({settlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList
            expenses={expenses}
            showOtherPerson={false}
            otherPersonId={params.id}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

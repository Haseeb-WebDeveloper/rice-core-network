import { getInvestmentPlans } from "@/lib/plans/get-plans";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import Link from "next/link";

export default async function PlansPage() {
  const plans = await getInvestmentPlans();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investment Plans</h1>
        <p className="text-muted-foreground mt-2">
          Choose an investment plan that suits your goals
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        {plans.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              No investment plans available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const minInvestment = Number(plan.minInvestment);
              const dailyProfit = Number(plan.dailyProfitPercentage);

              return (
                <Link
                  key={plan.id}
                  href={`/user/plans/${plan.id}`}
                  className="block"
                >
                  <Card className="rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.description && (
                        <CardDescription>{plan.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Minimum Investment
                        </span>
                        <span className="font-semibold">
                          {minInvestment.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Daily Profit
                        </span>
                        <span className="font-semibold">{dailyProfit}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total Return
                        </span>
                        <span className="font-semibold text-green-600">
                          2X
                        </span>
                      </div>

                      {/* Buttom to invest */}
                      <div className="mt-6 w-full bg-primary/80 px-4 py-2.5 rounded-md text-white text-center hover:bg-primary/90 transition-all font-medium font-mono">
                        <Link
                          href={`/user/plans/${plan.id}`}
                          className=""
                        >
                          Invest Now
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </Suspense>
    </div>
  );
}

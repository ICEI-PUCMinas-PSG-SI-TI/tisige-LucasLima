import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table2, DollarSign } from "lucide-react";

interface WaiterDashboardProps {
  tablesServedToday: number;
  totalSoldToday: number;
}

export function WaiterDashboard({ tablesServedToday, totalSoldToday }: WaiterDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mesas atendidas hoje</CardTitle>
          <Table2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{tablesServedToday}</div>
          <p className="text-xs text-muted-foreground">Zera à meia-noite</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total vendido hoje</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {totalSoldToday.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Zera à meia-noite</p>
        </CardContent>
      </Card>
    </div>
  );
}

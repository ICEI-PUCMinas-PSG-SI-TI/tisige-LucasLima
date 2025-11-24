import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ChefHat, Users, Activity } from "lucide-react";
import { MenuManagement } from "@/components/admin/MenuManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { UnitsManagement } from "@/components/admin/UnitsManagement";
import { StockManagement } from "@/components/admin/StockManagement";
import { KitchenManagement } from "@/components/admin/KitchenManagement";
import { DemoDataButton } from "@/components/admin/DemoDataButton";
import { supabase } from "@/integrations/supabase/client";

const DashboardOverview = ({ 
  ordersInProgress, 
  occupiedTables 
}: { 
  ordersInProgress: number; 
  occupiedTables: number; 
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pedidos em Preparo</CardTitle>
          <ChefHat className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ordersInProgress}</div>
          <p className="text-xs text-muted-foreground">Total de pedidos ativos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mesas Ocupadas</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{occupiedTables}</div>
          <p className="text-xs text-muted-foreground">Mesas com clientes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">Online</div>
          <p className="text-xs text-muted-foreground">Operacional</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Admin() {
  const { signOut } = useAuth();
  const [ordersInProgress, setOrdersInProgress] = useState(0);
  const [occupiedTables, setOccupiedTables] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Count orders in progress (pending or preparing)
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "preparing"]);

      // Count occupied tables
      const { count: tablesCount } = await supabase
        .from("tables")
        .select("*", { count: "exact", head: true })
        .eq("status", "occupied");

      setOrdersInProgress(ordersCount || 0);
      setOccupiedTables(tablesCount || 0);
    };

    fetchDashboardData();

    // Set up real-time subscriptions for live updates
    const ordersSubscription = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchDashboardData()
      )
      .subscribe();

    const tablesSubscription = supabase
      .channel("tables-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      tablesSubscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-primary">Painel Administrativo</h1>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="menu">Cardápio</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="units">Unidades</TabsTrigger>
            <TabsTrigger value="kitchens">Cozinhas</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardOverview 
              ordersInProgress={ordersInProgress}
              occupiedTables={occupiedTables}
            />
          </TabsContent>

          <TabsContent value="menu">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="stock">
            <StockManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="units">
            <div className="space-y-4">
              <div className="flex justify-end">
                <DemoDataButton />
              </div>
              <UnitsManagement />
            </div>
          </TabsContent>

          <TabsContent value="kitchens">
            <KitchenManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
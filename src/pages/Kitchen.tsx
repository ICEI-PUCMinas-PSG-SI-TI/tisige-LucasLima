import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Kitchen() {
  const { signOut, user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [unitId, setUnitId] = useState<string | null>(null);

  // Get kitchen user's unit
  useEffect(() => {
    const getKitchenUnit = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("user_roles")
        .select("unit_id")
        .eq("user_id", user.id)
        .eq("role", "kitchen")
        .single();

      if (error) {
        console.error("Erro ao carregar unidade:", error);
        return;
      }

      setUnitId(data?.unit_id || null);
    };

    getKitchenUnit();
  }, [user]);

  const loadOrders = async () => {
    if (!unitId) {
      console.log("Kitchen: aguardando unit_id");
      return;
    }

    console.log("Kitchen: carregando pedidos da unidade:", unitId);

    // First, get all waiters from the same unit
    const { data: waiters, error: waitersError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("unit_id", unitId);

    if (waitersError) {
      console.error("Erro ao carregar garçons:", waitersError);
      return;
    }

    const waiterIds = waiters?.map((w) => w.id) || [];
    console.log(`Kitchen: encontrados ${waiterIds.length} garçons na unidade:`, waiters?.map(w => w.full_name));
    
    if (waiterIds.length === 0) {
      console.log("Kitchen: nenhum garçom encontrado na unidade");
      setOrders([]);
      return;
    }

    // Then get orders from those waiters
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        menu_items (name),
        tables (table_number),
        profiles!orders_waiter_id_fkey (full_name)
      `)
      .in("status", ["pending", "preparing"])
      .in("waiter_id", waiterIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar pedidos:", error);
      return;
    }

    console.log(`Kitchen: ${data?.length || 0} pedidos carregados da mesma unidade`);
    setOrders(data || []);
  };

  useEffect(() => {
    if (unitId) {
      loadOrders();

      // Realtime updates
      const channel = supabase
        .channel("orders-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [unitId]);

  const handleCompleteOrder = async (orderId: string) => {
    try {
      // Call the function to deduct stock
      const { error: stockError } = await supabase.rpc('deduct_stock_for_order', {
        order_id: orderId
      });

      if (stockError) {
        console.error('Stock deduction error:', stockError);
        toast.error("Erro ao dar baixa no estoque");
        return;
      }

      // Update order status
      const { error } = await supabase
        .from("orders")
        .update({
          status: "delivered",
          completed_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        toast.error("Erro ao confirmar saída");
        return;
      }

      toast.success("Saída confirmada e estoque atualizado!");
      loadOrders();
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error("Erro ao processar pedido");
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--kitchen-bg))" }}>
      <header className="border-b" style={{ backgroundColor: "hsl(var(--kitchen-card))" }}>
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-foreground">Cozinha - Pedidos</h1>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Fila de Pedidos ({orders.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Mais antigo no topo, mais recente embaixo
          </p>
        </div>

        <div className="space-y-4">
          {!unitId ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Você não está associado a nenhuma unidade
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhum pedido na fila
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                style={{ backgroundColor: "hsl(var(--kitchen-card))" }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-bold">
                        {order.menu_items?.name}
                      </h3>
                      <Badge variant="outline" className="text-base">
                        Qtd: {order.quantity}
                      </Badge>
                    </div>
                    
                    {order.observations && (
                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-sm font-medium mb-1">Observações:</p>
                        <p className="text-sm">
                          {order.observations}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-4 text-sm text-muted-foreground pt-2">
                      <div>
                        <span className="font-medium">Mesa:</span> {order.tables?.table_number}
                      </div>
                      <div>
                        <span className="font-medium">Garçom:</span> {order.profiles?.full_name}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleCompleteOrder(order.id)}
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Confirmar Saída
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, Table2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { TableList } from "@/components/waiter/TableList";
import { ClosedTableList } from "@/components/waiter/ClosedTableList";
import { NewTableDialog } from "@/components/waiter/NewTableDialog";
import { OrderDialog } from "@/components/waiter/OrderDialog";
import { WaiterDashboard } from "@/components/waiter/WaiterDashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateTableQRCodeUrl } from "@/lib/qrcode";
import { startOfDay, endOfDay } from "date-fns";

export default function Waiter() {
  const { signOut, user } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [newTableOpen, setNewTableOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [billQRUrl, setBillQRUrl] = useState<string | null>(null);
  const [billToken, setBillToken] = useState<string | null>(null);
  const [tablesServedToday, setTablesServedToday] = useState(0);
  const [totalSoldToday, setTotalSoldToday] = useState(0);
  const [userName, setUserName] = useState<string>("Garçom");

  const loadTables = async () => {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .order("table_number");

    if (error) {
      toast.error("Erro ao carregar mesas");
      return;
    }

    setTables(data || []);
  };

  const loadUserName = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setUserName(data.full_name);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;

    const todayStart = startOfDay(new Date()).toISOString();
    const todayEnd = endOfDay(new Date()).toISOString();

    // Count tables closed today by this waiter
    const { data: closedTables, error: closedError } = await supabase
      .from("tables")
      .select("id, total_amount")
      .eq("waiter_id", user.id)
      .eq("status", "closed")
      .gte("closed_at", todayStart)
      .lte("closed_at", todayEnd);

    if (closedError) {
      console.error("Error loading closed tables:", closedError);
    } else {
      setTablesServedToday(closedTables?.length || 0);
      const total = closedTables?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      setTotalSoldToday(total);
    }
  };

  useEffect(() => {
    loadTables();
    loadDashboardData();
    loadUserName();

    // Realtime updates
    const channel = supabase
      .channel("tables-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
        },
        () => {
          loadTables();
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleOpenTable = (table: any) => {
    setSelectedTable(table);
    setOrderDialogOpen(true);
  };

  const handleCloseTable = async (tableId: string) => {
    const { error } = await supabase
      .from("tables")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", tableId);

    if (error) {
      toast.error("Erro ao fechar mesa");
      return;
    }

    toast.success("Mesa fechada com sucesso!");
    loadTables();
    loadDashboardData();
  };

  const handleMarkWaitingPayment = async (tableId: string) => {
    try {
      const { data, error: tokenError } = await supabase.functions.invoke('generate-bill-token', {
        body: { tableId }
      });

      if (tokenError) throw tokenError;
      if (data?.error) throw new Error(data.error);

      const token = data.token;

      const { error: updateError } = await supabase
        .from("tables")
        .update({ status: "waiting_payment" })
        .eq("id", tableId);

      if (updateError) throw updateError;

      const qrUrl = generateTableQRCodeUrl(tableId, token);
      setBillQRUrl(qrUrl);
      setBillToken(token);
      setBillDialogOpen(true);

      toast.success("QR Code da conta gerado com sucesso!");
      loadTables();
    } catch (error: any) {
      console.error("Erro ao gerar conta:", error);
      toast.error(error.message || "Erro ao gerar conta");
    }
  };

  const handleGenerateReceipt = async (tableId: string) => {
    try {
      const { data, error: tokenError } = await supabase.functions.invoke('generate-bill-token', {
        body: { tableId }
      });

      if (tokenError) throw tokenError;
      if (data?.error) throw new Error(data.error);

      const token = data.token;

      const qrUrl = generateTableQRCodeUrl(tableId, token);
      setBillQRUrl(qrUrl);
      setBillToken(token);
      setBillDialogOpen(true);

      toast.success("Recibo gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar recibo:", error);
      toast.error(error.message || "Erro ao gerar recibo");
    }
  };

  // Filter tables for active (not closed) and closed
  const activeTables = tables.filter((t) => t.status !== "closed");
  const closedTables = tables.filter((t) => t.status === "closed");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-primary">{userName} - Mesas</h1>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <WaiterDashboard
          tablesServedToday={tablesServedToday}
          totalSoldToday={totalSoldToday}
        />

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gerenciar Mesas</h2>
          <Button onClick={() => setNewTableOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Mesa
          </Button>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              Mesas Ativas ({activeTables.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Mesas Fechadas ({closedTables.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <TableList
              tables={activeTables}
              onOpenTable={handleOpenTable}
              onCloseTable={handleCloseTable}
              onMarkWaitingPayment={handleMarkWaitingPayment}
            />
          </TabsContent>

          <TabsContent value="closed">
            <ClosedTableList
              tables={closedTables}
              onGenerateReceipt={handleGenerateReceipt}
            />
          </TabsContent>
        </Tabs>
      </main>

      <NewTableDialog
        open={newTableOpen}
        onOpenChange={setNewTableOpen}
        onSuccess={loadTables}
        waiterId={user?.id || ""}
      />

      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        table={selectedTable}
        onSuccess={loadTables}
      />

      <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Conta Digital</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Apresente este QR Code para o cliente visualizar a conta
            </p>
            {billQRUrl && (
              <div className="flex justify-center">
                <img 
                  src={billQRUrl} 
                  alt="QR Code da Conta" 
                  className="rounded-lg border-2 border-primary"
                />
              </div>
            )}
            <div className="rounded-lg bg-muted p-3">
              <p className="text-center text-xs font-mono break-all text-muted-foreground">
                {billToken}
              </p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <p className="text-xs text-muted-foreground mb-2 text-center">Link direto (para teste):</p>
              <a 
                href={billQRUrl ? decodeURIComponent(new URL(billQRUrl).searchParams.get('data') || '') : ''}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline break-all block text-center"
              >
                Abrir conta digital
              </a>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Token válido por 2 horas
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

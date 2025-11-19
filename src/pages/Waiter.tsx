import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { TableList } from "@/components/waiter/TableList";
import { NewTableDialog } from "@/components/waiter/NewTableDialog";
import { OrderDialog } from "@/components/waiter/OrderDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateTableQRCodeUrl } from "@/lib/qrcode";

export default function Waiter() {
  const { signOut, user } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [newTableOpen, setNewTableOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [billQRUrl, setBillQRUrl] = useState<string | null>(null);
  const [billToken, setBillToken] = useState<string | null>(null);

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

  useEffect(() => {
    loadTables();

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
  };

  const handleMarkWaitingPayment = async (tableId: string) => {
    try {
      // Generate bill token
      const { data, error: tokenError } = await supabase.functions.invoke('generate-bill-token', {
        body: { tableId }
      });

      if (tokenError) throw tokenError;
      if (data?.error) throw new Error(data.error);

      const token = data.token;

      // Update table status
      const { error: updateError } = await supabase
        .from("tables")
        .update({ status: "waiting_payment" })
        .eq("id", tableId);

      if (updateError) throw updateError;

      // Generate QR code URL
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-primary">Garçom - Mesas</h1>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gerenciar Mesas</h2>
          <Button onClick={() => setNewTableOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Mesa
          </Button>
        </div>

        <TableList
          tables={tables}
          onOpenTable={handleOpenTable}
          onCloseTable={handleCloseTable}
          onMarkWaitingPayment={handleMarkWaitingPayment}
        />
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
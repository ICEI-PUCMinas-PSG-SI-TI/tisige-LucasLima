import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt } from "lucide-react";

interface TableListProps {
  tables: any[];
  onOpenTable: (table: any) => void;
  onCloseTable: (tableId: string) => void;
  onMarkWaitingPayment: (tableId: string) => void;
}

export function TableList({ tables, onOpenTable, onCloseTable, onMarkWaitingPayment }: TableListProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      available: "outline",
      occupied: "default",
      waiting_payment: "secondary",
      closed: "destructive",
    };

    const labels: Record<string, string> = {
      available: "Disponível",
      occupied: "Ocupada",
      waiting_payment: "Aguardando Pagamento",
      closed: "Fechada",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tables.map((table) => (
        <Card key={table.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">Mesa {table.table_number}</CardTitle>
              {getStatusBadge(table.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {table.client_name && (
              <div>
                <p className="text-sm text-muted-foreground">Cliente:</p>
                <p className="font-medium">{table.client_name}</p>
              </div>
            )}
            {table.status === "occupied" && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Total:</p>
                  <p className="text-lg font-bold text-primary">
                    R$ {(table.total_amount || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => onOpenTable(table)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Item
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => onMarkWaitingPayment(table.id)}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      Aguardar Pgto
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => onCloseTable(table.id)}
                    >
                      Fechar Mesa
                    </Button>
                  </div>
                </div>
              </>
            )}
            {table.status === "waiting_payment" && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Total:</p>
                  <p className="text-lg font-bold text-primary">
                    R$ {(table.total_amount || 0).toFixed(2)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onCloseTable(table.id)}
                >
                  Fechar Mesa
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
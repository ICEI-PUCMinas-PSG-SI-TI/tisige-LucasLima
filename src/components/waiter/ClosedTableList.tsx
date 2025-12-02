import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClosedTableListProps {
  tables: any[];
  onGenerateReceipt: (tableId: string) => void;
}

export function ClosedTableList({ tables, onGenerateReceipt }: ClosedTableListProps) {
  if (tables.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma mesa fechada hoje.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tables.map((table) => (
        <Card key={table.id} className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">Mesa {table.table_number}</CardTitle>
              <Badge variant="destructive">Fechada</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {table.client_name && (
              <div>
                <p className="text-sm text-muted-foreground">Cliente:</p>
                <p className="font-medium">{table.client_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Total:</p>
              <p className="text-lg font-bold text-primary">
                R$ {(table.total_amount || 0).toFixed(2)}
              </p>
            </div>
            {table.closed_at && (
              <div>
                <p className="text-sm text-muted-foreground">Fechada em:</p>
                <p className="text-sm">
                  {format(new Date(table.closed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onGenerateReceipt(table.id)}
            >
              <Receipt className="mr-2 h-4 w-4" />
              Emitir Recibo
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileText, Loader2, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function SalesReport() {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    count: number;
  } | null>(null);

  const handleProcess = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha ambas as datas",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Query com joins para buscar dados completos
      const { data, error } = await supabase
        .from("tables")
        .select(`
          id,
          table_number,
          closed_at,
          total_amount,
          profiles:waiter_id(full_name),
          orders(
            quantity,
            menu_items(name)
          )
        `)
        .eq("status", "closed")
        .gte("closed_at", startDate)
        .lte("closed_at", endDate)
        .order("closed_at", { ascending: false });

      if (error) throw error;

      // Calcular totais para exibição
      const total = data.reduce((acc, table) => acc + (table.total_amount || 0), 0);
      const count = data.length;

      setResult({ total, count });

      // Gerar PDF
      generatePDF(data, startDate, endDate, total, count);

      toast({
        title: "Relatório gerado",
        description: "O PDF foi baixado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Falha ao processar o relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (data: any[], startDate: string, endDate: string, total: number, count: number) => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Vendas - FoodFlow", 105, 15, { align: "center" });

    // Subtítulo com período
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const formattedStart = new Date(startDate).toLocaleDateString("pt-BR");
    const formattedEnd = new Date(endDate).toLocaleDateString("pt-BR");
    doc.text(`Período: ${formattedStart} a ${formattedEnd}`, 105, 22, { align: "center" });

    // Resumo
    doc.setFontSize(10);
    doc.text(`Total de Mesas: ${count} | Total Geral: ${formatCurrency(total)}`, 105, 28, { align: "center" });

    // Preparar dados da tabela
    const tableData = data.map((table) => {
      // Formatar data/hora
      const dateTime = table.closed_at 
        ? new Date(table.closed_at).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A";

      // Nome do garçom
      const waiterName = table.profiles?.full_name || "Sem garçom";

      // Concatenar itens consumidos
      const items = table.orders && table.orders.length > 0
        ? table.orders
            .map((order: any) => {
              const itemName = order.menu_items?.name || "Item desconhecido";
              return `${order.quantity}x ${itemName}`;
            })
            .join(", ")
        : "Sem itens";

      // Valor total
      const totalValue = formatCurrency(table.total_amount || 0);

      return [
        dateTime,
        `Mesa ${table.table_number || "?"}`,
        waiterName,
        items,
        totalValue,
      ];
    });

    // Gerar tabela com autoTable
    autoTable(doc, {
      head: [["Data/Hora", "Mesa", "Garçom", "Itens Consumidos", "Total (R$)"]],
      body: tableData,
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 80 },
        4: { cellWidth: 25, halign: "right" },
      },
      margin: { left: 10, right: 10 },
    });

    // Salvar PDF
    doc.save("relatorio_vendas.pdf");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Gerar Relatório de Vendas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Relatório de Vendas</DialogTitle>
          <DialogDescription>
            Selecione o período para gerar o relatório financeiro
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="start-date">Data Início</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="end-date">Data Fim</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <Button
            onClick={handleProcess}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Gerar e Baixar PDF
              </>
            )}
          </Button>

          {result && (
            <div className="mt-4 rounded-lg border border-border bg-muted p-4">
              <h3 className="font-semibold text-lg mb-3">Resultado do Período</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total de Vendas:</span>
                  <span className="font-bold text-xl text-primary">
                    {formatCurrency(result.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Quantidade de Mesas:</span>
                  <span className="font-semibold text-lg">
                    {result.count}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

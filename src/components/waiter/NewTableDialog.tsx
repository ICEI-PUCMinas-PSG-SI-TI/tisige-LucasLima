import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  waiterId: string;
}

export function NewTableDialog({
  open,
  onOpenChange,
  onSuccess,
  waiterId,
}: NewTableDialogProps) {
  const [tableNumber, setTableNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("tables").insert({
        table_number: parseInt(tableNumber),
        client_name: clientName,
        status: "occupied",
        waiter_id: waiterId,
        opened_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Mesa aberta com sucesso!");
      setTableNumber("");
      setClientName("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao abrir mesa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir Nova Mesa</DialogTitle>
          <DialogDescription>
            Informe o número da mesa e o nome do cliente
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tableNumber">Número da Mesa</Label>
            <Input
              id="tableNumber"
              type="number"
              placeholder="Ex: 1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientName">Nome do Cliente</Label>
            <Input
              id="clientName"
              type="text"
              placeholder="Nome do responsável"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Abrindo..." : "Abrir Mesa"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
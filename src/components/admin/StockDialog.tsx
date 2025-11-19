import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: any;
  onSuccess: () => void;
}

export function StockDialog({
  open,
  onOpenChange,
  editingItem,
  onSuccess,
}: StockDialogProps) {
  const [nome, setNome] = useState("");
  const [unidadeDeMedida, setUnidadeDeMedida] = useState("");
  const [quantidadeAtual, setQuantidadeAtual] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setNome(editingItem.nome);
      setUnidadeDeMedida(editingItem.unidade_de_medida);
      setQuantidadeAtual(editingItem.quantidade_atual.toString());
    } else {
      setNome("");
      setUnidadeDeMedida("");
      setQuantidadeAtual("");
    }
  }, [editingItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        nome,
        unidade_de_medida: unidadeDeMedida,
        quantidade_atual: parseFloat(quantidadeAtual),
      };

      if (editingItem) {
        const { error } = await supabase
          .from("insumos")
          .update(data)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Insumo atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("insumos").insert(data);

        if (error) throw error;
        toast.success("Insumo criado com sucesso!");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar insumo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Editar Insumo" : "Novo Insumo"}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do insumo de estoque
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Insumo</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Ex: Carne Bovina"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unidade">Unidade de Medida</Label>
            <Select
              value={unidadeDeMedida}
              onValueChange={setUnidadeDeMedida}
              disabled={loading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Quilograma (kg)</SelectItem>
                <SelectItem value="g">Grama (g)</SelectItem>
                <SelectItem value="l">Litro (l)</SelectItem>
                <SelectItem value="ml">Mililitro (ml)</SelectItem>
                <SelectItem value="unidade">Unidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade Atual</Label>
            <Input
              id="quantidade"
              type="number"
              step="0.01"
              placeholder="0"
              value={quantidadeAtual}
              onChange={(e) => setQuantidadeAtual(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

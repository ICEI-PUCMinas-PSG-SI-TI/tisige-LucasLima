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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: any;
  onSuccess: () => void;
}

export function MenuItemDialog({
  open,
  onOpenChange,
  editingItem,
  onSuccess,
}: MenuItemDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [insumos, setInsumos] = useState<any[]>([]);
  const [recipe, setRecipe] = useState<{ insumo_id: string; quantidade: string }[]>([]);

  useEffect(() => {
    loadInsumos();
  }, []);

  const loadInsumos = async () => {
    const { data, error } = await supabase
      .from("insumos")
      .select("*")
      .order("nome");

    if (!error && data) {
      setInsumos(data);
    }
  };

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setDescription(editingItem.description || "");
      setCategory(editingItem.category);
      setPrice(editingItem.price.toString());
      setAvailable(editingItem.available);
      setRecipe(editingItem.recipe || []);
    } else {
      setName("");
      setDescription("");
      setCategory("");
      setPrice("");
      setAvailable(true);
      setRecipe([]);
    }
  }, [editingItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name,
        description: description || null,
        category,
        price: parseFloat(price),
        available,
        recipe: recipe.filter(r => r.insumo_id && r.quantidade),
      };

      if (editingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update(data)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Item atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("menu_items").insert(data);

        if (error) throw error;
        toast.success("Item criado com sucesso!");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar item");
    } finally {
      setLoading(false);
    }
  };

  const addRecipeItem = () => {
    setRecipe([...recipe, { insumo_id: "", quantidade: "" }]);
  };

  const removeRecipeItem = (index: number) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const updateRecipeItem = (index: number, field: "insumo_id" | "quantidade", value: string) => {
    const newRecipe = [...recipe];
    newRecipe[index][field] = value;
    setRecipe(newRecipe);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Editar Item" : "Novo Item do Cardápio"}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do item do cardápio
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Item</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: Hambúrguer Artesanal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descrição do item"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              type="text"
              placeholder="Ex: Lanches, Bebidas, Porções"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="available"
              checked={available}
              onCheckedChange={setAvailable}
              disabled={loading}
            />
            <Label htmlFor="available">Item disponível</Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ficha Técnica (Insumos)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRecipeItem}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Insumo
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recipe.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={item.insumo_id}
                    onValueChange={(value) => updateRecipeItem(index, "insumo_id", value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione o insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {insumos.map((insumo) => (
                        <SelectItem key={insumo.id} value={insumo.id}>
                          {insumo.nome} ({insumo.unidade_de_medida})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Qtd"
                    value={item.quantidade}
                    onChange={(e) => updateRecipeItem(index, "quantidade", e.target.value)}
                    disabled={loading}
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecipeItem(index)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {recipe.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum insumo adicionado
                </p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : editingItem ? "Atualizar" : "Criar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
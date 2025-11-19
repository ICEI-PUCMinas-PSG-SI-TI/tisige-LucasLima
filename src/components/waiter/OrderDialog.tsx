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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: any;
  onSuccess: () => void;
}

export function OrderDialog({
  open,
  onOpenChange,
  table,
  onSuccess,
}: OrderDialogProps) {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState("1");
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadMenuItems();
    }
  }, [open]);

  const loadMenuItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("available", true)
      .order("category");

    if (error) {
      toast.error("Erro ao carregar cardápio");
      return;
    }

    setMenuItems(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !table || !user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("orders").insert({
        table_id: table.id,
        menu_item_id: selectedItem.id,
        quantity: parseInt(quantity),
        observations: observations || null,
        waiter_id: user.id,
        item_price: selectedItem.price,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Pedido enviado para a cozinha!");
      setSelectedItem(null);
      setQuantity("1");
      setObservations("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer pedido");
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Fazer Pedido - Mesa {table?.table_number}
          </DialogTitle>
          <DialogDescription>
            Selecione um item do cardápio e informe a quantidade
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-2 block">Cardápio Digital</Label>
            <ScrollArea className="h-[400px] rounded-md border p-2">
              {(Object.entries(groupedItems) as [string, any[]][]).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <h3 className="mb-2 font-semibold text-primary">{category}</h3>
                  <div className="space-y-2">
                    {items.map((item: any) => (
                      <Card
                        key={item.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedItem?.id === item.id
                            ? "border-primary ring-2 ring-primary"
                            : ""
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <p className="font-bold text-primary">
                              R$ {item.price.toFixed(2)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedItem && (
              <Card className="border-primary">
                <CardContent className="p-3">
                  <p className="font-medium">Item Selecionado:</p>
                  <p className="text-sm text-muted-foreground">{selectedItem.name}</p>
                  <p className="mt-1 font-bold text-primary">
                    R$ {selectedItem.price.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                disabled={loading || !selectedItem}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações (opcional)</Label>
              <Textarea
                id="observations"
                placeholder="Ex: Sem cebola, ponto da carne mal passado..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                disabled={loading || !selectedItem}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !selectedItem}
            >
              {loading ? "Enviando..." : "Enviar Pedido"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
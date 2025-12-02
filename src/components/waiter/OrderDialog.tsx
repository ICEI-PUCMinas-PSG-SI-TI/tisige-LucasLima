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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Minus, Trash2, ShoppingCart, Send } from "lucide-react";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: any;
  onSuccess: () => void;
}

interface CartItem {
  menuItem: any;
  quantity: number;
  observations: string;
}

export function OrderDialog({
  open,
  onOpenChange,
  table,
  onSuccess,
}: OrderDialogProps) {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemForObs, setSelectedItemForObs] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadMenuItems();
      setCart([]);
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

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1, observations: "" }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === itemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const updateObservations = (itemId: string, observations: string) => {
    setCart((prev) =>
      prev.map((c) =>
        c.menuItem.id === itemId ? { ...c, observations } : c
      )
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  const handleSubmit = async () => {
    if (cart.length === 0 || !table || !user) return;

    setLoading(true);

    try {
      const orders = cart.map((item) => ({
        table_id: table.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        observations: item.observations || null,
        waiter_id: user.id,
        item_price: item.menuItem.price,
        status: "pending" as const,
      }));

      const { error } = await supabase.from("orders").insert(orders);

      if (error) throw error;

      toast.success(`${cart.length} pedido(s) enviado(s) para a cozinha!`);
      setCart([]);
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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Fazer Pedido - Mesa {table?.table_number}
          </DialogTitle>
          <DialogDescription>
            Selecione os itens do cardápio e revise antes de enviar
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Menu */}
          <div>
            <Label className="mb-2 block">Cardápio Digital</Label>
            <ScrollArea className="h-[400px] rounded-md border p-2">
              {(Object.entries(groupedItems) as [string, any[]][]).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <h3 className="mb-2 font-semibold text-primary">{category}</h3>
                  <div className="space-y-2">
                    {items.map((item: any) => {
                      const inCart = cart.find((c) => c.menuItem.id === item.id);
                      return (
                        <Card
                          key={item.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            inCart ? "border-primary ring-1 ring-primary" : ""
                          }`}
                          onClick={() => addToCart(item)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{item.name}</p>
                                  {inCart && (
                                    <Badge variant="secondary" className="text-xs">
                                      {inCart.quantity}x
                                    </Badge>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-primary">
                                  R$ {item.price.toFixed(2)}
                                </p>
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Cart */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4" />
              <Label>Pedido ({cart.length} itens)</Label>
            </div>
            <ScrollArea className="h-[320px] rounded-md border p-2 flex-1">
              {cart.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Clique nos itens para adicionar ao pedido
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <Card key={item.menuItem.id} className="p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.menuItem.name}</p>
                          <p className="text-xs text-primary font-semibold">
                            R$ {(item.menuItem.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.menuItem.id, -1);
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.menuItem.id, 1);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(item.menuItem.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {selectedItemForObs === item.menuItem.id ? (
                        <Textarea
                          className="mt-2 text-xs"
                          placeholder="Observações (ex: sem cebola)"
                          value={item.observations}
                          onChange={(e) =>
                            updateObservations(item.menuItem.id, e.target.value)
                          }
                          onBlur={() => setSelectedItemForObs(null)}
                          autoFocus
                          rows={2}
                        />
                      ) : (
                        <button
                          className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedItemForObs(item.menuItem.id)}
                        >
                          {item.observations || "+ Adicionar observação"}
                        </button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center px-2">
                <span className="font-medium">Total do pedido:</span>
                <span className="text-lg font-bold text-primary">
                  R$ {cartTotal.toFixed(2)}
                </span>
              </div>
              <Button
                className="w-full"
                disabled={loading || cart.length === 0}
                onClick={handleSubmit}
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Enviando..." : `Enviar ${cart.length} Pedido(s)`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const DemoDataButton = () => {
  const [loading, setLoading] = useState(false);

  const generateDemoData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // 1. Insert Menu Items
      const menuItems = [
        { name: "X-Burger Especial", category: "Lanches", price: 32.90, description: "Hambúrguer artesanal 180g, queijo cheddar, bacon crocante.", available: true },
        { name: "Coca-Cola Lata", category: "Bebidas", price: 6.00, description: "350ml gelada", available: true },
        { name: "Porção de Batata", category: "Porções", price: 25.00, available: true },
        { name: "Suco de Laranja", category: "Bebidas", price: 12.00, available: true },
        { name: "Pudim de Leite", category: "Sobremesas", price: 15.00, available: true }
      ];

      const { data: insertedMenuItems, error: menuError } = await supabase
        .from("menu_items")
        .insert(menuItems)
        .select();

      if (menuError) throw menuError;

      // 2. Insert Insumos
      const insumos = [
        { nome: "Pão de Hambúrguer", quantidade_atual: 50, unidade_de_medida: "un" },
        { nome: "Carne Moída", quantidade_atual: 4, unidade_de_medida: "kg" },
        { nome: "Refrigerantes", quantidade_atual: 8, unidade_de_medida: "cx" }
      ];

      const { error: insumosError } = await supabase
        .from("insumos")
        .insert(insumos);

      if (insumosError) throw insumosError;

      // 3. Insert Tables
      const tables = [
        { 
          table_number: 101, 
          status: "occupied" as const, 
          client_name: "Mesa Diretoria", 
          total_amount: 156.90, 
          waiter_id: user.id, 
          opened_at: new Date().toISOString() 
        },
        { 
          table_number: 102, 
          status: "waiting_payment" as const, 
          client_name: "Cliente João", 
          total_amount: 45.00, 
          waiter_id: user.id, 
          opened_at: new Date().toISOString() 
        },
        { 
          table_number: 103, 
          status: "available" as const, 
          waiter_id: user.id 
        }
      ];

      const { data: insertedTables, error: tablesError } = await supabase
        .from("tables")
        .insert(tables)
        .select();

      if (tablesError) throw tablesError;

      // 4. Insert Orders (linked to Table 1)
      if (insertedTables && insertedTables.length > 0 && insertedMenuItems && insertedMenuItems.length >= 3) {
        const mesa1Id = insertedTables[0].id;
        
        const orders = [
          {
            table_id: mesa1Id,
            menu_item_id: insertedMenuItems[0].id,
            quantity: 2,
            status: "preparing" as const,
            waiter_id: user.id,
            item_price: insertedMenuItems[0].price
          },
          {
            table_id: mesa1Id,
            menu_item_id: insertedMenuItems[1].id,
            quantity: 3,
            status: "preparing" as const,
            waiter_id: user.id,
            item_price: insertedMenuItems[1].price
          },
          {
            table_id: mesa1Id,
            menu_item_id: insertedMenuItems[2].id,
            quantity: 1,
            status: "pending" as const,
            waiter_id: user.id,
            item_price: insertedMenuItems[2].price
          }
        ];

        const { error: ordersError } = await supabase
          .from("orders")
          .insert(orders);

        if (ordersError) throw ordersError;
      }

      toast.success("Dados de demonstração gerados!");
    } catch (error: any) {
      console.error("Erro ao gerar dados:", error);
      toast.error("Erro ao gerar dados de demonstração");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={generateDemoData} 
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Database className="h-4 w-4" />
      {loading ? "Gerando..." : "Gerar Dados Demo"}
    </Button>
  );
};

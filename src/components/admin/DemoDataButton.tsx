import { Button } from "@/components/ui/button";
import { Database, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const DemoDataButton = () => {
  const [seedLoading, setSeedLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const handleSeed = async () => {
    setSeedLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data, error } = await supabase.functions.invoke('seed-database', {
        body: { action: 'seed' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        if (data.stats) {
          console.log('Estatísticas do seeding:', data.stats);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Erro ao popular banco:", error);
      toast.error(error.message || "Erro ao popular banco de dados");
    } finally {
      setSeedLoading(false);
    }
  };

  const handleClear = async () => {
    setClearLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data, error } = await supabase.functions.invoke('seed-database', {
        body: { action: 'clear' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Erro ao limpar dados:", error);
      toast.error(error.message || "Erro ao limpar dados de demonstração");
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="default"
            size="sm"
            className="gap-2"
            disabled={seedLoading || clearLoading}
          >
            {seedLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {seedLoading ? "Populando..." : "Popular Banco (Demo)"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Popular Banco de Dados</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá criar dados de demonstração incluindo:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>2 Unidades (Savassi e Prado)</li>
                <li>2 Usuários de Cozinha</li>
                <li>20 Garçons</li>
                <li>20 Insumos no estoque</li>
                <li>30 Itens no cardápio</li>
                <li>Vendas históricas de Novembro/2025</li>
              </ul>
              <p className="mt-2 text-amber-600 font-medium">
                Senha padrão dos usuários: SenhaForte12345
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeed}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive"
            size="sm"
            className="gap-2"
            disabled={seedLoading || clearLoading}
          >
            {clearLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {clearLoading ? "Limpando..." : "Limpar Dados Demo"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Dados de Demonstração</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-destructive font-semibold">ATENÇÃO: Esta ação é irreversível!</span>
              <p className="mt-2">
                Serão removidos TODOS os dados do banco, incluindo:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todos os pedidos e mesas</li>
                <li>Todos os itens do cardápio</li>
                <li>Todo o estoque (insumos)</li>
                <li>Todos os usuários (garçons e cozinhas)</li>
              </ul>
              <p className="mt-2 text-green-600 font-medium">
                O usuário lucas@adm.com será preservado.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

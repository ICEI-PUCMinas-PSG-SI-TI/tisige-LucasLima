import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KitchenDialog } from "./KitchenDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Kitchen {
  id: string;
  full_name: string;
  unit_id: string | null;
  unit_name: string | null;
}

export function KitchenManagement() {
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [selectedKitchen, setSelectedKitchen] = useState<Kitchen | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [kitchenToDelete, setKitchenToDelete] = useState<Kitchen | null>(null);

  useEffect(() => {
    loadKitchens();
  }, []);

  const loadKitchens = async () => {
    try {
      // First, get all profiles with KITCHEN- prefix
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, unit_id")
        .like("full_name", "KITCHEN-%");

      if (profilesError) {
        console.error("Error loading kitchen profiles:", profilesError);
        toast.error("Erro ao carregar cozinhas");
        return;
      }

      console.log("Kitchen profiles found:", profilesData);

      if (!profilesData || profilesData.length === 0) {
        setKitchens([]);
        return;
      }

      // Filter out soft-deleted profiles
      const activeProfiles = profilesData.filter(p => !p.unit_id || p.unit_id !== null);

      // Get unit names for each profile
      const kitchensWithUnits = await Promise.all(
        activeProfiles.map(async (profile) => {
          if (!profile.unit_id) {
            return {
              id: profile.id,
              full_name: profile.full_name,
              unit_id: null,
              unit_name: null,
            };
          }

          const { data: unitData } = await supabase
            .from("units")
            .select("name")
            .eq("id", profile.unit_id)
            .single();

          return {
            id: profile.id,
            full_name: profile.full_name,
            unit_id: profile.unit_id,
            unit_name: unitData?.name || null,
          };
        })
      );

      console.log("Kitchens with units:", kitchensWithUnits);
      setKitchens(kitchensWithUnits);
    } catch (error) {
      console.error("Error in loadKitchens:", error);
      toast.error("Erro ao carregar cozinhas");
    }
  };

  const handleEdit = (kitchen: Kitchen) => {
    setSelectedKitchen(kitchen);
    setDialogOpen(true);
  };

  const handleDelete = (kitchen: Kitchen) => {
    setKitchenToDelete(kitchen);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!kitchenToDelete) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/soft-delete-user`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: kitchenToDelete.id }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao excluir cozinha");
      }

      toast.success("Cozinha excluída");
      loadKitchens();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteDialogOpen(false);
      setKitchenToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cozinhas</CardTitle>
            <Button onClick={() => { setSelectedKitchen(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Cozinha
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identificador</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kitchens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhuma cozinha cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                kitchens.map((kitchen) => (
                  <TableRow key={kitchen.id}>
                    <TableCell>{kitchen.full_name.replace("KITCHEN-", "")}</TableCell>
                    <TableCell>{kitchen.unit_name || "Sem unidade"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(kitchen)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(kitchen)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <KitchenDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kitchen={selectedKitchen}
        onSuccess={loadKitchens}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta cozinha? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

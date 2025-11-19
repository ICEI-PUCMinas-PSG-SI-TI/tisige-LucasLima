import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { UnitDialog } from "./UnitDialog";

export function UnitsManagement() {
  const [units, setUnits] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  const loadUnits = async () => {
    const { data, error } = await supabase
      .from("units")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Erro ao carregar unidades");
      return;
    }

    setUnits(data || []);
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const handleEdit = (unit: any) => {
    setSelectedUnit(unit);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setSelectedUnit(null);
    }
    setDialogOpen(open);
  };

  const handleDelete = async (unitId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta unidade?")) return;

    try {
      const { error } = await supabase
        .from("units")
        .delete()
        .eq("id", unitId);

      if (error) throw error;

      toast.success("Unidade excluída com sucesso!");
      loadUnits();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir unidade");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Unidades</h2>
        <Button onClick={() => { setSelectedUnit(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Unidade
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <Card key={unit.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{unit.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(unit)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDelete(unit.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <UnitDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        onSuccess={loadUnits}
        unit={selectedUnit}
      />
    </div>
  );
}

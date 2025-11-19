import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Kitchen {
  id: string;
  full_name: string;
  unit_id: string | null;
}

interface Unit {
  id: string;
  name: string;
}

interface KitchenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kitchen: Kitchen | null;
  onSuccess: () => void;
}

export function KitchenDialog({ open, onOpenChange, kitchen, onSuccess }: KitchenDialogProps) {
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");

  useEffect(() => {
    if (open) {
      loadUnits();
      if (kitchen) {
        // Extract identifier from full_name (format: KITCHEN-{identifier})
        const id = kitchen.full_name.replace("KITCHEN-", "");
        setIdentifier(id);
        setUnitId(kitchen.unit_id || "");
      } else {
        setIdentifier("");
        setUnitId("");
      }
    }
  }, [open, kitchen]);

  const loadUnits = async () => {
    const { data } = await supabase.from("units").select("id, name");
    if (data) setUnits(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!unitId) {
        toast.error("Selecione uma unidade");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        return;
      }

      const endpoint = kitchen
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-kitchen`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-kitchen`;

      const payload = kitchen
        ? { user_id: kitchen.id, unit_id: unitId }
        : { unit_id: unitId };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar cozinha");
      }

      if (!kitchen && result.identifier) {
        toast.success(`Cozinha criada com identificador: ${result.identifier}`, {
          duration: 8000,
        });
      } else {
        toast.success("Cozinha atualizada");
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kitchen ? "Editar Cozinha" : "Nova Cozinha"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {kitchen && (
            <div>
              <Label>Identificador (senha)</Label>
              <Input
                type="text"
                value={identifier}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground mt-1">
                O identificador não pode ser alterado
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="unit">Unidade</Label>
            <Select value={unitId} onValueChange={setUnitId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!kitchen && (
            <p className="text-sm text-muted-foreground">
              Um identificador de 5 dígitos será gerado automaticamente
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

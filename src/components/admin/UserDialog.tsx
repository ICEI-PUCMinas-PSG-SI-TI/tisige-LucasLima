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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(128, "Senha muito longa"),
  fullName: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  role: z.enum(["waiter", "kitchen"]),
  unitId: z.string().uuid("ID de unidade inválido").optional(),
});

const updateUserSchema = z.object({
  fullName: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  role: z.enum(["waiter", "kitchen"]),
  unitId: z.string().uuid("ID de unidade inválido").optional(),
});

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user?: any;
}

export function UserDialog({ open, onOpenChange, onSuccess, user }: UserDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"waiter" | "kitchen">("waiter");
  const [unitId, setUnitId] = useState<string>("");
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUnits();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setRole(user.role || "waiter");
      setUnitId(user.unit_id || "");
    } else {
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("waiter");
      setUnitId("");
    }
  }, [user]);

  const loadUnits = async () => {
    const { data, error } = await supabase
      .from("units")
      .select("*")
      .order("name");

    if (!error && data) {
      setUnits(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (user) {
      const result = updateUserSchema.safeParse({ fullName, role, unitId: unitId || undefined });
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        return;
      }
    } else {
      const result = createUserSchema.safeParse({ 
        email, 
        password, 
        fullName, 
        role, 
        unitId: unitId || undefined 
      });
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        return;
      }
    }
    
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão não encontrada");
      }

      if (user) {
        // Update existing user
        const { data, error } = await supabase.functions.invoke('update-user', {
          body: {
            userId: user.id,
            fullName,
            role,
            unitId: unitId || null,
          },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Erro ao atualizar usuário");

        toast.success("Usuário atualizado com sucesso!");
      } else {
        // Create new user
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email,
            password,
            fullName,
            role,
            unitId: unitId || null,
          },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Erro ao criar usuário");

        toast.success("Usuário criado com sucesso!");
      }

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("waiter");
      setUnitId("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao processar usuário:", error);
      toast.error(error.message || "Erro ao processar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Criar Novo Usuário"}</DialogTitle>
          <DialogDescription>
            {user ? "Atualize os dados do usuário" : "Preencha os dados do novo usuário do sistema"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Nome do usuário"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {!user && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select value={role} onValueChange={(value: any) => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="waiter">Garçom</SelectItem>
                <SelectItem value="kitchen">Cozinha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (user ? "Atualizando..." : "Criando...") : (user ? "Atualizar Usuário" : "Criar Usuário")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserDialog } from "./UserDialog";

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const loadUsers = async () => {
    try {
      // Load all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, unit_id, deleted_at, units(name)");

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        toast.error("Erro ao carregar usuários");
        return;
      }

      console.log("Profiles loaded:", profilesData);

      // Filter out deleted profiles and kitchens
      const activeProfiles = profilesData?.filter(
        (p) => !p.deleted_at && !p.full_name.startsWith("KITCHEN-")
      ) || [];

      console.log("Active profiles (non-kitchen):", activeProfiles);

      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) {
        console.error("Error loading roles:", rolesError);
        toast.error("Erro ao carregar roles");
        return;
      }

      console.log("Roles loaded:", rolesData);

      // Combine profiles with roles
      const usersWithRoles = activeProfiles.map((profile) => {
        const userRole = rolesData?.find((role) => role.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || null,
          unit_name: profile.units?.name || null,
        };
      });

      console.log("Users with roles:", usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error in loadUsers:", error);
      toast.error("Erro ao carregar usuários");
    }
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setSelectedUser(null);
    }
    setDialogOpen(open);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja desativar este usuário? Esta ação pode ser revertida.")) return;

    try {
      // Get the current session to use for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão não encontrada");
      }

      // Call the edge function to soft delete the user
      const { data, error } = await supabase.functions.invoke('soft-delete-user', {
        body: { userId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao excluir usuário");

      toast.success("Usuário desativado com sucesso!");
      loadUsers();
    } catch (error: any) {
      console.error("Erro ao desativar usuário:", error);
      toast.error(error.message || "Erro ao desativar usuário");
    }
  };

  const getRoleBadge = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      waiter: "Garçom",
      kitchen: "Cozinha",
    };

    return <Badge>{labels[role] || role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
        <Button onClick={() => { setSelectedUser(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{user.full_name}</CardTitle>
                {user.role && getRoleBadge(user.role)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.unit_name && (
                <p className="text-sm text-muted-foreground">
                  Unidade: <span className="font-medium">{user.unit_name}</span>
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(user)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDelete(user.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Desativar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        onSuccess={loadUsers}
        user={selectedUser}
      />
    </div>
  );
}
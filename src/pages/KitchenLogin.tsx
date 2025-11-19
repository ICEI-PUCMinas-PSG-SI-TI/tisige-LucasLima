import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoAuth from "@/assets/logo_auth.png";

export default function KitchenLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!identifier || identifier.length !== 5) {
        toast.error("Digite um identificador válido de 5 dígitos");
        return;
      }

      // Login using internal email format
      const email = `kitchen-${identifier}@ponto-de-fuga.internal`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: identifier,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Identificador inválido");
        } else {
          toast.error("Erro ao fazer login");
        }
        return;
      }

      // Verify user has kitchen role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "kitchen")
        .single();

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error("Acesso negado");
        return;
      }

      toast.success("Login realizado com sucesso");
      navigate("/kitchen");
    } catch (error: any) {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-0">
          <div className="flex justify-center mb-2">
            <img src={logoAuth} alt="Logo" className="h-24 w-auto" />
          </div>
          <CardTitle className="text-2xl text-center">Acesso da Cozinha</CardTitle>
          <CardDescription className="text-center mt-2">
            Digite o identificador de 5 dígitos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Identificador</Label>
              <Input
                id="identifier"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ""))}
                placeholder="00000"
                className="text-center text-2xl tracking-widest"
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo_auth.png";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if (count === 0) {
        navigate("/setup");
      }
    } catch (error) {
      console.error("Error checking setup:", error);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4 text-center">
      <div className="mx-auto mb-6">
        <img src={logo} alt="Ponto de Fuga" className="h-64 w-auto object-contain" />
      </div>
      <h1 className="mb-4 text-4xl font-bold text-primary md:text-5xl">FoodFlow ERP</h1>
      <p className="mb-8 max-w-md text-lg text-muted-foreground">Sistema de Gestão</p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button size="lg" onClick={() => navigate("/auth")}>
          Acessar Sistema
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate("/kitchen-login")}>
          Acesso Cozinha
        </Button>
      </div>
    </div>
  );
};

export default Index;

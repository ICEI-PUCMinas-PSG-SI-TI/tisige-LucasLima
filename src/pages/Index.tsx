import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo_auth.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4 text-center">
      <div className="mx-auto mb-6">
        <img src={logo} alt="FoodFlow" className="h-64 w-auto object-contain" />
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

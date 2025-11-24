import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Receipt, AlertCircle } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const phoneSchema = z.object({
  phone: z.string().trim().regex(/^(\(?\d{2}\)?\s?)?(9\d{4}-?\d{4}|\d{4}-?\d{4})$/, "Formato inválido. Use: (XX) XXXXX-XXXX"),
});

export default function Bill() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [table, setTable] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [phone, setPhone] = useState("");
  const [acceptsPromotions, setAcceptsPromotions] = useState(false);

  // Clear phone when checkbox is unchecked
  useEffect(() => {
    if (!acceptsPromotions) {
      setPhone("");
    }
  }, [acceptsPromotions]);
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Bill page loaded:", { tableId, token });
    loadBillData();
  }, [tableId, token]);

  const loadBillData = async () => {
    if (!tableId || !token) {
      setError("Link inválido. Solicite um novo link ao garçom.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Loading bill data...", { tableId, token });
      
      // Validate token and load data through secure edge function
      const { data, error: functionError } = await supabase.functions.invoke('get-bill-data', {
        body: {
          tableId,
          token,
        }
      });

      console.log("Edge function response:", { data, error: functionError });

      if (functionError) {
        console.error("Function error:", functionError);
        throw functionError;
      }
      if (data?.error) {
        console.error("Data error:", data.error);
        throw new Error(data.error);
      }

      console.log("Bill data loaded successfully:", { 
        table: data.table, 
        ordersCount: data.orders?.length 
      });

      setTable(data.table);
      setOrders(data.orders || []);
    } catch (error: any) {
      console.error("Erro ao carregar conta:", error);
      setError(error.message || "Erro ao carregar conta. O link pode estar expirado.");
    } finally {
      setLoading(false);
    }
  };

  const handleConsentSubmit = async () => {
    // Validate phone is required when consent is given
    if (acceptsPromotions && !phone.trim()) {
      toast.error("Telefone é obrigatório para receber promoções");
      return;
    }

    // Validate phone format when provided and consent is given
    if (acceptsPromotions && phone.trim()) {
      const result = phoneSchema.safeParse({ phone });
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        return;
      }
    }
    
    setLoading(true);

    try {
      // Call the secure edge function to submit consent
      const { data, error: consentError } = await supabase.functions.invoke('submit-consent', {
        body: {
          tableId,
          phone: acceptsPromotions ? phone.trim() : null,
          consentGiven: acceptsPromotions,
        }
      });

      if (consentError) throw consentError;
      if (data?.error) throw new Error(data.error);

      // Update table status to waiting_payment
      const { error: tableError } = await supabase
        .from("tables")
        .update({ status: "waiting_payment" })
        .eq("id", tableId);

      if (tableError) throw tableError;

      setConsentGiven(acceptsPromotions);
      toast.success("Preferências registradas!");
    } catch (error: any) {
      console.error("Erro ao registrar preferências:", error);
      toast.error(error.message || "Erro ao registrar preferências");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-center text-2xl">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Link Inválido ou Expirado</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-center text-sm text-muted-foreground">
              Por favor, solicite um novo link ao garçom para visualizar sua conta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !table) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium">Carregando sua conta...</p>
        </div>
        <p className="text-sm text-muted-foreground">Por favor, aguarde alguns instantes</p>
      </div>
    );
  }

  if (consentGiven !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Receipt className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Obrigado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Suas preferências foram registradas com sucesso.
            </p>
            <div className="rounded-lg bg-primary/10 p-4">
              <p className="text-lg font-bold text-primary">
                Dirija-se ao caixa para efetuar o pagamento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Receipt className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Conta Digital</CardTitle>
            <p className="text-muted-foreground">
              Mesa {table.table_number} - {table.client_name}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold">Itens Consumidos</h3>
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div>
                      <p className="font-medium">{order.menu_items?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qtd: {order.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-primary">
                      R$ {(order.item_price * order.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-primary">
                  R$ {(table.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="font-semibold">Promoções via WhatsApp</h3>
              
              <div className="flex items-start space-x-3 rounded-lg bg-muted/50 p-3">
                <Checkbox
                  id="consent"
                  checked={acceptsPromotions}
                  onCheckedChange={(checked) => setAcceptsPromotions(checked === true)}
                  disabled={loading}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="consent" 
                    className="cursor-pointer text-sm font-normal leading-relaxed"
                  >
                    Aceito receber promoções via WhatsApp
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className={!acceptsPromotions ? "text-muted-foreground" : ""}>
                  Telefone {acceptsPromotions && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!acceptsPromotions || loading}
                  required={acceptsPromotions}
                />
                <p className="text-xs text-muted-foreground">
                  Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleConsentSubmit}
                disabled={loading}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
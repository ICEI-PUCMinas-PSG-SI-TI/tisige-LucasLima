const handleProcess = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha ambas as datas",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Ajustar endDate para incluir o dia completo
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      const adjustedEndDate = end.toISOString().split('T')[0]; // Formato YYYY-MM-DD do dia seguinte

      // Query corrigida
      const { data, error } = await supabase
        .from("tables")
        .select(`
          id,
          table_number,
          closed_at,
          total_amount,
          profiles:waiter_id(full_name),
          orders:orders!orders_table_id_fkey(
            quantity,
            menu_items(name)
          )
        `)
        .eq("status", "closed")
        .gte("closed_at", startDate) // Maior ou igual data inicio
        .lt("closed_at", adjustedEndDate) // MENOR que o dia seguinte (pega tudo do dia atual)
        .order("closed_at", { ascending: false });

      if (error) throw error;

      // Calcular totais
      const total = data.reduce((acc, table) => acc + (table.total_amount || 0), 0);
      const count = data.length;

      setResult({ total, count });

      // Gerar PDF
      generatePDF(data, startDate, endDate, total, count);

      toast({
        title: "Relatório gerado",
        description: `${count} vendas encontradas. PDF baixado.`,
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Falha ao processar o relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
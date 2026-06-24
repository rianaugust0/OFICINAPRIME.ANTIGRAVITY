import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, Plus, CircleDollarSign, Loader2, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { formatBRL } from "@/lib/utils";
import FinancialDashboard from "./FinancialDashboard";

type Transaction = {
  id: string;
  type: "receita" | "despesa";
  category: string;
  description: string;
  amount: number;
  date: string;
  status: "pago" | "pendente";
};

export default function Finance() {
  const { workshopId } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"receita" | "despesa">("despesa");

  // Filter state
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", workshopId, month, year],
    enabled: !!workshopId,
    queryFn: async () => {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("workshop_id", workshopId!)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const addMut = useMutation({
    mutationFn: async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const val = fd.get("amount") as string;
      const amount = parseFloat(val.replace(/\./g, "").replace(",", "."));
      
      const tx = {
        workshop_id: workshopId!,
        type,
        category: fd.get("category") as string,
        description: fd.get("description") as string,
        amount,
        date: fd.get("date") as string,
        status: fd.get("status") as string,
      };

      const { error } = await supabase.from("transactions").insert(tx);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação adicionada com sucesso!");
      setOpen(false);
    },
    onError: (err) => toast.error("Erro ao salvar: " + err.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação excluída!");
    }
  });

  // Calculate stats
  const safeTx = transactions || [];
  const paidIncome = safeTx.filter(t => t.type === "receita" && t.status === "pago").reduce((acc, t) => acc + Number(t.amount), 0);
  const paidExpense = safeTx.filter(t => t.type === "despesa" && t.status === "pago").reduce((acc, t) => acc + Number(t.amount), 0);
  const profit = paidIncome - paidExpense;
  
  const pendingIncome = safeTx.filter(t => t.type === "receita" && t.status === "pendente").reduce((acc, t) => acc + Number(t.amount), 0);
  const pendingExpense = safeTx.filter(t => t.type === "despesa" && t.status === "pendente").reduce((acc, t) => acc + Number(t.amount), 0);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-secondary/30">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-semibold tracking-tight">Financeiro</h1>
            </div>
          </header>

          <Tabs defaultValue="fluxo" className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 md:px-8 pt-4">
              <TabsList className="bg-secondary/50 border border-border/50">
                <TabsTrigger value="fluxo">Lançamentos de Caixa</TabsTrigger>
                <TabsTrigger value="geral">Visão Geral (Faturamento)</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="geral" className="flex-1 overflow-y-auto m-0">
              <FinancialDashboard />
            </TabsContent>

            <TabsContent value="fluxo" className="p-4 md:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 m-0 mt-0">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-2 bg-background border border-border/50 rounded-lg p-1 shadow-sm">
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger className="w-[140px] border-0 bg-transparent focus:ring-0 shadow-none font-medium">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}).map((_, i) => (
                      <SelectItem key={i+1} value={String(i+1)}>
                        {format(new Date(2000, i, 1), "MMMM", { locale: ptBR })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="w-px bg-border/50 my-2" />
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger className="w-[100px] border-0 bg-transparent focus:ring-0 shadow-none font-medium">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl">
                    <Plus className="w-4 h-4" /> Novo Lançamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Lançar Transação</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => addMut.mutate(e)} className="space-y-4 pt-4">
                    <div className="flex gap-2 p-1 bg-secondary rounded-lg">
                      <button type="button" onClick={() => setType("receita")} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${type === "receita" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground hover:text-foreground"}`}>Receita</button>
                      <button type="button" onClick={() => setType("despesa")} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${type === "despesa" ? "bg-background shadow-sm text-red-600" : "text-muted-foreground hover:text-foreground"}`}>Despesa</button>
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input name="description" placeholder={type === "receita" ? "Ex: Troca de Óleo - João" : "Ex: Conta de Luz"} required autoFocus />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input name="amount" placeholder="0,00" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Data</Label>
                        <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select name="category" defaultValue={type === "receita" ? "servico" : "fixa"}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {type === "receita" ? (
                              <>
                                <SelectItem value="servico">Serviço</SelectItem>
                                <SelectItem value="peca">Venda de Peça</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="fixa">Despesa Fixa (Luz, Aluguel)</SelectItem>
                                <SelectItem value="peca">Compra de Peças</SelectItem>
                                <SelectItem value="salario">Salários / Comissão</SelectItem>
                                <SelectItem value="imposto">Impostos</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select name="status" defaultValue="pago">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pago">Pago / Recebido</SelectItem>
                            <SelectItem value="pendente">Pendente / A Pagar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <DialogFooter className="pt-4">
                      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={addMut.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {addMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Lançamento"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/60 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-16 h-16 text-emerald-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Entradas (Pagas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-foreground tracking-tight">{formatBRL(paidIncome)}</div>
                  {pendingIncome > 0 && <p className="text-xs text-muted-foreground mt-1">+{formatBRL(pendingIncome)} a receber</p>}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingDown className="w-16 h-16 text-red-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" /> Saídas (Pagas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-foreground tracking-tight">{formatBRL(paidExpense)}</div>
                  {pendingExpense > 0 && <p className="text-xs text-muted-foreground mt-1">+{formatBRL(pendingExpense)} a pagar</p>}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm relative overflow-hidden group bg-gradient-to-br from-card to-secondary/30">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <CircleDollarSign className="w-16 h-16 text-primary" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" /> Lucro Líquido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-black tracking-tight ${profit > 0 ? "text-emerald-500" : profit < 0 ? "text-red-500" : "text-foreground"}`}>
                    {formatBRL(profit)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Balanço do mês atual</p>
                </CardContent>
              </Card>
            </div>

            {/* Extrato */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50 bg-secondary/10">
                <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                  Extrato do Mês
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto min-h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center p-12">
                     <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !transactions || transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 text-center">
                    <CircleDollarSign className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <h4 className="font-medium text-foreground">Nenhuma transação neste mês</h4>
                    <p className="text-sm text-muted-foreground mt-1">Lance receitas ou despesas para visualizar o fluxo de caixa.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium text-xs whitespace-nowrap">
                            {format(new Date(t.date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm text-foreground">{t.description}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-secondary/50">
                              {t.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {t.status === "pago" ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">PAGO</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">PENDENTE</Badge>
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-bold tabular-nums ${t.type === "receita" ? "text-emerald-500" : "text-red-500"}`}>
                            <div className="flex items-center justify-end gap-1">
                              {t.type === "receita" ? <ArrowUpRight className="w-3 h-3 opacity-70" /> : <ArrowDownRight className="w-3 h-3 opacity-70" />}
                              {formatBRL(t.amount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => {
                              if(confirm("Deseja excluir esta transação?")) delMut.mutate(t.id);
                            }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>

            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
}

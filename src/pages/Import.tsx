import { useState } from "react";
import Papa from "papaparse";
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const FIELDS = [
  { key: "cliente_nome", label: "Nome do cliente", required: true },
  { key: "cliente_telefone", label: "Telefone" },
  { key: "veiculo_marca", label: "Marca" },
  { key: "veiculo_modelo", label: "Modelo" },
  { key: "veiculo_placa", label: "Placa" },
  { key: "problema_relatado", label: "Problema relatado" },
  { key: "servico_realizado", label: "Serviço realizado" },
  { key: "valor", label: "Valor" },
  { key: "data", label: "Data (AAAA-MM-DD)" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

function autoMap(headers: string[]): Record<FieldKey, string> {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const map: Record<string, string> = {};
  const candidates: Record<FieldKey, string[]> = {
    cliente_nome: ["clientenome", "nome", "cliente", "customer"],
    cliente_telefone: ["clientetelefone", "telefone", "celular", "phone", "fone"],
    veiculo_marca: ["veiculomarca", "marca", "brand"],
    veiculo_modelo: ["veiculomodelo", "modelo", "model"],
    veiculo_placa: ["veiculoplaca", "placa", "plate"],
    problema_relatado: ["problemarelatado", "problema", "reclamacao", "defeito"],
    servico_realizado: ["servicorealizado", "servico", "service", "descricao"],
    valor: ["valor", "preco", "total", "amount"],
    data: ["data", "datadeentrada", "entrada", "date"],
  };
  const out = {} as Record<FieldKey, string>;
  for (const f of FIELDS) {
    const found = headers.find((h) => candidates[f.key].includes(norm(h)));
    if (found) out[f.key] = found;
  }
  return out;
}

interface RowError { row: number; reason: string; }

export default function Import() {
  const { workshopId } = useAuth();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({} as Record<FieldKey, string>);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: RowError[] } | null>(null);

  const handleFile = (file: File) => {
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = res.meta.fields ?? [];
        setHeaders(hdrs);
        setRows(res.data);
        setMapping(autoMap(hdrs));
        toast.success(`${res.data.length} linha(s) lida(s).`);
      },
      error: (err) => toast.error(`Erro ao ler CSV: ${err.message}`),
    });
  };

  const downloadTemplate = () => {
    const csv = FIELDS.map((f) => f.key).join(",") + "\n" +
      "João Silva,11999990000,Honda,Civic,ABC1D23,Barulho no motor,Troca de correia,450.00,2025-01-15\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "modelo-importacao.csv";
    a.click();
  };

  const runImport = async () => {
    if (!workshopId) return;
    if (!mapping.cliente_nome) {
      toast.error("Mapeie ao menos a coluna 'Nome do cliente'.");
      return;
    }
    setImporting(true);
    const errors: RowError[] = [];
    let success = 0;

    // Cache to avoid duplicates within the same import
    const clientCache = new Map<string, string>();
    const vehicleCache = new Map<string, string>();

    const get = (row: Record<string, string>, key: FieldKey) =>
      mapping[key] ? (row[mapping[key]] ?? "").toString().trim() : "";

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2; // +2 for header row & 1-indexed
      try {
        const name = get(row, "cliente_nome");
        if (!name) { errors.push({ row: lineNum, reason: "Nome do cliente vazio" }); continue; }

        const phone = get(row, "cliente_telefone") || null;
        const plateRaw = get(row, "veiculo_placa").toUpperCase();
        const plate = plateRaw || null;
        const brand = get(row, "veiculo_marca") || "—";
        const model = get(row, "veiculo_modelo") || "—";
        const valor = parseFloat(get(row, "valor").replace(",", ".")) || 0;
        const dateStr = get(row, "data");
        const entryDate = dateStr ? new Date(dateStr).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        if (dateStr && isNaN(new Date(dateStr).getTime())) {
          errors.push({ row: lineNum, reason: `Data inválida: ${dateStr}` }); continue;
        }

        // 1) Client (find by name+phone or create)
        const clientKey = `${name.toLowerCase()}|${phone ?? ""}`;
        let clientId = clientCache.get(clientKey);
        if (!clientId) {
          const { data: existing } = await supabase
            .from("clients").select("id")
            .eq("workshop_id", workshopId).eq("name", name)
            .maybeSingle();
          if (existing) clientId = existing.id;
          else {
            const { data: created, error } = await supabase
              .from("clients").insert({ workshop_id: workshopId, name, phone })
              .select("id").single();
            if (error) throw error;
            clientId = created.id;
          }
          clientCache.set(clientKey, clientId!);
        }

        // 2) Vehicle (by plate within workshop, else create)
        const vehKey = plate ? `plate:${plate}` : `cm:${clientId}|${brand}|${model}`;
        let vehicleId = vehicleCache.get(vehKey);
        if (!vehicleId) {
          let existingVeh: { id: string } | null = null;
          if (plate) {
            const { data } = await supabase
              .from("vehicles").select("id")
              .eq("workshop_id", workshopId).eq("plate", plate)
              .maybeSingle();
            existingVeh = data;
          }
          if (existingVeh) vehicleId = existingVeh.id;
          else {
            const { data: created, error } = await supabase
              .from("vehicles").insert({
                workshop_id: workshopId, client_id: clientId!,
                brand, model, plate,
              }).select("id").single();
            if (error) throw error;
            vehicleId = created.id;
          }
          vehicleCache.set(vehKey, vehicleId!);
        }

        // 3) De-dup: skip if order exists for vehicle on same date with same amount
        const { data: dup } = await supabase
          .from("orders").select("id")
          .eq("workshop_id", workshopId)
          .eq("vehicle_id", vehicleId!)
          .eq("entry_date", entryDate)
          .eq("amount", valor)
          .maybeSingle();
        if (dup) { errors.push({ row: lineNum, reason: "OS duplicada (mesmo veículo, data e valor)" }); continue; }

        // 4) Order
        const { error: oErr } = await supabase.from("orders").insert({
          workshop_id: workshopId,
          client_id: clientId!,
          vehicle_id: vehicleId!,
          reported_problem: get(row, "problema_relatado") || null,
          service_done: get(row, "servico_realizado") || null,
          amount: valor,
          entry_date: entryDate,
          status: "entregue",
          paid: valor > 0,
        });
        if (oErr) throw oErr;
        success++;
      } catch (e) {
        errors.push({ row: lineNum, reason: (e as Error).message });
      }
    }

    setResult({ success, errors });
    setImporting(false);
    if (success) toast.success(`${success} registro(s) importado(s).`);
    if (errors.length) toast.error(`${errors.length} linha(s) com erro.`);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Importar dados</h1>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" /> Modelo CSV
              </Button>
            </div>
          </header>

          <div className="space-y-5 p-4 md:p-6">
            <Card className="p-5">
              <Label>Arquivo CSV</Label>
              <Input
                type="file" accept=".csv,text/csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="mt-2"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Importe clientes, veículos e ordens de serviço a partir de um CSV. Baixe o modelo para ver o formato esperado.
              </p>
            </Card>

            {headers.length > 0 && (
              <Card className="p-5 space-y-4">
                <div>
                  <h2 className="font-display text-base font-semibold">Mapeamento de colunas</h2>
                  <p className="text-sm text-muted-foreground">Confirme qual coluna do seu CSV corresponde a cada campo.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {FIELDS.map((f) => (
                    <div key={f.key}>
                      <Label className="flex items-center gap-1">
                        {f.label} {("required" in f && f.required) && <span className="text-destructive">*</span>}
                      </Label>
                      <Select
                        value={mapping[f.key] ?? "__none__"}
                        onValueChange={(v) => setMapping({ ...mapping, [f.key]: v === "__none__" ? "" : v })}
                      >
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Não mapear —</SelectItem>
                          {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    {rows.length} linha(s) prontas para importar.
                  </p>
                  <Button variant="hero" onClick={runImport} disabled={importing || !rows.length} className="gap-2">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Importar {rows.length} registro(s)
                  </Button>
                </div>
              </Card>
            )}

            {result && (
              <Card className="p-5 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default" className="gap-1 px-3 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {result.success} sucesso(s)
                  </Badge>
                  <Badge variant="destructive" className="gap-1 px-3 py-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {result.errors.length} erro(s)
                  </Badge>
                </div>
                {result.errors.length > 0 && (
                  <div className="max-h-64 overflow-auto rounded border bg-muted/20 p-3 text-sm">
                    {result.errors.map((e, i) => (
                      <p key={i} className="font-mono text-xs">
                        Linha {e.row}: <span className="text-destructive">{e.reason}</span>
                      </p>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

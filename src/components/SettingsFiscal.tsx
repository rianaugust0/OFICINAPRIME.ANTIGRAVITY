import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SettingsFiscal({ workshopId }: { workshopId: string }) {
  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    cnpj: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    ambiente: "homologacao"
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ["fiscal-config", workshopId],
    queryFn: async () => {
      const { data, error } = await supabase.from("workshop_fiscal_config").select("*").eq("workshop_id", workshopId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) {
      setFormData({
        cnpj: config.cnpj || "",
        inscricao_estadual: config.inscricao_estadual || "",
        inscricao_municipal: config.inscricao_municipal || "",
        cep: config.cep || "",
        logradouro: config.logradouro || "",
        numero: config.numero || "",
        complemento: config.complemento || "",
        bairro: config.bairro || "",
        cidade: config.cidade || "",
        estado: config.estado || "",
        ambiente: config.ambiente || "homologacao",
      });
    }
  }, [config]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase.from("workshop_fiscal_config").select("workshop_id").eq("workshop_id", workshopId).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("workshop_fiscal_config").update({ ...formData }).eq("workshop_id", workshopId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("workshop_fiscal_config").insert({ workshop_id: workshopId, ...formData });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Dados fiscais salvos com sucesso!");
      qc.invalidateQueries({ queryKey: ["fiscal-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Configuração de Nota Fiscal</h2>
          <p className="text-sm text-muted-foreground">Preencha os dados da sua empresa para habilitar a emissão de notas.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-sm border-b pb-2 mb-4">Dados da Empresa</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} placeholder="00.000.000/0001-00" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inscrição Estadual</Label>
                  <Input value={formData.inscricao_estadual} onChange={(e) => setFormData({...formData, inscricao_estadual: e.target.value})} placeholder="Isento ou Número" />
                </div>
                <div className="space-y-2">
                  <Label>Inscrição Municipal</Label>
                  <Input value={formData.inscricao_municipal} onChange={(e) => setFormData({...formData, inscricao_municipal: e.target.value})} placeholder="Número" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm border-b pb-2 mb-4">Endereço Fiscal</h3>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-[120px_1fr] gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={formData.cep} onChange={(e) => setFormData({...formData, cep: e.target.value})} placeholder="00000-000" />
                </div>
                <div className="space-y-2">
                  <Label>Logradouro</Label>
                  <Input value={formData.logradouro} onChange={(e) => setFormData({...formData, logradouro: e.target.value})} placeholder="Rua, Avenida..." />
                </div>
              </div>
              <div className="grid sm:grid-cols-[100px_1fr] gap-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={formData.numero} onChange={(e) => setFormData({...formData, numero: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input value={formData.complemento} onChange={(e) => setFormData({...formData, complemento: e.target.value})} />
                </div>
              </div>
              <div className="grid sm:grid-cols-[1fr_1fr_80px] gap-4">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={formData.bairro} onChange={(e) => setFormData({...formData, bairro: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={formData.cidade} onChange={(e) => setFormData({...formData, cidade: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} placeholder="SP" maxLength={2} />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Certificado Digital A1</h3>
            <Card className="p-6 border-dashed border-2 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition cursor-pointer">
              <Upload className="h-8 w-8 text-muted-foreground mb-4" />
              <p className="font-medium text-sm">Upload do Certificado (.pfx)</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Necessário para assinar as notas fiscalmente.</p>
              <Button variant="outline" size="sm" className="pointer-events-none">Selecionar Arquivo</Button>
            </Card>
            
            <div className="space-y-2 pt-2">
              <Label>Senha do Certificado</Label>
              <Input type="password" placeholder="******" />
            </div>
          </Card>

          <Card className="p-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              <div>
                <strong className="text-sm text-blue-900 dark:text-blue-300">Ambiente Atual: {formData.ambiente === 'homologacao' ? 'Homologação (Testes)' : 'Produção'}</strong>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">As notas emitidas agora não possuem valor fiscal e servem apenas para teste de integração.</p>
              </div>
            </div>
          </Card>
          
          <Button 
            className="w-full font-bold shadow-md h-12" 
            onClick={() => saveMut.mutate()} 
            disabled={saveMut.isPending}
            variant="hero"
          >
            {saveMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar Dados Fiscais"}
          </Button>
        </div>
      </div>
    </div>


  );
}

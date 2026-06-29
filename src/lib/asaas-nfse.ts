import { supabase } from "@/integrations/supabase/client";

// O Token Mestre do Asaas agora vive em SEGURANÇA no Backend (Edge Function).
// O front-end apenas despacha os comandos.

export interface AsaasAccountData {
  name: string;
  email: string;
  cpfCnpj: string;
  companyType: string;
  phone: string;
  mobilePhone: string;
  address: string;
  addressNumber: string;
  province: string;
  postalCode: string;
}

/**
 * Cria uma subconta no Asaas (White Label) para o Mecânico
 */
export async function createAsaasSubAccount(data: AsaasAccountData) {
  try {
    const { data: response, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'create_subaccount', payload: data }
    });
    
    if (error) throw new Error(error.message || "Erro de conexão com o servidor seguro");
    if (!response?.success) throw new Error(response?.error || "Erro ao criar subconta no Asaas");
    
    return response;
  } catch (error) {
    console.error("Erro Asaas:", error);
    throw error;
  }
}

/**
 * Faz o upload do Certificado A1 (.pfx) do Supabase Storage para o Asaas
 */
export async function uploadCertificateToAsaas(walletId: string, certificadoBase64: string, senha: string) {
  try {
    const { data: response, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'upload_certificate', payload: { walletId, certificadoBase64, senha } }
    });
    
    if (error) throw new Error(error.message || "Erro de conexão com o servidor seguro");
    return response;
  } catch (error) {
    console.error("Erro ao enviar certificado:", error);
    throw error;
  }
}

/**
 * Emite a NFS-e
 */
export async function emitirNFSe(walletId: string, osData: any) {
  try {
    const payload = {
      customer: osData.customerId,
      service: "Serviços Mecânicos",
      value: osData.totalValue,
      deductions: 0,
      effectiveDate: new Date().toISOString().split('T')[0],
      municipalServiceId: "14.01", 
      municipalServiceCode: "14.01",
      municipalServiceName: "Lubrificação, limpeza, lustração, revisão..."
    };

    const { data: response, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'emit_nfe', payload: { walletId, ...payload } }
    });
    
    if (error) throw new Error(error.message || "Erro de conexão com o servidor seguro");
    return response;
  } catch (error) {
    console.error("Erro ao emitir nota:", error);
    throw error;
  }
}

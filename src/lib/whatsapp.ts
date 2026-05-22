/**
 * Opens WhatsApp with a pre-filled message using wa.me link.
 * Phone is sanitized: digits only, with Brazil country code 55 if missing.
 */
export function openWhatsApp(phone: string | null | undefined, message: string) {
  if (!phone) return;
  let digits = phone.replace(/\D/g, "");
  if (digits.length <= 11) digits = "55" + digits; // BR default
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export const WhatsAppTemplates = {
  orderReady: (clientName: string, vehicle: string, plate: string) =>
    `Olá ${clientName}! Seu veículo ${vehicle} (${plate}) está pronto para retirada. Aguardamos você! 🔧`,
  budgetApproved: (clientName: string) =>
    `Olá ${clientName}, obrigado por aprovar o orçamento! Já iniciamos o serviço.`,
  reminder: (clientName: string, vehicle: string, when: string) =>
    `Olá ${clientName}, lembrete: revisão do ${vehicle} marcada para ${when}.`,
  paymentDue: (clientName: string, amount: string) =>
    `Olá ${clientName}, identificamos um pagamento pendente de ${amount}. Posso ajudar?`,
};

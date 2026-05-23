import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PrintLayoutProps {
  order: any;
  workshop: any;
  type: "os" | "quote" | "receipt";
}

const formatBRL = (n: number) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PrintLayout({ order, workshop, type }: PrintLayoutProps) {
  if (!order || !workshop) return null;

  const isQuote = type === "quote";
  const isReceipt = type === "receipt";
  
  let title = "ORDEM DE SERVIÇO";
  if (isQuote) title = "ORÇAMENTO";
  if (isReceipt) title = "RECIBO DE PAGAMENTO";

  const number = isQuote ? (order.id.substring(0,6).toUpperCase()) : String(order.number).padStart(4, "0");
  const items = order.items || [];
  
  const parts = items.filter((i: any) => i.item_type === "peca" || i.type === "part");
  const services = items.filter((i: any) => i.item_type === "servico" || i.type === "service");

  const subtotalParts = parts.reduce((acc: number, i: any) => acc + (i.unit_price || i.price) * i.quantity, 0);
  const subtotalServices = services.reduce((acc: number, i: any) => acc + (i.unit_price || i.price) * i.quantity, 0);
  const discount = Number(order.discount || 0);
  const total = order.amount || (subtotalParts + subtotalServices - discount);

  return (
    <div id="print-area" className="bg-white text-black p-8 mx-auto w-full max-w-4xl text-sm font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div className="flex items-center gap-4">
          {workshop.logo_url ? (
            <img src={workshop.logo_url} alt="Logo" className="max-w-[120px] max-h-[80px] object-contain" />
          ) : (
            <div className="w-[80px] h-[80px] bg-gray-200 flex items-center justify-center font-bold text-gray-500">LOGO</div>
          )}
          <div>
            <h1 className="text-2xl font-bold uppercase">{workshop.name}</h1>
            <p className="text-gray-600 mt-1">{workshop.address || "Endereço não informado"}</p>
            <p className="text-gray-600">WhatsApp: {workshop.whatsapp || "-"} | Email: {workshop.email || "-"}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black uppercase tracking-wider text-gray-800">{title}</h2>
          <p className="text-lg font-bold text-red-600 mt-1">Nº {number}</p>
          <p className="text-gray-600 mt-2">Emissão: {format(new Date(order.created_at || new Date()), "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
      </div>

      {isReceipt && (
        <div className="mb-6 p-4 border-2 border-emerald-500 bg-emerald-50 text-emerald-900 rounded-lg text-center">
          <h3 className="text-lg font-bold uppercase mb-1">Comprovante de Pagamento Recebido</h3>
          <p>Recebemos a quantia de <strong>{formatBRL(total)}</strong> referente aos serviços listados abaixo.</p>
          <p className="text-sm mt-1">Pago em: {order.paid_at ? format(new Date(order.paid_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
      )}

      {/* CLIENT & VEHICLE */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-300 rounded-md p-3">
          <h3 className="font-bold text-xs uppercase text-gray-500 mb-2 border-b pb-1">Dados do Cliente</h3>
          <p><strong>Nome:</strong> {order.clients?.name}</p>
          <p><strong>Documento:</strong> {order.clients?.document || "Não informado"}</p>
          <p><strong>Telefone:</strong> {order.clients?.phone || "Não informado"}</p>
        </div>
        <div className="border border-gray-300 rounded-md p-3">
          <h3 className="font-bold text-xs uppercase text-gray-500 mb-2 border-b pb-1">Dados do Veículo</h3>
          <p><strong>Veículo:</strong> {order.vehicles?.brand} {order.vehicles?.model}</p>
          <p><strong>Placa:</strong> {order.vehicles?.plate}</p>
          <p><strong>Quilometragem:</strong> {order.vehicles?.mileage ? order.vehicles?.mileage + " km" : "Não informada"}</p>
        </div>
      </div>

      {/* PROBLEM */}
      {(order.reported_problem || order.notes) && (
        <div className="border border-gray-300 rounded-md p-3 mb-6 bg-gray-50">
          <h3 className="font-bold text-xs uppercase text-gray-500 mb-1">Relato / Observações</h3>
          <p>{order.reported_problem || order.notes}</p>
        </div>
      )}

      {/* ITEMS - SERVICES */}
      {services.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-sm uppercase bg-black text-white px-3 py-1 mb-2">Mão de Obra / Serviços</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-2 px-2">Descrição</th>
                <th className="py-2 px-2 text-center w-20">Qtd</th>
                <th className="py-2 px-2 text-right w-32">V. Unitário</th>
                <th className="py-2 px-2 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 px-2">{s.name}</td>
                  <td className="py-2 px-2 text-center">{s.quantity}</td>
                  <td className="py-2 px-2 text-right">{formatBRL(s.unit_price || s.price)}</td>
                  <td className="py-2 px-2 text-right font-medium">{formatBRL((s.unit_price || s.price) * s.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right font-bold mt-2 pr-2">Subtotal Serviços: {formatBRL(subtotalServices)}</div>
        </div>
      )}

      {/* ITEMS - PARTS */}
      {parts.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-sm uppercase bg-gray-200 text-black px-3 py-1 mb-2">Peças / Produtos</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-2 px-2">Descrição</th>
                <th className="py-2 px-2 text-center w-20">Qtd</th>
                <th className="py-2 px-2 text-right w-32">V. Unitário</th>
                <th className="py-2 px-2 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 px-2">{p.name}</td>
                  <td className="py-2 px-2 text-center">{p.quantity}</td>
                  <td className="py-2 px-2 text-right">{formatBRL(p.unit_price || p.price)}</td>
                  <td className="py-2 px-2 text-right font-medium">{formatBRL((p.unit_price || p.price) * p.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right font-bold mt-2 pr-2">Subtotal Peças: {formatBRL(subtotalParts)}</div>
        </div>
      )}

      {/* TOTALS & CONDITIONS */}
      <div className="flex justify-between items-start mt-8 border-t-2 border-black pt-4">
        <div className="w-1/2 pr-4">
          <h3 className="font-bold text-xs uppercase text-gray-500 mb-2">Condições Gerais</h3>
          <p><strong>Forma de Pagamento:</strong> {order.payment_method || "Não informada"}</p>
          <p><strong>Condição:</strong> {order.payment_condition || "À vista"}</p>
          <p className="mt-2"><strong>Garantia do Serviço:</strong> {order.warranty_text || "90 dias conforme CDC"}</p>
        </div>
        
        <div className="w-1/2 bg-gray-50 border border-gray-300 p-4 rounded-md">
          <div className="flex justify-between mb-1">
            <span>Subtotal Geral:</span>
            <span>{formatBRL(subtotalParts + subtotalServices)}</span>
          </div>
          <div className="flex justify-between mb-1 text-red-600">
            <span>Desconto:</span>
            <span>- {formatBRL(discount)}</span>
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-300 font-black text-xl">
            <span>TOTAL FINAL:</span>
            <span>{formatBRL(total)}</span>
          </div>
        </div>
      </div>

      {/* SIGNATURES - ONLY SHOW IF NOT RECEIPT (receipt has its own) */}
      {!isReceipt && (
        <div className="flex justify-between mt-20 px-8 text-center">
          <div className="w-64 border-t border-black pt-2">
            <p className="font-bold">{workshop.name}</p>
            <p className="text-xs text-gray-500">Oficina Responsável</p>
          </div>
          <div className="w-64 border-t border-black pt-2">
            <p className="font-bold">{order.clients?.name}</p>
            <p className="text-xs text-gray-500">Cliente (De Acordo)</p>
          </div>
        </div>
      )}

      {/* TERMO DE GARANTIA E RECIBO (ONLY FOR RECEIPT) */}
      {isReceipt && (
        <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-400 print:break-inside-avoid">
          <h3 className="text-xl font-bold uppercase text-center mb-6">Termo de Garantia Legal</h3>
          
          <div className="text-justify text-xs text-gray-800 space-y-3 px-4">
            <p><strong>1. Cobertura:</strong> Conforme o Art. 26 do Código de Defesa do Consumidor (Lei 8.078/90), a garantia legal para os serviços prestados e peças aplicadas é de <strong>90 (noventa) dias</strong>, contados a partir da data de entrega do veículo ({format(new Date(), "dd/MM/yyyy", { locale: ptBR })}).</p>
            <p><strong>2. Condições:</strong> A garantia cobre exclusivamente os defeitos de fabricação das peças trocadas e vícios nos serviços executados que estão listados neste documento.</p>
            <p><strong>3. Perda de Garantia:</strong> A garantia perderá automaticamente sua validade nos seguintes casos: 
               a) Uso inadequado do veículo, acidentes ou desgaste natural; 
               b) Reparos realizados por terceiros nos itens garantidos; 
               c) Uso de peças fornecidas pelo próprio cliente.</p>
            <p><strong>4. Acionamento:</strong> É obrigatória a apresentação deste termo impresso e do recibo de pagamento no momento da solicitação de garantia.</p>
          </div>
          
          <div className="flex justify-between mt-24 px-8 text-center">
            <div className="w-64 border-t border-black pt-2">
              <p className="font-bold">{workshop.name}</p>
              <p className="text-xs text-gray-500">Garantia Concedida Por</p>
            </div>
            <div className="w-64 border-t border-black pt-2">
              <p className="font-bold">{order.clients?.name}</p>
              <p className="text-xs text-gray-500">Cliente (Ciente dos Termos)</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

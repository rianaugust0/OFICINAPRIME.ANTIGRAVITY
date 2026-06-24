import { motion } from "framer-motion";
import { MessageCircle, CreditCard, FileText, Link as LinkIcon } from "lucide-react";

const integrations = [
  { name: "WhatsApp API", icon: MessageCircle, color: "text-green-500", desc: "Avisos automáticos" },
  { name: "Stripe", icon: CreditCard, color: "text-indigo-400", desc: "Pagamentos seguros" },
  { name: "SEFAZ / FocusNFe", icon: FileText, color: "text-blue-400", desc: "Notas fiscais" },
  { name: "APIs Públicas", icon: LinkIcon, color: "text-gold", desc: "Busca de placa e CEP" },
];

export function IntegrationsSection() {
  return (
    <section className="border-y border-white/5 bg-white/[0.02] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Integrado com as melhores tecnologias do mercado
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {integrations.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center justify-center gap-3 text-center opacity-80 transition-opacity hover:opacity-100"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
                  <Icon className={`h-8 w-8 ${item.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

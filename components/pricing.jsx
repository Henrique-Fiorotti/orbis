import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const plans = [
  {
    name: "Empresarial",
    isRecommended: true,
    description:
      "Para industrias que buscam controle total da operacao.",
    features: [
      "Monitoramento de ate 20 maquinas",
      "Alertas em tempo real via painel e mobile",
      "Historico de 12 meses de dados dos sensores",
      "Ate 5 tecnicos cadastrados",
      "Relatorios mensais automaticos",
    ],
    buttonText: "Entre em contato",
    isPopular: true,
  },
  {
    name: "Equipes",
    description:
      "Para grandes plantas com multiplas linhas de producao.",
    features: [
      "Monitoramento ilimitado de maquinas",
      "Alertas prioritarios com escalonamento automatico",
      "Historico completo e exportacao de dados",
      "Tecnicos e usuarios ilimitados",
      "Relatorios personalizados e suporte dedicado",
    ],
    buttonText: "Entre em contato",
  },
];

const Pricing = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-15! py-12 text-zinc-950 transition-colors dark:bg-[#09090b] dark:text-zinc-50">
      <h2 className="text-center text-4xl! font-semibold tracking-[-0.03em]">
        Nossos <span style={{ color: "var(--landing-accent-strong, #5E17EB)" }}>planos</span>
      </h2>
      <p className="mt-3 text-center text-xl text-muted-foreground dark:text-zinc-400">
        Escolha o plano que se adeque as suas necessidades <br /> e comece hoje
        a prever seus problemas.
      </p>
      <div className="mx-auto mt-8! grid h-auto! max-w-(--breakpoint-lg) grid-cols-1 gap-8 sm:mt-16 lg:grid-cols-2">
        {plans.map((plan) => (
          <div
            className={`flex flex-col justify-between rounded-lg border bg-white dark:bg-gray-900/70! p-12 transition-colors dark:bg-[#111114] dark:border-white/10 ${plan.isPopular ? "border-1! border-[#5E17EB]! shadow-[0px_0px_38px_0px_rgba(94,23,235,0.3)]" : ""}`}
            variant={plan.isPopular ? "default" : "outline"}
            key={plan.name}
          >
            <h3 className="text-lg font-medium">{plan.name}</h3>
            <h4
              className={`${plan.isPopular ? "h-7 w-26 rounded-[15px] pt-1 text-center text-[11pt]! text-2xl font-bold!" : ""}`}
              style={
                plan.isPopular
                  ? {
                      border: "1px solid var(--landing-accent-strong, #5E17EB)",
                      color: "var(--landing-accent-strong, #5E17EB)",
                    }
                  : undefined
              }
            >
              {plan.isPopular ? "Popular" : ""}
            </h4>
            <p className="mt-4 font-medium text-muted-foreground dark:text-zinc-400">
              {plan.description}
            </p>
            <Separator className="my-1" />
            <ul className="space-y-1 py-3 pl-1!">
              {plan.features.map((feature) => (
                <li className="flex items-start gap-2" key={feature}>
                  <CircleCheck className="mt-1 h-4 w-4 text-[#5E17EB]" />{" "}
                  {feature}
                </li>
              ))}
            </ul>
            <div>
              <Button
                className="mt-6 h-12 w-full rounded-[10px]! bg-[#5E17EB] text-[#ffffff]! hover:bg-[#5013ca]!"
                size="lg"
                variant={plan.isPopular ? "default" : "outline"}
              >
                {plan.buttonText}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;

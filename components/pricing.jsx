import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const plans = [
  {
    name: "Empresarial",
    isRecommended: true,
    description:
      "Para indústrias que buscam controle total da operação.",
    features: [
      "Monitoramento de até 20 máquinas",
      "Alertas em tempo real via painel e mobile",
      "Histórico de 12 meses de dados dos sensores",
      "Até 5 técnicos cadastrados",
      "Relatórios mensais automáticos",
    ],
    buttonText: "Entre em contato",
    isPopular: true,
  },
  {
    name: "Equipes",
    description:
      "Para grandes plantas com múltiplas linhas de produção.",
    features: [
      "Monitoramento ilimitado de máquinas",
      "Alertas prioritários com escalonamento automático",
      "Histórico completo e exportação de dados",
      "Técnicos e usuários ilimitados",
      "Relatórios personalizados e suporte dedicado",
    ],
    buttonText: "Entre em contato",
  }
];

const Pricing = () => {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-15! py-12">
      <h2 className="text-center font-semibold text-4xl! tracking-[-0.03em]">
        Nossos <span className="text-[#5E17EB]">planos</span>
      </h2>
      <p className="mt-3 text-center text-muted-foreground text-xl">
        Escolha o plano que se adeque às suas necessidades <br /> e comece hoje a prever seu problemas.
      </p>
      <div
        className="mx-auto mt-8! h-auto! grid max-w-(--breakpoint-lg) grid-cols-1 gap-8 sm:mt-16 lg:grid-cols-2">
        {plans.map((plan) => (
          <div className={`rounded-lg border p-12 ${plan.isPopular ? "shadow-[0px_0px_38px_0px_rgba(94,23,235,0.3)] border-1! border-[#5E17EB]!" : ""}`}
          variant={plan.isPopular ? "default" : "outline"}
          key={plan.name}>
            <h3 className="font-medium text-lg">{plan.name}</h3>
            <h4 className={`${plan.isPopular ? "font-bold text-[11pt]! text-2xl text-[#5E17EB]! pt-1 border border-[#5E17EB]! rounded-[15px] w-26 h-7 text-center" : ""}`}>
              {plan.isPopular ? "Popular" : ""}  </h4>
            <p className="mt-2 font-semibold text-4xl">{plan.price}</p>
            <p className="mt-4 font-medium text-muted-foreground">
              {plan.description}
            </p>
            <Separator className="my-4" />
            <ul className="space-y-1 pl-1! py-3">
              {plan.features.map((feature) => (
                <li className="flex items-start gap-2" key={feature}>
                  <CircleCheck className="mt-1 h-4 w-4 text-[#5E17EB]" />{" "}
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="mt-6 h-12 w-full bg-[#5E17EB] rounded-[10px]! hover:bg-[#5013ca]! text-[#ffffff]!"
              size="lg"
              variant={plan.isPopular ? "default" : "outline"}>
              {plan.buttonText}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;

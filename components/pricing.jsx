import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const plans = [
  {
    name: "Empresarial",
    isRecommended: true,
    description:
      "Para empresas profissionais em larga escala.",
    features: [
      "3 hours turnaround time",
      "50 AI portraits",
      "Choice of 5 styles",
      "Choice of 5 filters",
      "5 retouch credits",
    ],
    buttonText: "Entre em contato",
    isPopular: true,
  },
  {
    name: "Equipes",
    description:
      "Para equipes de 10 a 150 profissionais em larga escala.",
    features: [
      "1-hour turnaround time",
      "100 AI portraits",
      "Choice of 10 styles",
      "Choice of 10 filters",
      "10 retouch credits",
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
        className="mx-auto mt-8! grid max-w-(--breakpoint-lg) grid-cols-1 gap-8 sm:mt-16 lg:grid-cols-2">
        {plans.map((plan) => (
          <div className="rounded-lg border p-6"
          variant={plan.isPopular ? "default" : "outline"}
          key={plan.name}>
            <h3 className="font-medium text-lg">{plan.name}</h3>
            <p className="mt-2 font-semibold text-4xl">${plan.price}</p>
            <p className="mt-4 font-medium text-muted-foreground">
              {plan.description}
            </p>
            <Separator className="my-4" />
            <ul className="space-y-1 pl-1!">
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

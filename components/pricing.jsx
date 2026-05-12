"use client";

import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { useLandingLanguage } from "@/components/landing/language-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Pricing = () => {
  const { copy } = useLandingLanguage();
  const { pricing } = copy;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5! py-12 text-zinc-950 transition-colors sm:px-8! lg:px-15! dark:bg-[#09090b] dark:text-zinc-50">
      <h2 className="text-center text-3xl! font-semibold tracking-[-0.03em] sm:text-4xl!">
        {pricing.titleBefore} <span style={{ color: "var(--landing-accent-strong, #5E17EB)" }}>{pricing.titleHighlight}</span>
      </h2>
      <p className="mt-3 max-w-2xl text-center text-base text-muted-foreground sm:text-xl dark:text-zinc-400">
        {pricing.subtitleLines[0]} <br /> {pricing.subtitleLines[1]}
      </p>
      <div className="mx-auto mt-8! grid h-auto! w-full max-w-(--breakpoint-lg) grid-cols-1 gap-6 sm:mt-16 lg:grid-cols-2 lg:gap-8">
        {pricing.plans.map((plan) => (
          <div
            className={`flex flex-col justify-between rounded-lg border bg-white p-6 transition-colors sm:p-8 lg:p-12 dark:bg-gray-900/70! dark:bg-[#111114] dark:border-white/10 ${plan.isPopular ? "border-1! border-[#5E17EB]! shadow-[0px_0px_38px_0px_rgba(94,23,235,0.3)]" : ""}`}
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
              {plan.isPopular ? pricing.popularLabel : ""}
            </h4>
            <p className="mt-4 font-medium text-muted-foreground dark:text-zinc-400">
              {plan.description}
            </p>
            <Separator className="my-1" />
            <ul className="space-y-1 py-3 pl-1!">
              {plan.features.map((feature) => (
                <li className="flex items-start gap-2" key={feature}>
                  <CircleCheck className="mt-1 h-4 w-4 shrink-0 text-[#5E17EB]" />{" "}
                  {feature}
                </li>
              ))}
            </ul>
            <div>
              <Button
                asChild
                className="mt-6 h-12 w-full rounded-[10px]! bg-[#5E17EB] text-[#ffffff]! hover:bg-[#5013ca]!"
                size="lg"
                variant={plan.isPopular ? "default" : "outline"}
              >
                <Link href="/#contact" prefetch={false}>
                  {plan.buttonText}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;

export const DEFAULT_LOCALE = "pt";

export const LANGUAGES = [
  {
    code: "pt",
    htmlLang: "pt-BR",
    nativeName: "Português",
    shortLabel: "PT",
  },
  {
    code: "en",
    htmlLang: "en",
    nativeName: "English",
    shortLabel: "EN",
  },
  {
    code: "es",
    htmlLang: "es",
    nativeName: "Español",
    shortLabel: "ES",
  },
];

export function normalizeLocale(value) {
  const locale = String(value ?? "").trim().toLowerCase();

  if (locale === "pt" || locale === "pt-br") return "pt";
  if (locale === "en" || locale === "en-us" || locale === "en-gb") return "en";
  if (locale === "es" || locale === "es-es" || locale === "es-mx") return "es";

  return null;
}

export const LANDING_COPY = {
  pt: {
    meta: {
      htmlLang: "pt-BR",
      dir: "ltr",
    },
    header: {
      nav: [
        { label: "Início", href: "/#inicio" },
        { label: "Sobre", href: "/#sobre" },
        { label: "Contato", href: "/contact" },
      ],
      theme: {
        light: "Ativar tema claro",
        dark: "Ativar tema escuro",
        toggle: "Alternar tema",
      },
      menu: {
        open: "Abrir menu",
        close: "Fechar menu",
      },
      login: "Entrar",
      languageLabel: "Idioma",
      languageSelectLabel: "Selecionar idioma da landing page",
    },
    home: {
      hero: {
        splineTitle: "Demonstração 3D da Orbis",
        titleLines: [
          { before: "Antecipando ", highlight: "falhas", after: "," },
          { before: "realizando operações ", highlight: "seguras", after: "." },
        ],
        subtitle: "Inteligência operacional para empresas que não podem errar.",
        primaryCta: "Acesse o Orbis",
        secondaryCta: "Sobre",
        registerQuestion: "Não tem uma conta?",
        registerCta: "Registrar empresa",
        scrollDownLabel: "Rolar para baixo",
      },
      quote: {
        before: "\"Prever ",
        highlight: "erros",
        middle: " hoje é evitar prejuízos ",
        secondHighlight: "amanhã",
        after: "\"",
        supportText: "Confie no processo.",
        joinText: "Junte-se à Orbis",
      },
      benefits: {
        eyebrow: "O que oferecemos",
        title: "Tecnologia que trabalha enquanto você lidera.",
      },
      process: {
        eyebrow: "Como funciona",
        titleLine1: "Simples de começar.",
        titleLine2: "Poderoso no uso.",
      },
      final: {
        title: "Pronto para operar com segurança?",
        description: "Junte-se a centenas de empresas que já confiam no Orbis.",
        cta: "Fale conosco",
      },
      features: [
        {
          icon: "/visibility.svg",
          title: "Monitoramento em tempo real",
          desc: "Acompanhe cada operação da sua empresa com dashboards precisos e alertas instantâneos.",
          delay: 0,
        },
        {
          icon: "/bolt.svg",
          title: "Previsão de falhas",
          desc: "Algoritmos preditivos identificam riscos antes que se tornem problemas reais.",
          delay: 80,
        },
        {
          icon: "/shield.svg",
          title: "Segurança avançada",
          desc: "Criptografia de ponta a ponta e controle de acesso granular para cada usuário.",
          delay: 160,
        },
        {
          icon: "/analytics.svg",
          title: "Relatórios inteligentes",
          desc: "Relatórios automáticos com informações acionáveis para decisões mais rápidas e assertivas.",
          delay: 240,
        },
      ],
      steps: [
        {
          n: "1",
          title: "Registre sua empresa",
          desc: "Crie sua conta em minutos e configure o perfil da sua organização.",
          delay: 0,
        },
        {
          n: "2",
          title: "Conecte suas operações",
          desc: "Integre sistemas existentes ou utilize nossa plataforma nativa para monitoramento.",
          delay: 100,
        },
        {
          n: "3",
          title: "Monitore e preveja",
          desc: "Receba alertas inteligentes e veja tendências antes de virarem crises.",
          delay: 200,
        },
        {
          n: "4",
          title: "Aja com confiança",
          desc: "Tome decisões respaldadas por dados reais e previsões precisas.",
          delay: 300,
        },
      ],
    },
    dashboardPreview: {
      eyebrow: "Interface gráfica",
      titleLine1: "Dashboard",
      titleLine2: "preventivo",
      description:
        "Gestão geral das suas máquinas em uma interface intuitiva, com sua empresa na sua tela.",
      cta: "Comece agora",
      imageAlt: "Dashboard preventivo da Orbis",
    },
    about: {
      imageAlt: "Profissional Orbis",
      logoAlt: "Logo Orbis",
      cta: "Acesse o Orbis",
      paragraphs: [
        [
          { text: "A " },
          { text: "Orbis supervisiona continuamente", strong: true },
          { text: " o funcionamento das " },
          { text: "máquinas e equipamentos industriais", strong: true },
          {
            text: ", identificando irregularidades antes que se tornem problemas maiores e garantindo mais ",
          },
          { text: "segurança na operação", strong: true },
          { text: "." },
        ],
        [
          { text: "Com " },
          { text: "monitoramento constante", strong: true },
          {
            text: ", o sistema detecta rapidamente qualquer alteração no desempenho dos equipamentos, permitindo que as medidas necessárias sejam tomadas com ",
          },
          { text: "agilidade", strong: true },
          { text: " e " },
          { text: "evitando falhas na produção", strong: true },
          { text: "." },
        ],
      ],
    },
    pricing: {
      titleBefore: "Nossos",
      titleHighlight: "planos",
      subtitleLines: [
        "Escolha o plano que se adeque às suas necessidades",
        "e comece hoje a prever seus problemas.",
      ],
      popularLabel: "Popular",
      plans: [
        {
          name: "Empresarial",
          isRecommended: true,
          description: "Para indústrias que buscam controle total da operação.",
          features: [
            "Monitoramento de até 20 máquinas",
            "Alertas em tempo real no painel e em dispositivos móveis",
            "Histórico de 12 meses de dados dos sensores",
            "Até 5 técnicos cadastrados",
            "Relatórios mensais automáticos",
          ],
          buttonText: "Entre em contato",
          isPopular: true,
        },
        {
          name: "Equipes",
          description: "Para grandes plantas com múltiplas linhas de produção.",
          features: [
            "Monitoramento ilimitado de máquinas",
            "Alertas prioritários com escalonamento automático",
            "Histórico completo e exportação de dados",
            "Técnicos e usuários ilimitados",
            "Relatórios personalizados e suporte dedicado",
          ],
          buttonText: "Entre em contato",
        },
      ],
    },
    footer: {
      logoAria: "Orbis - Página inicial",
      brandText:
        "Inteligência operacional para empresas que não podem errar. Antecipamos falhas, você lidera com confiança.",
      copyright: "© 2026 Orbis. Todos os direitos reservados.",
      sections: [
        {
          title: "Navegação",
          links: [
            { title: "Início", href: "/" },
            { title: "Sobre", href: "/#sobre" },
            { title: "Planos", href: "/#planos" },
            { title: "Contato", href: "/contact" },
          ],
        },
        {
          title: "Plataforma",
          links: [
            { title: "Login", href: "/login" },
            { title: "Registrar empresa", href: "/registro" },
            { title: "Dashboard", href: "/dashboard" },
          ],
        },
        {
          title: "Legal",
          links: [
            { title: "Política de Privacidade", href: "/login" },
            { title: "Termos de Uso", href: "#" },
            { title: "Página não encontrada", href: "/404-exemplo" },
          ],
        },
      ],
    },
  },
  en: {
    meta: {
      htmlLang: "en",
      dir: "ltr",
    },
    header: {
      nav: [
        { label: "Home", href: "/#inicio" },
        { label: "About", href: "/#sobre" },
        { label: "Contact", href: "/contact" },
      ],
      theme: {
        light: "Enable light theme",
        dark: "Enable dark theme",
        toggle: "Toggle theme",
      },
      menu: {
        open: "Open menu",
        close: "Close menu",
      },
      login: "Sign in",
      languageLabel: "Language",
      languageSelectLabel: "Select landing page language",
    },
    home: {
      hero: {
        splineTitle: "Orbis 3D demonstration",
        titleLines: [
          { before: "Anticipating ", highlight: "failures", after: "," },
          { before: "keeping operations ", highlight: "safe", after: "." },
        ],
        subtitle: "Operational intelligence for companies that cannot afford mistakes.",
        primaryCta: "Access Orbis",
        secondaryCta: "About",
        registerQuestion: "Don't have an account?",
        registerCta: "Register company",
        scrollDownLabel: "Scroll down",
      },
      quote: {
        before: "\"Preventing ",
        highlight: "errors",
        middle: " today helps avoid losses ",
        secondHighlight: "tomorrow",
        after: "\"",
        supportText: "Trust the process.",
        joinText: "Join Orbis",
      },
      benefits: {
        eyebrow: "What we offer",
        title: "Technology that works while you lead.",
      },
      process: {
        eyebrow: "How it works",
        titleLine1: "Simple to start.",
        titleLine2: "Powerful in use.",
      },
      final: {
        title: "Ready to operate safely?",
        description: "Join hundreds of companies that already trust Orbis.",
        cta: "Contact us",
      },
      features: [
        {
          icon: "/visibility.svg",
          title: "Real-time monitoring",
          desc: "Track every operation in your company with precise dashboards and instant alerts.",
          delay: 0,
        },
        {
          icon: "/bolt.svg",
          title: "Failure prediction",
          desc: "Predictive algorithms identify risks before they become real problems.",
          delay: 80,
        },
        {
          icon: "/shield.svg",
          title: "Advanced security",
          desc: "End-to-end encryption and granular access control for every user.",
          delay: 160,
        },
        {
          icon: "/analytics.svg",
          title: "Smart reports",
          desc: "Automated reports with actionable insights for faster, more assertive decisions.",
          delay: 240,
        },
      ],
      steps: [
        {
          n: "1",
          title: "Register your company",
          desc: "Create your account in minutes and configure your organization profile.",
          delay: 0,
        },
        {
          n: "2",
          title: "Connect your operations",
          desc: "Integrate existing systems or use our native monitoring platform.",
          delay: 100,
        },
        {
          n: "3",
          title: "Monitor and predict",
          desc: "Receive smart alerts and identify trends before they become crises.",
          delay: 200,
        },
        {
          n: "4",
          title: "Act with confidence",
          desc: "Make decisions backed by real data and precise forecasts.",
          delay: 300,
        },
      ],
    },
    dashboardPreview: {
      eyebrow: "Graphic interface",
      titleLine1: "Preventive",
      titleLine2: "dashboard",
      description:
        "General management of your machines in an intuitive interface, with your company on your screen.",
      cta: "Start now",
      imageAlt: "Orbis preventive dashboard",
    },
    about: {
      imageAlt: "Orbis professional",
      logoAlt: "Orbis logo",
      cta: "Access Orbis",
      paragraphs: [
        [
          { text: "" },
          { text: "Orbis continuously supervises", strong: true },
          { text: " the operation of " },
          { text: "industrial machines and equipment", strong: true },
          {
            text: ", identifying irregularities before they become larger problems and improving ",
          },
          { text: "operational safety", strong: true },
          { text: "." },
        ],
        [
          { text: "With " },
          { text: "constant monitoring", strong: true },
          {
            text: ", the system quickly detects any change in equipment performance, allowing the necessary measures to be taken with ",
          },
          { text: "agility", strong: true },
          { text: " and " },
          { text: "avoiding production failures", strong: true },
          { text: "." },
        ],
      ],
    },
    pricing: {
      titleBefore: "Our",
      titleHighlight: "plans",
      subtitleLines: [
        "Choose the plan that fits your needs",
        "and start predicting problems today.",
      ],
      popularLabel: "Popular",
      plans: [
        {
          name: "Business",
          isRecommended: true,
          description: "For industries seeking full control of their operations.",
          features: [
            "Monitoring for up to 20 machines",
            "Real-time alerts via dashboard and mobile",
            "12-month sensor data history",
            "Up to 5 registered technicians",
            "Automatic monthly reports",
          ],
          buttonText: "Contact us",
          isPopular: true,
        },
        {
          name: "Teams",
          description: "For large plants with multiple production lines.",
          features: [
            "Unlimited machine monitoring",
            "Priority alerts with automatic escalation",
            "Complete history and data export",
            "Unlimited technicians and users",
            "Custom reports and dedicated support",
          ],
          buttonText: "Contact us",
        },
      ],
    },
    footer: {
      logoAria: "Orbis - Home page",
      brandText:
        "Operational intelligence for companies that cannot afford mistakes. We anticipate failures, you lead with confidence.",
      copyright: "© 2026 Orbis. All rights reserved.",
      sections: [
        {
          title: "Navigation",
          links: [
            { title: "Home", href: "/" },
            { title: "About", href: "/#sobre" },
            { title: "Plans", href: "/#planos" },
            { title: "Contact", href: "/contact" },
          ],
        },
        {
          title: "Platform",
          links: [
            { title: "Login", href: "/login" },
            { title: "Register company", href: "/registro" },
            { title: "Dashboard", href: "/dashboard" },
          ],
        },
        {
          title: "Legal",
          links: [
            { title: "Privacy Policy", href: "/login" },
            { title: "Terms of Use", href: "#" },
            { title: "Page not found", href: "/404-exemplo" },
          ],
        },
      ],
    },
  },
  es: {
    meta: {
      htmlLang: "es",
      dir: "ltr",
    },
    header: {
      nav: [
        { label: "Inicio", href: "/#inicio" },
        { label: "Sobre", href: "/#sobre" },
        { label: "Contacto", href: "/contact" },
      ],
      theme: {
        light: "Activar tema claro",
        dark: "Activar tema oscuro",
        toggle: "Cambiar tema",
      },
      menu: {
        open: "Abrir menú",
        close: "Cerrar menú",
      },
      login: "Entrar",
      languageLabel: "Idioma",
      languageSelectLabel: "Seleccionar idioma de la landing page",
    },
    home: {
      hero: {
        splineTitle: "Demostración 3D de Orbis",
        titleLines: [
          { before: "Anticipando ", highlight: "fallas", after: "," },
          { before: "realizando operaciones ", highlight: "seguras", after: "." },
        ],
        subtitle: "Inteligencia operativa para empresas que no pueden equivocarse.",
        primaryCta: "Acceder a Orbis",
        secondaryCta: "Sobre",
        registerQuestion: "¿No tienes una cuenta?",
        registerCta: "Registrar empresa",
        scrollDownLabel: "Desplazarse hacia abajo",
      },
      quote: {
        before: "\"Prever ",
        highlight: "errores",
        middle: " hoy es evitar pérdidas ",
        secondHighlight: "mañana",
        after: "\"",
        supportText: "Confía en el proceso.",
        joinText: "Únete a Orbis",
      },
      benefits: {
        eyebrow: "Qué ofrecemos",
        title: "Tecnología que trabaja mientras lideras.",
      },
      process: {
        eyebrow: "Cómo funciona",
        titleLine1: "Simple para empezar.",
        titleLine2: "Poderoso en el uso.",
      },
      final: {
        title: "¿Listo para operar con seguridad?",
        description: "Únete a cientos de empresas que ya confían en Orbis.",
        cta: "Habla con nosotros",
      },
      features: [
        {
          icon: "/visibility.svg",
          title: "Monitoreo en tiempo real",
          desc: "Acompaña cada operación de tu empresa con dashboards precisos y alertas instantáneas.",
          delay: 0,
        },
        {
          icon: "/bolt.svg",
          title: "Predicción de fallas",
          desc: "Algoritmos predictivos identifican riesgos antes de que se conviertan en problemas reales.",
          delay: 80,
        },
        {
          icon: "/shield.svg",
          title: "Seguridad avanzada",
          desc: "Cifrado de extremo a extremo y control de acceso granular para cada usuario.",
          delay: 160,
        },
        {
          icon: "/analytics.svg",
          title: "Informes inteligentes",
          desc: "Informes automáticos con información accionable para decisiones más rápidas y acertadas.",
          delay: 240,
        },
      ],
      steps: [
        {
          n: "1",
          title: "Registra tu empresa",
          desc: "Crea tu cuenta en minutos y configura el perfil de tu organización.",
          delay: 0,
        },
        {
          n: "2",
          title: "Conecta tus operaciones",
          desc: "Integra sistemas existentes o utiliza nuestra plataforma nativa de monitoreo.",
          delay: 100,
        },
        {
          n: "3",
          title: "Monitorea y predice",
          desc: "Recibe alertas inteligentes e identifica tendencias antes de que se conviertan en crisis.",
          delay: 200,
        },
        {
          n: "4",
          title: "Actúa con confianza",
          desc: "Toma decisiones respaldadas por datos reales y previsiones precisas.",
          delay: 300,
        },
      ],
    },
    dashboardPreview: {
      eyebrow: "Interfaz gráfica",
      titleLine1: "Dashboard",
      titleLine2: "preventivo",
      description:
        "Gestión general de tus máquinas en una interfaz intuitiva, con tu empresa en tu pantalla.",
      cta: "Empieza ahora",
      imageAlt: "Dashboard preventivo de Orbis",
    },
    about: {
      imageAlt: "Profesional Orbis",
      logoAlt: "Logo de Orbis",
      cta: "Acceder a Orbis",
      paragraphs: [
        [
          { text: "" },
          { text: "Orbis supervisa continuamente", strong: true },
          { text: " el funcionamiento de las " },
          { text: "máquinas y equipos industriales", strong: true },
          {
            text: ", identificando irregularidades antes de que se conviertan en problemas mayores y garantizando más ",
          },
          { text: "seguridad en la operación", strong: true },
          { text: "." },
        ],
        [
          { text: "Con " },
          { text: "monitoreo constante", strong: true },
          {
            text: ", el sistema detecta rápidamente cualquier alteración en el desempeño de los equipos, permitiendo que las medidas necesarias se tomen con ",
          },
          { text: "agilidad", strong: true },
          { text: " y " },
          { text: "evitando fallas en la producción", strong: true },
          { text: "." },
        ],
      ],
    },
    pricing: {
      titleBefore: "Nuestros",
      titleHighlight: "planes",
      subtitleLines: [
        "Elige el plan que se ajuste a tus necesidades",
        "y empieza hoy a prever tus problemas.",
      ],
      popularLabel: "Popular",
      plans: [
        {
          name: "Empresarial",
          isRecommended: true,
          description: "Para industrias que buscan control total de la operación.",
          features: [
            "Monitoreo de hasta 20 máquinas",
            "Alertas en tiempo real vía panel y dispositivo móvil",
            "Historial de 12 meses de datos de sensores",
            "Hasta 5 técnicos registrados",
            "Informes mensuales automáticos",
          ],
          buttonText: "Entrar en contacto",
          isPopular: true,
        },
        {
          name: "Equipos",
          description: "Para grandes plantas con múltiples líneas de producción.",
          features: [
            "Monitoreo ilimitado de máquinas",
            "Alertas prioritarias con escalamiento automático",
            "Historial completo y exportación de datos",
            "Técnicos y usuarios ilimitados",
            "Informes personalizados y soporte dedicado",
          ],
          buttonText: "Entrar en contacto",
        },
      ],
    },
    footer: {
      logoAria: "Orbis - Página inicial",
      brandText:
        "Inteligencia operativa para empresas que no pueden equivocarse. Anticipamos fallas, tú lideras con confianza.",
      copyright: "© 2026 Orbis. Todos los derechos reservados.",
      sections: [
        {
          title: "Navegación",
          links: [
            { title: "Inicio", href: "/" },
            { title: "Sobre", href: "/#sobre" },
            { title: "Planes", href: "/#planos" },
            { title: "Contacto", href: "/contact" },
          ],
        },
        {
          title: "Plataforma",
          links: [
            { title: "Login", href: "/login" },
            { title: "Registrar empresa", href: "/registro" },
            { title: "Dashboard", href: "/dashboard" },
          ],
        },
        {
          title: "Legal",
          links: [
            { title: "Política de Privacidad", href: "/login" },
            { title: "Términos de Uso", href: "#" },
            { title: "Página no encontrada", href: "/404-exemplo" },
          ],
        },
      ],
    },
  },
};

export function getLandingCopy(locale) {
  return LANDING_COPY[normalizeLocale(locale) ?? DEFAULT_LOCALE];
}

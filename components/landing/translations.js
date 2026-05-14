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
        { label: "Contato", href: "/#contact" },
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
      /* Aqui é onde os cards do carrossel infinito são exibidos */
      features: [
        {
          icon: "/orbisIARoxa.svg",
          title: "IA operacional",
          desc: "Insights automáticos ajudam sua equipe a priorizar o que exige atenção primeiro.",
        },
        {
          icon: "/connect_icon_contact.svg",
          title: "Integrações rápidas",
          desc: "Conecte sensores, equipes e dados em uma experiência única de acompanhamento.",
        },
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
        {
          icon: "/accessibility.png", /* Falta por o icone de acessibilidade */
          title: "Acessibilidade total",
          desc: "Interface adaptada para todos os perfis de usuário, com suporte a leitores de tela e navegação por teclado.",
          delay: 320,
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
    contact: {
      faqTitle: "Perguntas Frequentes",
      faqs: [
        {
          question: "O que é o Orbis?",
          answer:
            "O Orbis é uma plataforma completa de gestão e comunicação para empresas e equipes que buscam mais eficiência no dia a dia.",
        },
        {
          question: "Como o Orbis pode ajudar minha empresa?",
          answer:
            "O Orbis centraliza todas as suas comunicações, tarefas e projetos em um só lugar, facilitando a colaboração entre equipes e melhorando a produtividade.",
        },
        {
          question: "O Orbis garante minha privacidade?",
          answer:
            "Sim! O Orbis utiliza criptografia avançada e segue as melhores práticas de segurança para proteger seus dados e garantir a privacidade da sua empresa.",
        },
        {
          question: "Como entro em contato com o suporte?",
          answer:
            "Você pode entrar em contato pelo WhatsApp ou pelo e-mail suporte.orbis@gmail.com.",
        },
        {
          question: "Preciso ser um expert em tecnologia para usar o Orbis?",
          answer:
            "Não, o Orbis foi desenvolvido com uma interface intuitiva e fácil de usar, mesmo para usuários menos experientes em tecnologia.",
        },
      ],
      cards: {
        whatsapp: "Whatsapp",
        email: "E-mail",
      },
      formTitle: "Fale Conosco",
      formDescription: "Preencha o formulário e entraremos em contato em breve.",
      fields: {
        name: "Seu nome",
        email: "Seu e-mail",
        subject: "Assunto",
        message: "Mensagem",
      },
      validation: {
        name: "Informe um nome entre 2 e 80 caracteres.",
        email: "Informe um e-mail válido.",
        subject: "Informe um assunto entre 3 e 120 caracteres.",
        message: "A mensagem precisa ter entre 10 e 2000 caracteres.",
      },
      successMessage: "Mensagem enviada com sucesso! Em breve entraremos em contato.",
      errorMessage: "Não foi possível enviar a mensagem agora.",
      submit: "Enviar mensagem",
      sending: "Enviando...",
    },
    login: {
      greeting: "Bem-vindo de volta",
      subtitle: "Acesse sua conta para continuar",
      fields: {
        email: "Email",
        password: "Senha",
      },
      forgotPassword: "Esqueceu a senha?",
      submit: "Entrar",
      sessionError: "Login realizado, mas não foi possível iniciar a sessão.",
      showPassword: "Mostrar senha",
      hidePassword: "Ocultar senha",
      privacy: {
        agreementBefore: "Ao continuar, você concorda com nossa",
        linkText: "Política de Privacidade",
        title: "Política de Privacidade",
        lastUpdated: "Última atualização: março de 2025",
        closeLabel: "Fechar política de privacidade",
        confirm: "Entendi",
        sections: [
          {
            title: "1. Informações que coletamos",
            text: "Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail e dados de acesso ao criar uma conta ou entrar em contato conosco.",
          },
          {
            title: "2. Como usamos suas informações",
            text: "Utilizamos suas informações para fornecer, manter e melhorar nossos serviços, enviar comunicações relacionadas à conta e garantir a segurança da plataforma.",
          },
          {
            title: "3. Armazenamento e segurança",
            text: "Seus dados são armazenados em servidores seguros com criptografia em trânsito e em repouso.",
          },
          {
            title: "4. Cookies",
            text: "Utilizamos cookies para manter sua sessão ativa e entender como você interage com a plataforma.",
          },
          {
            title: "5. Seus direitos",
            text: "Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento pelo e-mail suporte.orbis@gmail.com.",
          },
          {
            title: "6. Retenção de dados",
            text: "Mantemos seus dados pelo tempo necessário para a prestação dos serviços ou conforme exigido por lei.",
          },
          {
            title: "7. Alterações nesta política",
            text: "Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas por e-mail.",
          },
          {
            title: "8. Contato",
            text: "Dúvidas? Entre em contato pelo e-mail suporte.orbis@gmail.com.",
          },
        ],
      },
    },
    passwordReset: {
      eyebrow: "Acesso a conta",
      title: "Redefinir senha",
      subtitle: "Informe o e-mail da conta e o e-mail que deve receber o codigo. Depois valide o codigo enviado para criar uma nova senha.",
      cardTitle: "Recuperacao de acesso",
      cardDescription: "O codigo expira em 15 minutos.",
      successTitle: "Senha redefinida",
      successDescription: "A nova senha foi salva. Voce ja pode voltar ao login.",
      stepLabel: "Etapa",
      steps: ["E-mails", "Codigo", "Nova senha"],
      fields: {
        email: "E-mail da conta",
        emailDestino: "E-mail de destino",
        code: "Codigo recebido",
        novaSenha: "Nova senha",
        confirmarSenha: "Confirmar nova senha",
      },
      placeholders: {
        email: "conta@empresa.com",
        emailDestino: "destino@empresa.com",
        code: "000000",
        novaSenha: "Digite a nova senha",
        confirmarSenha: "Repita a nova senha",
      },
      actions: {
        sendCode: "Enviar codigo",
        sendingCode: "Enviando...",
        validateCode: "Validar codigo",
        validatingCode: "Validando...",
        changePassword: "Redefinir senha",
        changingPassword: "Redefinindo...",
        goToLogin: "Entrar",
        restart: "Comecar de novo",
      },
      messages: {
        codeSent: "Se o usuario existir, o codigo sera enviado.",
        codeValid: "Codigo valido.",
        passwordChanged: "Senha redefinida com sucesso.",
        requestError: "Nao foi possivel enviar o codigo.",
        codeError: "Nao foi possivel validar o codigo.",
        passwordError: "Nao foi possivel redefinir a senha.",
      },
      validation: {
        email: "Informe um e-mail de conta valido.",
        emailDestino: "Informe um e-mail de destino valido.",
        code: "Informe os 6 numeros do codigo recebido.",
        password: "A senha precisa ter 7+ caracteres, letra maiuscula, minuscula e numero, sem espacos.",
        passwordMatch: "A nova senha e a confirmacao nao coincidem.",
      },
      passwordHint: "Use 7 ou mais caracteres, com letra maiuscula, minuscula e numero.",
      codeHint: "Digite exatamente 6 numeros.",
      backHome: "Voltar para Início",
      backLogin: "Voltar ao login",
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
            { title: "Contato", href: "/#contact" },
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
        { label: "Contact", href: "/#contact" },
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
    contact: {
      faqTitle: "Frequently Asked Questions",
      faqs: [
        {
          question: "What is Orbis?",
          answer:
            "Orbis is a complete management and communication platform for companies and teams looking for more efficiency in their daily operations.",
        },
        {
          question: "How can Orbis help my company?",
          answer:
            "Orbis centralizes your communications, tasks, and projects in one place, making team collaboration easier and improving productivity.",
        },
        {
          question: "Does Orbis protect my privacy?",
          answer:
            "Yes. Orbis uses advanced encryption and follows security best practices to protect your data and safeguard your company's privacy.",
        },
        {
          question: "How do I contact support?",
          answer:
            "You can contact us through WhatsApp or by email at suporte.orbis@gmail.com.",
        },
        {
          question: "Do I need to be a technology expert to use Orbis?",
          answer:
            "No. Orbis was designed with an intuitive, easy-to-use interface, even for users with less technology experience.",
        },
      ],
      cards: {
        whatsapp: "WhatsApp",
        email: "Email",
      },
      formTitle: "Contact Us",
      formDescription: "Fill out the form and we will get back to you soon.",
      fields: {
        name: "Your name",
        email: "Your email",
        subject: "Subject",
        message: "Message",
      },
      validation: {
        name: "Enter a name between 2 and 80 characters.",
        email: "Enter a valid email address.",
        subject: "Enter a subject between 3 and 120 characters.",
        message: "The message must be between 10 and 2000 characters.",
      },
      successMessage: "Message sent successfully! We will contact you soon.",
      errorMessage: "We could not send the message right now.",
      submit: "Send message",
      sending: "Sending...",
    },
    login: {
      greeting: "Welcome back",
      subtitle: "Access your account to continue",
      fields: {
        email: "Email",
        password: "Password",
      },
      forgotPassword: "Forgot password?",
      submit: "Sign in",
      sessionError: "Signed in, but we could not start the session.",
      showPassword: "Show password",
      hidePassword: "Hide password",
      privacy: {
        agreementBefore: "By continuing, you agree to our",
        linkText: "Privacy Policy",
        title: "Privacy Policy",
        lastUpdated: "Last updated: March 2025",
        closeLabel: "Close privacy policy",
        confirm: "Got it",
        sections: [
          {
            title: "1. Information we collect",
            text: "We collect information you provide directly, such as your name, email address, and access data when you create an account or contact us.",
          },
          {
            title: "2. How we use your information",
            text: "We use your information to provide, maintain, and improve our services, send account-related communications, and keep the platform secure.",
          },
          {
            title: "3. Storage and security",
            text: "Your data is stored on secure servers with encryption in transit and at rest.",
          },
          {
            title: "4. Cookies",
            text: "We use cookies to keep your session active and understand how you interact with the platform.",
          },
          {
            title: "5. Your rights",
            text: "You have the right to access, correct, or delete your personal information at any time by emailing suporte.orbis@gmail.com.",
          },
          {
            title: "6. Data retention",
            text: "We keep your data for as long as necessary to provide the services or as required by law.",
          },
          {
            title: "7. Changes to this policy",
            text: "We may update this Privacy Policy periodically. We will notify you of significant changes by email.",
          },
          {
            title: "8. Contact",
            text: "Questions? Contact us at suporte.orbis@gmail.com.",
          },
        ],
      },
    },
    passwordReset: {
      eyebrow: "Account access",
      title: "Reset password",
      subtitle: "Enter the account email and the email that should receive the code. Then validate the code to create a new password.",
      cardTitle: "Access recovery",
      cardDescription: "The code expires in 15 minutes.",
      successTitle: "Password reset",
      successDescription: "The new password was saved. You can return to sign in.",
      stepLabel: "Step",
      steps: ["Emails", "Code", "New password"],
      fields: {
        email: "Account email",
        emailDestino: "Destination email",
        code: "Received code",
        novaSenha: "New password",
        confirmarSenha: "Confirm new password",
      },
      placeholders: {
        email: "account@company.com",
        emailDestino: "destination@company.com",
        code: "000000",
        novaSenha: "Enter the new password",
        confirmarSenha: "Repeat the new password",
      },
      actions: {
        sendCode: "Send code",
        sendingCode: "Sending...",
        validateCode: "Validate code",
        validatingCode: "Validating...",
        changePassword: "Reset password",
        changingPassword: "Resetting...",
        goToLogin: "Sign in",
        restart: "Start over",
      },
      messages: {
        codeSent: "If the user exists, the code will be sent.",
        codeValid: "Code is valid.",
        passwordChanged: "Password reset successfully.",
        requestError: "We could not send the code.",
        codeError: "We could not validate the code.",
        passwordError: "We could not reset the password.",
      },
      validation: {
        email: "Enter a valid account email.",
        emailDestino: "Enter a valid destination email.",
        code: "Enter the 6 numbers from the received code.",
        password: "The password needs 7+ characters, uppercase, lowercase and a number, without spaces.",
        passwordMatch: "The new password and confirmation do not match.",
      },
      passwordHint: "Use 7 or more characters, with uppercase, lowercase and a number.",
      codeHint: "Enter exactly 6 numbers.",
      backHome: "Back to landing",
      backLogin: "Back to sign in",
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
            { title: "Contact", href: "/#contact" },
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
        { label: "Contacto", href: "/#contact" },
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
    contact: {
      faqTitle: "Preguntas Frecuentes",
      faqs: [
        {
          question: "¿Qué es Orbis?",
          answer:
            "Orbis es una plataforma completa de gestión y comunicación para empresas y equipos que buscan más eficiencia en el día a día.",
        },
        {
          question: "¿Cómo puede Orbis ayudar a mi empresa?",
          answer:
            "Orbis centraliza tus comunicaciones, tareas y proyectos en un solo lugar, facilitando la colaboración entre equipos y mejorando la productividad.",
        },
        {
          question: "¿Orbis garantiza mi privacidad?",
          answer:
            "Sí. Orbis utiliza cifrado avanzado y sigue las mejores prácticas de seguridad para proteger tus datos y garantizar la privacidad de tu empresa.",
        },
        {
          question: "¿Cómo contacto al soporte?",
          answer:
            "Puedes contactarnos por WhatsApp o por correo electrónico en suporte.orbis@gmail.com.",
        },
        {
          question: "¿Necesito ser experto en tecnología para usar Orbis?",
          answer:
            "No. Orbis fue desarrollado con una interfaz intuitiva y fácil de usar, incluso para usuarios con menos experiencia en tecnología.",
        },
      ],
      cards: {
        whatsapp: "WhatsApp",
        email: "Email",
      },
      formTitle: "Contáctanos",
      formDescription: "Completa el formulario y nos pondremos en contacto pronto.",
      fields: {
        name: "Tu nombre",
        email: "Tu email",
        subject: "Asunto",
        message: "Mensaje",
      },
      validation: {
        name: "Ingresa un nombre entre 2 y 80 caracteres.",
        email: "Ingresa un email válido.",
        subject: "Ingresa un asunto entre 3 y 120 caracteres.",
        message: "El mensaje debe tener entre 10 y 2000 caracteres.",
      },
      successMessage: "¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.",
      errorMessage: "No fue posible enviar el mensaje ahora.",
      submit: "Enviar mensaje",
      sending: "Enviando...",
    },
    login: {
      greeting: "Bienvenido de nuevo",
      subtitle: "Accede a tu cuenta para continuar",
      fields: {
        email: "Email",
        password: "Contraseña",
      },
      forgotPassword: "¿Olvidaste tu contraseña?",
      submit: "Entrar",
      sessionError: "Se inició sesión, pero no fue posible abrir la sesión de la plataforma.",
      showPassword: "Mostrar contraseña",
      hidePassword: "Ocultar contraseña",
      privacy: {
        agreementBefore: "Al continuar, aceptas nuestra",
        linkText: "Política de Privacidad",
        title: "Política de Privacidad",
        lastUpdated: "Última actualización: marzo de 2025",
        closeLabel: "Cerrar política de privacidad",
        confirm: "Entendido",
        sections: [
          {
            title: "1. Información que recopilamos",
            text: "Recopilamos información que nos proporcionas directamente, como nombre, dirección de email y datos de acceso al crear una cuenta o contactarnos.",
          },
          {
            title: "2. Cómo usamos tu información",
            text: "Utilizamos tu información para proporcionar, mantener y mejorar nuestros servicios, enviar comunicaciones relacionadas con la cuenta y garantizar la seguridad de la plataforma.",
          },
          {
            title: "3. Almacenamiento y seguridad",
            text: "Tus datos se almacenan en servidores seguros con cifrado en tránsito y en reposo.",
          },
          {
            title: "4. Cookies",
            text: "Utilizamos cookies para mantener tu sesión activa y entender cómo interactúas con la plataforma.",
          },
          {
            title: "5. Tus derechos",
            text: "Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier momento por el email suporte.orbis@gmail.com.",
          },
          {
            title: "6. Retención de datos",
            text: "Mantenemos tus datos durante el tiempo necesario para prestar los servicios o según lo exija la ley.",
          },
          {
            title: "7. Cambios en esta política",
            text: "Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos por email sobre cambios significativos.",
          },
          {
            title: "8. Contacto",
            text: "¿Dudas? Contáctanos por email en suporte.orbis@gmail.com.",
          },
        ],
      },
    },
    passwordReset: {
      eyebrow: "Acceso a la cuenta",
      title: "Restablecer contrasena",
      subtitle: "Ingresa el email de la cuenta y el email que debe recibir el codigo. Luego valida el codigo para crear una nueva contrasena.",
      cardTitle: "Recuperacion de acceso",
      cardDescription: "El codigo vence en 15 minutos.",
      successTitle: "Contrasena restablecida",
      successDescription: "La nueva contrasena fue guardada. Ya puedes volver al login.",
      stepLabel: "Paso",
      steps: ["Emails", "Codigo", "Nueva contrasena"],
      fields: {
        email: "Email de la cuenta",
        emailDestino: "Email de destino",
        code: "Codigo recibido",
        novaSenha: "Nueva contrasena",
        confirmarSenha: "Confirmar nueva contrasena",
      },
      placeholders: {
        email: "cuenta@empresa.com",
        emailDestino: "destino@empresa.com",
        code: "000000",
        novaSenha: "Ingresa la nueva contrasena",
        confirmarSenha: "Repite la nueva contrasena",
      },
      actions: {
        sendCode: "Enviar codigo",
        sendingCode: "Enviando...",
        validateCode: "Validar codigo",
        validatingCode: "Validando...",
        changePassword: "Restablecer contrasena",
        changingPassword: "Restableciendo...",
        goToLogin: "Entrar",
        restart: "Empezar de nuevo",
      },
      messages: {
        codeSent: "Si el usuario existe, se enviara el codigo.",
        codeValid: "Codigo valido.",
        passwordChanged: "Contrasena restablecida con exito.",
        requestError: "No fue posible enviar el codigo.",
        codeError: "No fue posible validar el codigo.",
        passwordError: "No fue posible restablecer la contrasena.",
      },
      validation: {
        email: "Ingresa un email de cuenta valido.",
        emailDestino: "Ingresa un email de destino valido.",
        code: "Ingresa los 6 numeros del codigo recibido.",
        password: "La contrasena necesita 7+ caracteres, mayuscula, minuscula y numero, sin espacios.",
        passwordMatch: "La nueva contrasena y la confirmacion no coinciden.",
      },
      passwordHint: "Usa 7 o mas caracteres, con mayuscula, minuscula y numero.",
      codeHint: "Ingresa exactamente 6 numeros.",
      backHome: "Volver a la landing",
      backLogin: "Volver al login",
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
            { title: "Inicio", href: "/#inicio" },
            { title: "Sobre", href: "/#sobre" },
            { title: "Planes", href: "/#planos" },
            { title: "Contacto", href: "/#contact" },
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

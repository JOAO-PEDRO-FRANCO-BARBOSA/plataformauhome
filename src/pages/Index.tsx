import { KeyRound, MessageCircle, Search, Users, SlidersHorizontal, UserRoundSearch, Mail, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import logoUhome from "@/assets/Logo_Uhome.png";

const howItWorks = [
  {
    icon: Search,
    title: "Filtre por localização e preço",
    description:
      "Encontre o lugar que cabe no seu bolso e na sua rotina.",
  },
  {
    icon: MessageCircle,
    title: "Conecte-se com os moradores",
    description:
      "Tire suas dúvidas direto pela nossa plataforma, sem burocracia.",
  },
  {
    icon: KeyRound,
    title: "Feche o negócio e mude-se",
    description: "Simples, rápido e seguro.",
  },
];

const features = [
  {
    icon: Users,
    title: "Match de Perfil",
    description: "Nosso algoritmo conecta você a pessoas com hábitos parecidos. Chega de surpresas ruins na hora de dividir as contas.",
  },
  {
    icon: UserRoundSearch,
    title: "Contato Direto",
    description: "Fale com proprietários e moradores sem intermediários.",
  },
  {
    icon: SlidersHorizontal,
    title: "Filtros Inteligentes para Estudantes",
    description: "Refine por preço, distância e perfil da moradia em segundos.",
  },
];

const Index = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 transition hover:opacity-80 sm:gap-2"
          >
            <img src={logoUhome} alt="Uhome" className="h-12 w-12 object-contain sm:h-20 sm:w-20" />
            <span className="text-base font-bold text-purple-600 sm:text-xl">Uhome</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-transparent px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:px-7 sm:py-3.5 sm:text-base"
            >
              Entrar
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 sm:px-7 sm:py-3.5 sm:text-base"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-14 pt-20 transition-all duration-500 sm:px-6 lg:px-8 lg:pt-28">
          <div className="absolute inset-x-0 top-0 -z-10 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(147,51,234,0.18),transparent_60%)]"/>
          <div className="mx-auto w-full max-w-4xl text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex flex-col items-center gap-4">
                <img src={logoUhome} alt="Uhome" className="h-80 w-80 object-contain" />
              </div>
            </div>
            <h1 className="text-balance text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Encontre moradia perto da UFU sem dor de cabeça.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              Encontre seu lugar em minutos.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3">
              <Link
                to="/search"
                className="inline-flex items-center justify-center rounded-full bg-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-purple-700"
              >
                Encontrar moradia
              </Link>
              <p className="text-sm font-medium text-slate-500">Comece explorando quartos, repúblicas e apartamentos agora.</p>
            </div>
          </div>
          <div className="mx-auto mt-10 h-px w-full max-w-5xl bg-gradient-to-r from-transparent via-purple-300/70 to-transparent" />
        </section>

        <section className="relative overflow-hidden bg-purple-100/60 px-4 pb-20 pt-12 transition-all duration-500 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(147,51,234,0.24)_0%,rgba(147,51,234,0.12)_48%,rgba(255,255,255,0.18)_100%)]" />
          <div className="relative z-10 mx-auto w-full max-w-6xl">
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Sua nova casa em 3 passos
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {howItWorks.map((step) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.title}
                    className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_14px_35px_-18px_rgba(88,28,135,0.45)] transition-all duration-300 hover:-translate-y-2 hover:border-purple-300/70 hover:bg-purple-50/30 hover:shadow-[0_24px_45px_-20px_rgba(88,28,135,0.5)] lg:p-10"
                  >
                    <div className="mb-5 inline-flex rounded-xl bg-purple-100 p-4 text-purple-700">
                      <Icon className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-600">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="relative z-10 mx-auto mt-16 h-px w-full max-w-5xl bg-gradient-to-r from-transparent via-purple-300/70 to-transparent" />
        </section>

        <section className="px-4 pb-24 transition-all duration-500 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Feito para facilitar sua busca
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="rounded-2xl border border-slate-200/90 bg-white/90 p-8 shadow-[0_14px_35px_-18px_rgba(88,28,135,0.45)] transition-all duration-300 hover:-translate-y-2 hover:border-purple-300/70 hover:bg-purple-50/30 hover:shadow-[0_24px_45px_-20px_rgba(88,28,135,0.5)] lg:p-10"
                  >
                    <div className="mb-5 inline-flex rounded-xl bg-purple-100 p-4 text-purple-700">
                      <Icon className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-600">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div className="flex shrink-0 items-center gap-2">
            <img src={logoUhome} alt="Uhome" className="h-14 w-14 object-contain sm:h-16 sm:w-16 lg:h-20 lg:w-20" />
            <span className="font-bold text-lg text-purple-600">Uhome</span>
          </div>
          <p className="text-base font-medium text-slate-500 sm:text-lg md:flex-1 md:px-4 md:text-center">{currentYear} Uhome. Todos os direitos reservados.</p>
          <div className="flex shrink-0 items-center gap-4">
            <a href="mailto:projetouhome@gmail.com" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-purple-100 p-3.5 text-purple-600 transition hover:bg-purple-200" aria-label="E-mail">
              <Mail className="h-6 w-6" />
            </a>
            <a href="https://www.instagram.com/projetouhome/" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-purple-100 p-3.5 text-purple-600 transition hover:bg-purple-200" aria-label="Instagram">
              <Instagram className="h-6 w-6" />
            </a>
            <a href="https://wa.me/5566996308310" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-purple-100 p-3.5 text-purple-600 transition hover:bg-purple-200" aria-label="WhatsApp">
              <MessageCircle className="h-6 w-6" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

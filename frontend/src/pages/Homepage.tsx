import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  UtensilsCrossed,
  Hotel,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  Star,
  Quote
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Homepage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Ultra-Minimalist Header with Glassmorphism */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg shadow-slate-900/5">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-900 flex items-center justify-center">
                <span className="text-white font-serif text-lg font-semibold">L</span>
              </div>
              <span className="font-serif text-indigo-900 text-xl tracking-tight">Lumina</span>
            </Link>

            <Link to="/auth">
              <Button
                className="bg-indigo-900/90 hover:bg-indigo-900 text-white px-6 h-9 text-sm font-medium rounded-xl backdrop-blur-sm shadow-lg shadow-indigo-900/20 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/30"
              >
                Acessar Sistema
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - Boutique Charm */}
      <section className="min-h-screen flex items-center justify-center pt-20 pb-12 px-6 relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="relative z-10"
            >
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-sm font-medium mb-8"
              >
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                Experiência premium em gestão
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="font-serif text-5xl md:text-6xl lg:text-7xl text-indigo-900 leading-[1.1] mb-8"
              >
                Onde a{" "}
                <span className="italic text-amber-600">excelência</span>
                <br />
                encontra a gestão
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg text-slate-600 mb-10 leading-relaxed max-w-lg"
              >
                Uma plataforma refinada para restaurantes e pousadas que entendem
                que cada detalhe importa. Gestão elegante para hospitalidade de alto padrão.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="bg-indigo-900 hover:bg-indigo-800 text-white px-8 h-13 text-base font-medium rounded-xl shadow-xl shadow-indigo-900/20 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/30"
                  >
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 text-slate-700 px-8 h-13 text-base rounded-xl hover:bg-white hover:border-slate-400"
                >
                  Conhecer mais
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                variants={fadeInUp}
                className="mt-12 pt-8 border-t border-slate-200"
              >
                <p className="text-sm text-slate-500 mb-4">Confiado por estabelecimentos de excelência</p>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="font-serif text-3xl text-indigo-900">150+</p>
                    <p className="text-xs text-slate-500">Clientes</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="text-center">
                    <p className="font-serif text-3xl text-indigo-900">98%</p>
                    <p className="text-xs text-slate-500">Satisfação</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="text-center">
                    <p className="font-serif text-3xl text-indigo-900">24/7</p>
                    <p className="text-xs text-slate-500">Suporte</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Hero Images */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              {/* Main Image */}
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/15">
                  <img
                    src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80"
                    alt="Hotel boutique reception"
                    className="w-full h-[500px] object-cover"
                  />
                </div>

                {/* Floating Card - Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 border border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-serif text-2xl text-indigo-900">+47%</p>
                      <p className="text-sm text-slate-500">Eficiência operacional</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Card - Review */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                  className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl shadow-slate-900/10 border border-slate-100 max-w-[200px]"
                >
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 italic">"Transformou nossa operação"</p>
                  <p className="text-xs text-slate-400 mt-1">— Pousada Vista Mar</p>
                </motion.div>
              </div>

              {/* Secondary Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute -bottom-16 right-8 w-48 h-48 rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 border-4 border-white"
              >
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80"
                  alt="Fine dining"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
              Recursos
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-indigo-900 mb-6">
              Ferramentas pensadas para você
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Cada funcionalidade foi desenhada para elevar a experiência do seu estabelecimento
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: UtensilsCrossed,
                title: "PDV Restaurante",
                description: "Interface refinada para pedidos, comandas e pagamentos com elegância",
                accent: "amber"
              },
              {
                icon: Hotel,
                title: "Gestão de Quartos",
                description: "Reservas, check-in/out e ocupação em tempo real com clareza visual",
                accent: "indigo"
              },
              {
                icon: BarChart3,
                title: "Financeiro",
                description: "Controle completo de receitas, despesas e relatórios detalhados",
                accent: "emerald"
              },
              {
                icon: Shield,
                title: "Multi-tenant",
                description: "Gerencie múltiplas unidades com segurança e total isolamento",
                accent: "violet"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-slate-900/5 transition-all duration-500 border border-transparent hover:border-slate-100"
              >
                <div className={`w-14 h-14 rounded-2xl bg-${feature.accent}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 text-${feature.accent}-600`} />
                </div>
                <h3 className="font-serif text-xl text-indigo-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lifestyle Section */}
      <section id="solucoes" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Images Grid */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-lg h-48">
                    <img
                      src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80"
                      alt="Elegant table setting"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg h-64">
                    <img
                      src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80"
                      alt="Hotel room with sunlight"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="rounded-2xl overflow-hidden shadow-lg h-64">
                    <img
                      src="https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80"
                      alt="Gourmet dish being prepared"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg h-48">
                    <img
                      src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80"
                      alt="Cozy hotel reception"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>

              {/* Accent decoration */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 border-2 border-amber-500/30 rounded-2xl -z-10" />
            </motion.div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-medium mb-6">
                Para quem valoriza
              </span>
              <h2 className="font-serif text-4xl md:text-5xl text-indigo-900 mb-6 leading-tight">
                A arte de receber{" "}
                <span className="italic text-amber-600">bem</span>
              </h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                Desenvolvido para estabelecimentos que entendem que a experiência do cliente
                começa muito antes do primeiro contato. Cada detalhe foi pensado para refletir
                o mesmo cuidado que você tem com seus hóspedes.
              </p>

              <ul className="space-y-5 mb-10">
                {[
                  "Restaurantes fine dining e bistrôs autorais",
                  "Pousadas boutique e hotéis de charme",
                  "Redes com múltiplas unidades premium",
                  "Estabelecimentos em expansão estratégica"
                ].map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center gap-4 text-slate-700"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    </div>
                    {item}
                  </motion.li>
                ))}
              </ul>

              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-indigo-900 hover:bg-indigo-800 text-white px-8 h-12 text-base rounded-xl shadow-lg"
                >
                  Experimentar Agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Quote className="w-12 h-12 text-amber-300 mx-auto mb-8" />
            <blockquote className="font-serif text-3xl md:text-4xl text-indigo-900 leading-relaxed mb-8 italic">
              "O Lumina transformou completamente nossa operação.
              A elegância do sistema reflete exatamente o que buscamos
              entregar aos nossos hóspedes."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                  alt="Testimonial"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <p className="font-medium text-indigo-900">Ricardo Almeida</p>
                <p className="text-sm text-slate-500">Proprietário, Pousada Serra Dourada</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-indigo-900 relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-amber-300 text-sm font-medium mb-6">
            Comece hoje
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
            Pronto para elevar sua gestão?
          </h2>
          <p className="text-lg text-indigo-200 mb-10 max-w-xl mx-auto">
            Junte-se aos estabelecimentos que já transformaram sua operação
            e descobriram uma nova forma de gerir.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-white text-indigo-900 hover:bg-amber-50 px-10 h-13 text-base font-medium rounded-xl shadow-2xl shadow-black/20"
            >
              Acessar Sistema
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer id="sobre" className="py-16 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-900 flex items-center justify-center">
                <span className="text-white font-serif text-xl font-semibold">L</span>
              </div>
              <div>
                <span className="font-serif text-xl text-indigo-900">Lumina Host</span>
                <p className="text-xs text-slate-500">Gestão de Hospitalidade</p>
              </div>
            </div>

            <p className="text-sm text-slate-500">
              © 2026 Lumina Host. Todos os direitos reservados.
            </p>

            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-slate-500 hover:text-indigo-900 transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-sm text-slate-500 hover:text-indigo-900 transition-colors">
                Termos
              </a>
              <a href="#" className="text-sm text-slate-500 hover:text-indigo-900 transition-colors">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

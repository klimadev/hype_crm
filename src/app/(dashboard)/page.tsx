import Link from 'next/link';
import {
  Package,
  KanbanSquare,
  TrendingUp,
  Users,
  ArrowRight,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { label: 'Total de Leads', value: '24', change: '+12%', icon: Users, color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Produtos', value: '8', change: '+3', icon: Package, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Vendas este Mês', value: 'R$ 12.450', change: '+28%', icon: TrendingUp, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
  ];

  const quickActions = [
    {
      title: 'Quadro Kanban',
      description: 'Gerencie seus leads com arrastar e soltar',
      href: '/kanban',
      icon: KanbanSquare,
      gradient: 'from-zinc-900 to-zinc-700',
    },
    {
      title: 'Catálogo de Produtos',
      description: 'Adicione e edite produtos e serviços',
      href: '/products',
      icon: Package,
      gradient: 'from-emerald-600 to-emerald-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-100 rounded-3xl p-8 md:p-10 text-white dark:text-zinc-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Plataforma de CRM
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Bem-vindo ao Hype CRM! 👋</h1>
          <p className="text-lg text-zinc-300 dark:text-zinc-600 max-w-2xl leading-relaxed">
            Gerencie relacionamentos com clientes, acompanhe vendas e impulsione seu negócio com uma plataforma intuitiva e poderosa.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group relative bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-950/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bgColor} flex items-center justify-center shadow-lg shadow-black/5 dark:shadow-black/20`}>
                <stat.icon className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white mb-1 tracking-tight">{stat.value}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{stat.label}</p>
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${stat.bgColor.replace('bg-', 'from-').replace('/30', '/10').replace('50', '100').replace('950', '900')} to-transparent pointer-events-none`} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Target className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Ações Rápidas</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="group relative bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-950/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-transparent dark:from-zinc-800/30 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center shadow-lg shadow-black/10`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    {action.description}
                  </p>
                </div>
                <div className="pt-1">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 transition-colors">
                    <ArrowRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-900/50 dark:to-zinc-800/50 rounded-2xl p-6 border border-amber-100/50 dark:border-zinc-700/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Dica para máxima performance</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
              Arraste os leads entre as colunas do Kanban para atualizar o estágio de venda automaticamente. 
              Quanto mais rápido você mover um lead, maior a taxa de conversão do seu funil!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

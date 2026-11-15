import React, { useState } from 'react';
import {
  X, Search, BookOpen, Users, MessageSquare, Sparkles, Clock,
  CalendarCheck, CalendarX, Bot, Archive, Download, MessageSquareQuote,
  Edit3, Settings, Volume2, Copy, CheckCircle2, AlertCircle
} from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

type HelpTab = 'visao_geral' | 'filas_cadencia' | 'chat_agenda' | 'atalhos_dossie' | 'admin';

export default function HelpModal({ onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>('visao_geral');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { id: HelpTab; label: string; icon: React.ReactNode }[] = [
    { id: 'visao_geral', label: '1. Visão Geral & Login', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'filas_cadencia', label: '2. Filas & Cadência', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'chat_agenda', label: '3. Chat, IA & Agenda', icon: <CalendarCheck className="w-3.5 h-3.5" /> },
    { id: 'atalhos_dossie', label: '4. Atalhos & Dossiê', icon: <MessageSquareQuote className="w-3.5 h-3.5" /> },
    { id: 'admin', label: '5. Instruções IA & CSV', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  const q = searchQuery.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* CABEÇALHO DO MANUAL */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Guia Rápido da Central de Atendimento</h2>
              <p className="text-[11px] text-slate-400">Manual interativo de operação • Dr. Cristiano Miranda</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar dúvida (ex: desmarcar, gancho)..."
                className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
              />
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Fechar Guia"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO POR ABAS */}
        {!q && (
          <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* CONTEÚDO DO GUIA */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 flex-1">
          
          {/* SEÇÃO 1: VISÃO GERAL & LOGIN */}
          {(q ? 'login acesso som mudo colunas visao geral'.includes(q) || q.length > 2 : activeTab === 'visao_geral') && (
            <section className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-emerald-400">1. Estrutura do Painel & Controles Gerais</h3>
                <p className="text-xs text-slate-400">Como o ambiente é dividido para organizar o fluxo entre a Marina (IA) e a Poliana.</p>
              </div>

              {/* Miniatura Visual das 3 Colunas */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Arquitetura em 3 Colunas</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" /> Coluna 1: Fila de Pacientes
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Lista todos os contatos ativos, filtros de status, alertas de tempo sem resposta e pacientes prontos para o <strong>Gancho Clínico</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Coluna 2: Chat Central
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Histórico completo em tempo real, botões de controle de agenda/IA no topo e barra de <strong>Atalhos Rápidos</strong> acima do campo de envio.
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Coluna 3: Dossiê Gemini
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Resumo automático da triagem (motivo, modalidade e queixa), bloco de anotações internas e botão para copiar ao prontuário.
                    </p>
                  </div>
                </div>
              </div>

              {/* Barra Superior */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" /> Alerta Sonoro & Conexão
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sempre que um paciente enviar uma nova mensagem no WhatsApp, o painel emite um toque discreto. Caso precise silenciar temporariamente, clique em <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 text-[11px]">Som Ativo</span> no topo direito para alternar para <strong>Mudo</strong>.
                </p>
              </div>
            </section>
          )}

          {/* SEÇÃO 2: FILAS & CADÊNCIA */}
          {(q ? 'fila status aguardando atendimento agendado marina gancho clinico desapego positivo arquivado'.includes(q) || q.length > 2 : activeTab === 'filas_cadencia') && (
            <section className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-emerald-400">2. Etiquetas de Status & Cadência de Retorno</h3>
                <p className="text-xs text-slate-400">Entenda o significado de cada selo colorido na lista da esquerda e a rotina de acompanhamento.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Aguardando Poliana
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A Marina finalizou a triagem e transferiu o paciente. <strong>Prioridade máxima:</strong> aguarda a primeira resposta humana da Poliana.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Atendimento Poliana
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Conversa já assumida pela Poliana. Enquanto estiver neste status, a Marina permanece pausada para não interromper a negociação.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    🕒 Gancho Clínico (24h–48h)
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Paciente recebeu valores/horários mas não respondeu entre 24h e 48h. Clique no filtro <strong>Gancho (24h-48h)</strong> e envie o atalho correspondente.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300 border border-slate-600">
                    Arquivado (+8d • Desapego)
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Após <strong>8 dias</strong> sem retorno, o sistema envia automaticamente uma mensagem elegante de encerramento e limpa a fila ativa. Se o paciente responder depois, ele volta sozinho para o topo!
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* SEÇÃO 3: CHAT, IA & AGENDA */}
          {(q ? 'agendar desmarcar reabrir reativar marina pausar ia exportar arquivar'.includes(q) || q.length > 2 : activeTab === 'chat_agenda') && (
            <section className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-emerald-400">3. Botões de Ação do Chat (Agenda & Controle da IA)</h3>
                <p className="text-xs text-slate-400">Como controlar o status da consulta e alternar entre atendimento humano e inteligência artificial.</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4 text-emerald-400" /> Marcar Agendado
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Clique assim que confirmar dia e horário na agenda. O paciente recebe o selo azul <strong>Agendado</strong> e sai da fila de cobrança/follow-up automático.
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-medium shrink-0 self-start sm:self-center">
                    Marcar Agendado
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <CalendarX className="w-4 h-4 text-amber-400" /> Desmarcar / Reabrir (Se o paciente cancelar)
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Quando o paciente já está agendado, o botão verde muda para <strong>Desmarcar / Reabrir</strong>. Ao clicar, o contato volta para <strong>Atendimento Poliana</strong> e o relógio de acompanhamento (24h–48h / 8 dias) reinicia do zero para remarcar.
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-semibold shrink-0 self-start sm:self-center">
                    Desmarcar / Reabrir
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-purple-400" /> Pausar IA / Reativar Marina IA
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Ao enviar qualquer mensagem pelo painel, a Marina pausa automaticamente. Use <strong>Reativar Marina IA</strong> apenas se quiser devolver a conversa para a triagem automática.
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-semibold shrink-0 self-start sm:self-center">
                    Reativar Marina IA
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Archive className="w-3.5 h-3.5 text-slate-400" /> Arquivar Manualmente
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Remove contatos encerrados ou enganos da lista ativa sem apagar o histórico.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-slate-400" /> Exportar (.txt)
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Baixa a transcrição completa daquela conversa individual com data e hora.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SEÇÃO 4: ATALHOS & DOSSIÊ */}
          {(q ? 'atalhos mensagens prontas editar nome dossie resumo prontuario notas'.includes(q) || q.length > 2 : activeTab === 'atalhos_dossie') && (
            <section className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-emerald-400">4. Atalhos Rápidos & Dossiê de Triagem</h3>
                <p className="text-xs text-slate-400">Agilidade para responder dúvidas frequentes e transferir dados clínicos para o prontuário.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <MessageSquareQuote className="w-4 h-4 text-emerald-400" /> Como usar e editar os Atalhos Rápidos
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                  <li>Clique em qualquer pílula acima da caixa de texto (ex.: <strong>Gancho Clínico</strong>, <strong>Horários Savassi</strong>, <strong>Regra de Reembolso</strong>).</li>
                  <li>O texto é preenchido automaticamente no campo de envio — revise se desejar e aperte <strong>Enter</strong>.</li>
                  <li>Para alterar o título ou o texto de qualquer botão, clique no ícone de lápis (<Edit3 className="w-3 h-3 inline text-slate-400" />) no canto direito da barra de atalhos e informe a <strong>senha de operador</strong>.</li>
                </ol>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Dica: Ao editar um modelo, use <strong>{'{nome}'}</strong> para o sistema inserir o primeiro nome do paciente automaticamente.</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Copy className="w-4 h-4 text-purple-400" /> Dossiê do Gemini & Prontuário
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Na coluna da direita, confira o motivo do contato, modalidade (Presencial Savassi ou Teleconsulta) e queixa principal coletados pela Marina. Use o campo <strong>Anotações Internas (Poliana)</strong> para observações da recepção (salvo automaticamente) e clique em <strong>Copiar para o Prontuário</strong> para colar tudo formatado no sistema médico.
                </p>
              </div>
            </section>
          )}

          {/* SEÇÃO 5: ADMINISTRAÇÃO */}
          {(q ? 'instrucoes ia system prompt csv planilha relatorio administrador'.includes(q) || q.length > 2 : activeTab === 'admin') && (
            <section className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-purple-400">5. Administração da Marina & Exportação CSV</h3>
                <p className="text-xs text-slate-400">Área protegida pela senha do administrador mestre no botão <strong>Instruções IA</strong> (topo direito).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" /> System Instructions da Marina
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Permite ajustar regras de atendimento, valores de consulta, endereço ou horários diretamente no banco de dados. Ao clicar em <strong>Salvar Instruções</strong>, a Marina passa a seguir as novas regras imediatamente, sem precisar atualizar o servidor.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" /> Planilha Consolidada (CSV)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Selecione o período desejado (<strong>7 dias</strong>, <strong>30 dias</strong> ou <strong>Tudo</strong>) e clique em <strong>Baixar Planilha CSV</strong> para auditar volume de leads, motivos de contato e conversões no Excel ou Google Planilhas.
                  </p>
                </div>
              </div>

              <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-[11px] text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Evite alterar as instruções da Marina sem validar o fluxo de handoff, pois mudanças nas regras de transferência podem afetar o momento em que ela chama a Poliana.</span>
              </div>
            </section>
          )}

        </div>

        {/* RODAPÉ */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>Central de Atendimento • crm.drcristianomiranda.com.br</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
          >
            Entendi, voltar ao painel
          </button>
        </div>

      </div>
    </div>
  );
}

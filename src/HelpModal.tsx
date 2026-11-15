import React, { useState } from 'react';
import {
  X, Search, BookOpen, Users, MessageSquare, Sparkles, Clock,
  CalendarCheck, CalendarX, Bot, Archive, Download, MessageSquareQuote,
  Edit3, Settings, Volume2, Copy, CheckCircle2, AlertCircle, HeartHandshake,
  ShieldCheck, Zap, Monitor
} from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

type MainSection = 'painel' | 'protocolo';

export default function HelpModal({ onClose }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState<MainSection>('painel');
  const [searchQuery, setSearchQuery] = useState('');

  const q = searchQuery.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Central de Ajuda • Dr. Cristiano Miranda</h2>
              <p className="text-[11px] text-slate-400">Escolha entre o guia técnico do painel ou o manual de postura no atendimento</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar dúvida rápida..."
                className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-60"
              />
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Fechar Ajuda"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SELETOR PRINCIPAL EM 2 ABAS CLARAS */}
        {!q && (
          <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 grid grid-cols-2 gap-3 shrink-0">
            <button
              onClick={() => setActiveSection('painel')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition border ${
                activeSection === 'painel'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Instruções do Painel (Sistema & Botões)
            </button>

            <button
              onClick={() => setActiveSection('protocolo')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition border ${
                activeSection === 'protocolo'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              Protocolo de Atendimento (Postura & Cadência)
            </button>
          </div>
        )}

        {/* CORPO DO CONTEÚDO */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 flex-1">
          
          {/* ===================================================================== */}
          {/* ABA 1: INSTRUÇÕES DO PAINEL (FUNCIONALIDADES E BOTÕES DO CRM)         */}
          {/* ===================================================================== */}
          {(q ? 'painel colunas som mudo etiqueta filtro aguardando atendimento agendado desmarcar reabrir marina atalhos dossie prontuario admin csv'.includes(q) || q.length > 2 : activeSection === 'painel') && (
            <div className="space-y-6">
              
              {/* BLOCO 1.1: ESTRUTURA DO PAINEL */}
              <section className="space-y-3">
                <div className="border-b border-slate-800 pb-1.5">
                  <h3 className="text-sm font-bold text-emerald-400">1. Visão Geral das 3 Colunas</h3>
                  <p className="text-xs text-slate-400">Como navegar pelas conversas, mensagens e resumo da triagem.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" /> Esquerda: Lista de Contatos
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Filtra pacientes por fila (<strong>Aguardando</strong>, <strong>Atendimento</strong>, <strong>Agendados</strong>, <strong>Marina</strong>) e por cadência (<strong>Gancho 24h-48h</strong> e <strong>Arquivados</strong>).
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Centro: Chat em Tempo Real
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Exibe mensagens do paciente (branco), da Marina IA (lilás) e da Poliana (verde), além dos botões de ação no topo e atalhos rápidos embaixo.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Direita: Resumo do Gemini
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Consolida motivo, modalidade e queixa da triagem, campo de <strong>Anotações Internas</strong> e botão <strong>Copiar para o Prontuário</strong>.
                    </p>
                  </div>
                </div>
              </section>

              {/* BLOCO 1.2: ETIQUETAS DE STATUS */}
              <section className="space-y-3">
                <div className="border-b border-slate-800 pb-1.5">
                  <h3 className="text-sm font-bold text-emerald-400">2. Significado das Etiquetas na Lista</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 mt-0.5">
                      Marina Ativa
                    </span>
                    <p className="text-[11px] text-slate-400">A IA está conduzindo a triagem inicial. <strong>Não envie mensagens</strong> enquanto este selo estiver ativo.</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 mt-0.5">
                      Aguardando Poliana
                    </span>
                    <p className="text-[11px] text-slate-400">Triagem concluída pela IA. Prioridade máxima para a Poliana assumir e agendar.</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 mt-0.5">
                      Atendimento Poliana
                    </span>
                    <p className="text-[11px] text-slate-400">Conversa já assumida pela secretária (Marina pausada automaticamente).</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0 mt-0.5">
                      Gancho Clínico
                    </span>
                    <p className="text-[11px] text-slate-400">Paciente entre 24h e 48h sem resposta. Pronto para receber a mensagem de acompanhamento.</p>
                  </div>
                </div>
              </section>

              {/* BLOCO 1.3: BOTÕES DE AÇÃO DO CHAT */}
              <section className="space-y-3">
                <div className="border-b border-slate-800 pb-1.5">
                  <h3 className="text-sm font-bold text-emerald-400">3. Botões de Controle (Agenda, IA e Atalhos)</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" /> Marcar Agendado / Desmarcar e Reabrir
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Clique em <strong>Marcar Agendado</strong> ao confirmar a consulta. Se o paciente cancelar depois, clique no mesmo botão (que vira <strong>Desmarcar / Reabrir</strong>) para devolvê-lo à fila ativa e reiniciar o relógio de acompanhamento.
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[10px] font-medium">Marcar Agendado</span>
                      <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-medium">Desmarcar / Reabrir</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-purple-400" /> Pausar IA / Reativar Marina IA
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Enviar qualquer mensagem pausa a IA automaticamente. Use <strong>Reativar Marina IA</strong> somente se quiser devolver o paciente para o robô.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-medium shrink-0">
                      Reativar Marina IA
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <div className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                        <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-400" /> Atalhos & Edição (<Edit3 className="w-3 h-3 inline" />)
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Clique na pílula para preencher o texto. Use o lápis (com senha de operador) e a tag <strong>{'{nome}'}</strong> para editar modelos.
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <div className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Som Ativo / Exportar
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Silencie alertas sonoros no topo ou baixe o histórico individual da conversa em <strong>.txt</strong> pelo botão <strong>Exportar</strong>.
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <div className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                        <Settings className="w-3.5 h-3.5 text-purple-400" /> Instruções IA & CSV
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Área mestre (topo direito) para editar o prompt da Marina em tempo real e exportar relatórios gerais em planilha <strong>CSV</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          )}

          {/* ===================================================================== */}
          {/* ABA 2: PROTOCOLO DE ATENDIMENTO (POSTURA & RECUPERAÇÃO SAÚDE PREMIUM) */}
          {/* ===================================================================== */}
          {(q ? 'protocolo postura ansiedade atropelar cobranca gancho clinico desapego positivo caro valor preco desconto automatico checklist'.includes(q) || q.length > 2 : activeSection === 'protocolo') && (
            <div className="space-y-6">

              {/* BLOCO 2.1: POSTURA E ERRO FATAL (ANSIEDADE) */}
              <section className="space-y-3">
                <div className="border-b border-slate-800 pb-1.5">
                  <h3 className="text-sm font-bold text-emerald-400">1. Postura Saúde Premium & Controle da Ansiedade</h3>
                  <p className="text-xs text-slate-400">Na medicina particular integrativa, confiança e acolhimento convertem muito mais do que pressa comercial.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-rose-950/25 border border-rose-800/40 rounded-xl p-4 space-y-2">
                    <div className="font-bold text-rose-300 text-xs">❌ O que NUNCA fazer (Erros Fatais)</div>
                    <ul className="list-disc list-inside text-slate-300 space-y-1.5 leading-relaxed">
                      <li>
                        <strong>Ansiedade de atropelar a Marina IA:</strong> Não entre na conversa enquanto o selo estiver <em>Marina Ativa</em>. Interromper a IA no meio da triagem joga valores e horários antes da hora e quebra o acolhimento.
                      </li>
                      <li>
                        <strong>Follow-up de cobrança:</strong> Nunca envie <em>"Oi, sumiu? Vamos fechar a consulta?"</em> ou <em>"Conseguiu ver os valores?"</em>. Isso gera pressão e rebaixa a consulta médica a produto de balcão.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-emerald-950/25 border border-emerald-800/40 rounded-xl p-4 space-y-2">
                    <div className="font-bold text-emerald-300 text-xs">✅ Postura Padrão da Clínica</div>
                    <ul className="list-disc list-inside text-slate-300 space-y-1.5 leading-relaxed">
                      <li>
                        <strong>Respeite o tempo da triagem:</strong> Deixe a Marina acolher o paciente e só assuma quando o card mudar para <strong>Aguardando Poliana</strong>.
                      </li>
                      <li>
                        <strong>Foco no cuidado antes do preço:</strong> Esclareça como funciona a consulta integrativa antes de falar de agenda.
                      </li>
                      <li>
                        <strong>Tom sereno e elegante:</strong> Escreva com calma, pontuação correta e no máximo 1 emoji discreto por mensagem.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* BLOCO 2.2: AS 2 ETAPAS DA CADÊNCIA (MANUAL VS AUTOMÁTICA) */}
              <section className="space-y-3">
                <div className="border-b border-slate-800 pb-1.5">
                  <h3 className="text-sm font-bold text-emerald-400">2. Cadência de Recuperação (O que é Manual vs. Automático)</h3>
                  <p className="text-xs text-slate-400">Divisão exata de responsabilidades quando o paciente para de responder.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* ETAPA 1: MANUAL */}
                  <div className="bg-slate-950 border border-blue-800/50 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-blue-300 text-xs">Etapa 1: Gancho Clínico (24h–48h)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                        MANUAL (POLIANA)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Entre 24h e 48h de silêncio, abra o filtro <strong>Gancho (24h-48h)</strong> e clique no atalho <strong>Gancho Clínico</strong>. Ao dizer que o <strong>Dr. Cristiano pediu para checar dúvidas sobre o formato</strong>, você ativa a autoridade médica sem cobrar resposta.
                    </p>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5 text-[11px]">
                      <div className="font-semibold text-slate-200">Como conduzir se o paciente responder:</div>
                      <p className="text-slate-400">• <strong>Dúvida sobre a consulta:</strong> Explique o atendimento aprofundado e sem pressa antes de mandar horários.</p>
                      <p className="text-slate-400">• <strong>"Achei caro":</strong> Reforce o tempo dedicado de consulta e o acompanhamento; <strong>nunca dê desconto de imediato</strong>.</p>
                      <p className="text-slate-400">• <strong>Continuou em silêncio:</strong> Não insista. Deixe o sistema executar a Etapa 2.</p>
                    </div>
                  </div>

                  {/* ETAPA 2: AUTOMÁTICA */}
                  <div className="bg-slate-950 border border-purple-800/50 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-purple-300 text-xs">Etapa 2: Desapego Positivo (+8 dias)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 shrink-0">
                        <Zap className="w-3 h-3" /> 100% AUTOMÁTICO
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      <strong>Não envie esta mensagem manualmente.</strong> Após 8 dias sem retorno, o sistema dispara automaticamente em horário comercial o encerramento elegante (<em>"...imaginei que tenha adiado a busca pela consulta por enquanto, e está tudo bem"</em>) e arquiva o contato.
                    </p>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5 text-[11px]">
                      <div className="font-semibold text-slate-200">O que fazer após o envio automático:</div>
                      <p className="text-slate-400">• <strong>Se o paciente responder ("Desculpe a correria, quero agendar"):</strong> O chat reabre sozinho no topo — acolha com carinho e agende.</p>
                      <p className="text-slate-400">• <strong>Se mantiver silêncio:</strong> Respeite o encerramento. Nunca envie disparos em massa para contatos arquivados.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* BLOCO 2.3: CHECKLIST DE OURO */}
              <section className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Resumo de Ouro do Atendimento
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>1.</strong> Aguarde a Marina concluir a triagem antes de falar.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>2.</strong> Revise o nome do paciente antes de enviar atalhos.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>3.</strong> Faça o Gancho Clínico (24h–48h) focado em dúvidas, nunca em preço.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>4.</strong> Deixe o Desapego Positivo (+8d) rodar no piloto automático.</span>
                  </div>
                </div>
              </section>

            </div>
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

import React, { useState, useEffect } from 'react';
import { 
  Search, Bot, CalendarCheck, Send, AlertCircle, Copy, Sparkles, RefreshCw
} from 'lucide-react';
import { supabase } from './supabase';

interface Message {
  id: string;
  contact_id: string;
  phone: string;
  sender: 'patient' | 'bot' | 'agent';
  text: string;
  created_at: string;
}

interface Contact {
  id: string;
  phone: string;
  name: string;
  status: 'with_ai' | 'waiting_agent' | 'in_progress' | 'scheduled';
  tag: string;
  last_message: string;
  triage_intent: string;
  triage_modality: string;
  triage_complaint: string;
  reimbursement_notice: boolean;
  internal_notes: string;
}

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'ai'>('all');
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (!error && data) {
      setContacts(data as Contact[]);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
        setNotes(data[0].internal_notes || '');
      }
    }
    setLoading(false);
  };

  const fetchMessages = async (contactId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }
  };

  useEffect(() => {
    fetchContacts();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new && (payload.new as Message).contact_id === selectedId) {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
          fetchContacts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        () => fetchContacts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
      const contact = contacts.find((c) => c.id === selectedId);
      if (contact) setNotes(contact.internal_notes || '');
    }
  }, [selectedId]);

  const currentContact = contacts.find((c) => c.id === selectedId);

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name?.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone?.includes(search) ||
      contact.tag?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'waiting') return contact.status === 'waiting_agent' || contact.status === 'in_progress';
    if (filter === 'ai') return contact.status === 'with_ai';
    return true;
  });

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentContact) return;

    const textToSend = inputText;
    setInputText('');

    await supabase.from('messages').insert({
      contact_id: currentContact.id,
      phone: currentContact.phone,
      sender: 'agent',
      text: textToSend,
    });

    await supabase.from('contacts').update({
      last_message: textToSend,
      status: 'in_progress',
      last_message_at: new Date().toISOString()
    }).eq('id', currentContact.id);

    fetchMessages(currentContact.id);
  };

  const toggleAiStatus = async () => {
    if (!currentContact) return;
    const newStatus = currentContact.status === 'with_ai' ? 'waiting_agent' : 'with_ai';
    
    await supabase.from('contacts').update({ status: newStatus }).eq('id', currentContact.id);
    setContacts(contacts.map(c => c.id === currentContact.id ? { ...c, status: newStatus } : c));
  };

  const markAsScheduled = async () => {
    if (!currentContact) return;
    await supabase.from('contacts').update({ status: 'scheduled' }).eq('id', currentContact.id);
    setContacts(contacts.map(c => c.id === currentContact.id ? { ...c, status: 'scheduled' } : c));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-800 antialiased overflow-hidden font-sans">
      
      {/* HEADER SUPERIOR */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
            CM
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100">Dr. Cristiano Miranda</h1>
            <p className="text-[11px] text-slate-400">Cardiologia Integrativa • Central de Atendimento</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Supabase Conectado
          </div>
          <div className="text-xs text-slate-400 border-l border-slate-800 pl-4 flex items-center gap-2">
            <span>Operador: <strong>Poliana</strong></span>
          </div>
        </div>
      </header>

      {/* ÁREA PRINCIPAL: 3 COLUNAS */}
      <div className="flex-1 flex overflow-hidden">

        {/* COLUNA 1: LISTA DE CONVERSAS */}
        <aside className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 bg-slate-50/60 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar paciente ou queixa..." 
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 transition"
              />
            </div>
            
            <div className="flex gap-1">
              <button 
                onClick={() => setFilter('waiting')} 
                className={filter === 'waiting' ? 'px-2.5 py-1 rounded-md text-[11px] font-semibold transition bg-emerald-600 text-white' : 'px-2.5 py-1 rounded-md text-[11px] font-semibold transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Atendimento Poliana ({contacts.filter(c => c.status === 'waiting_agent' || c.status === 'in_progress').length})
              </button>
              <button 
                onClick={() => setFilter('ai')} 
                className={filter === 'ai' ? 'px-2.5 py-1 rounded-md text-[11px] font-medium transition bg-purple-600 text-white' : 'px-2.5 py-1 rounded-md text-[11px] font-medium transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Com Marina ({contacts.filter(c => c.status === 'with_ai').length})
              </button>
              <button 
                onClick={() => setFilter('all')} 
                className={filter === 'all' ? 'px-2.5 py-1 rounded-md text-[11px] font-medium transition bg-slate-800 text-white' : 'px-2.5 py-1 rounded-md text-[11px] font-medium transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Todos
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" /> A carregar contactos...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Nenhum contacto encontrado.</div>
            ) : (
              filteredContacts.map(contact => (
                <div 
                  key={contact.id}
                  onClick={() => setSelectedId(contact.id)}
                  className={selectedId === contact.id ? 'p-3.5 cursor-pointer transition bg-emerald-50/60 border-l-4 border-emerald-600' : 'p-3.5 cursor-pointer transition hover:bg-slate-50'}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{contact.name}</span>
                    <span className="text-[10px] text-slate-400">{contact.phone}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-2">{contact.last_message || 'Sem mensagens'}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {contact.tag}
                    </span>
                    
                    {contact.status === 'waiting_agent' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        Aguardando Poliana
                      </span>
                    )}
                    {contact.status === 'in_progress' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Atendimento Poliana
                      </span>
                    )}
                    {contact.status === 'with_ai' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                        <Bot className="w-3 h-3" /> Marina Ativa
                      </span>
                    )}
                    {contact.status === 'scheduled' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        Agendado
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* COLUNA 2: ÁREA DE CHAT */}
        <section className="flex-1 bg-[#f0f2f5] flex flex-col border-r border-slate-200 relative">
          {currentContact ? (
            <>
              {/* BARRA SUPERIOR DO CHAT */}
              <div className="bg-white px-5 py-3 border-b border-slate-200 flex items-center justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">{currentContact.name}</h2>
                    <span className="text-xs text-slate-400">{currentContact.phone}</span>
                  </div>
                  <div className="text-[11px] font-medium mt-0.5">
                    {currentContact.status === 'waiting_agent' && (
                      <span className="text-amber-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Handoff Concluído • Aguardando Primeira Resposta
                      </span>
                    )}
                    {currentContact.status === 'in_progress' && (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Em Atendimento • Poliana Conectada
                      </span>
                    )}
                    {currentContact.status === 'with_ai' && (
                      <span className="text-purple-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span> Marina IA a responder automaticamente
                      </span>
                    )}
                    {currentContact.status === 'scheduled' && (
                      <span className="text-blue-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Paciente Agendado no Sistema
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleAiStatus}
                    className={currentContact.status === 'with_ai' ? 'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300' : 'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300'}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    {currentContact.status === 'with_ai' ? 'Pausar IA / Assumir' : 'Reativar Marina IA'}
                  </button>
                  
                  <button 
                    onClick={markAsScheduled}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" /> Marcar Agendado
                  </button>
                </div>
              </div>

              {/* HISTÓRICO DE MENSAGENS */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={msg.sender === 'patient' ? 'flex justify-start' : 'flex justify-end'}
                  >
                    <div className={
                      msg.sender === 'patient' 
                        ? 'max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-sm bg-white text-slate-800 rounded-tl-none border border-slate-100' 
                        : msg.sender === 'bot'
                        ? 'max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-sm bg-purple-50 border border-purple-200 text-slate-800 rounded-tr-none'
                        : 'max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-sm bg-emerald-600 text-white rounded-tr-none'
                    }>
                      {msg.sender === 'bot' && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1">
                          <Sparkles className="w-3 h-3" /> Marina (IA)
                        </div>
                      )}
                      {msg.sender === 'agent' && (
                        <div className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider mb-1">
                          Poliana (Secretária)
                        </div>
                      )}
                      <p>{msg.text}</p>
                      <span className={msg.sender === 'agent' ? 'block text-[10px] text-right mt-1 text-emerald-100' : 'block text-[10px] text-right mt-1 text-slate-400'}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* RESPOSTAS RÁPIDAS PADRONIZADAS */}
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Atalhos:</span>
                <button 
                  onClick={() => setInputText('Olá! Para adiantarmos com o Dr. Cristiano, qual o nome exato da medicação e a dosagem que você precisa renovar?')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[11px] text-slate-700 whitespace-nowrap transition"
                >
                  💊 Dados da Receita
                </button>
                <button 
                  onClick={() => setInputText('Para a consulta presencial na Savassi, temos horários abertos para quinta-feira às 14h ou sexta às 10h. Algum desses atende você?')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[11px] text-slate-700 whitespace-nowrap transition"
                >
                  📅 Horários Savassi
                </button>
                <button 
                  onClick={() => setInputText('O atendimento do Dr. Cristiano é estritamente particular. Emitimos o recibo detalhado para você solicitar o reembolso junto ao convênio.')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[11px] text-slate-700 whitespace-nowrap transition"
                >
                  📄 Regra de Reembolso
                </button>
              </div>

              {/* INPUT DE MENSAGEM */}
              <div className="bg-white p-3 border-t border-slate-200 flex items-center gap-2 shrink-0">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Digite a mensagem como Poliana..." 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-600 transition"
                />
                <button 
                  onClick={handleSendMessage}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Selecione um contacto para abrir o atendimento.
            </div>
          )}
        </section>

        {/* COLUNA 3: DOSSIÊ DE TRIAGEM (GEMINI) */}
        {currentContact && (
          <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Resumo do Gemini
              </h3>
              <p className="text-[11px] text-slate-400">Dados consolidados da triagem</p>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Motivo do Contato</label>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-medium text-slate-800">
                  {currentContact.triage_intent || 'Não informado'}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Modalidade Pretendida</label>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-medium text-slate-800">
                  {currentContact.triage_modality || 'A definir'}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Queixa / Observação</label>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 leading-relaxed">
                  {currentContact.triage_complaint || 'Sem queixa registrada'}
                </div>
              </div>

              {currentContact.reimbursement_notice && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[11px] flex gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Paciente informado sobre o recibo para reembolso particular.</span>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Anotações Internas (Poliana)</label>
                <textarea 
                  value={notes}
                  onChange={async (e) => {
                    setNotes(e.target.value);
                    await supabase.from('contacts').update({ internal_notes: e.target.value }).eq('id', currentContact.id);
                  }}
                  placeholder="Ex: Ficha física conferida..." 
                  className="w-full h-20 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 transition resize-none"
                />
              </div>

              <button 
                onClick={() => {
                  const text = `Paciente: ${currentContact.name}\nTelefone: ${currentContact.phone}\nMotivo: ${currentContact.triage_intent}\nQueixa: ${currentContact.triage_complaint}\nNotas: ${notes}`;
                  navigator.clipboard.writeText(text);
                  alert('Dossiê copiado com sucesso!');
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar para o Prontuário
              </button>
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Search, Bot, CalendarCheck, Send, AlertCircle, Copy, Sparkles, RefreshCw,
  Settings, Lock, KeyRound, Check, X, ShieldAlert, Clock, MessageSquareQuote, 
  Edit3, Download, FileSpreadsheet, LogOut, Mail
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
  cadence_stage?: 'recente' | 'followup_3d' | 'followup_7d' | 'inativo' | 'concluido';
  days_inactive?: number;
}

interface QuickReply {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  display_order: number;
}

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    id: '1',
    slug: 'gancho_clinico',
    title: 'Gancho Clínico (3-6d)',
    category: 'follow_up',
    content: 'Olá, {nome}! Aqui é a Poliana da equipe do Dr. Cristiano. Como conversamos há alguns dias sobre a sua consulta, queria verificar se ficou alguma dúvida sobre o atendimento ou se precisa de ajuda com relação aos horários.',
    display_order: 1
  },
  {
    id: '2',
    slug: 'desapego_positivo',
    title: 'Desapego Positivo (7-14d)',
    category: 'follow_up',
    content: 'Oi, {nome}! Imaginei que sua rotina estivesse corrida ou que tenha optado por adiar a consulta, e não tem problema nenhum. Vou encerrar seu atendimento por aqui para não incomodar. Se quiser retomar o cuidado em outro momento, é só nos chamar!',
    display_order: 2
  },
  {
    id: '3',
    slug: 'dados_receita',
    title: 'Dados da Receita',
    category: 'atendimento',
    content: 'Para que possamos emitir ou validar a sua receita/pedido médico, por favor confirme:\n- Nome completo:\n- CPF:\n- Data de nascimento:\n- Endereço completo com CEP:\n- Farmácia ou medicação necessária:',
    display_order: 3
  },
  {
    id: '4',
    slug: 'horarios_savassi',
    title: 'Horários Savassi',
    category: 'agendamento',
    content: 'O Dr. Cristiano realiza os atendimentos presenciais na Savassi (Belo Horizonte) às terças e quintas-feiras, com horários agendados para garantir uma avaliação aprofundada e sem pressa. Gostaria de verificar as opções disponíveis para esta semana ou para a próxima?',
    display_order: 4
  },
  {
    id: '5',
    slug: 'regra_reembolso',
    title: 'Regra de Reembolso',
    category: 'financeiro',
    content: 'O atendimento do Dr. Cristiano é exclusivamente particular, mas emitimos nota fiscal e relatório médico completo com todos os critérios exigidos pelas operadoras para que você solicite o reembolso diretamente ao seu plano de saúde. A maioria dos convênios oferece essa modalidade!',
    display_order: 5
  }
];

export default function App() {
  // Autenticação Geral do Supabase
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Estados Operacionais do Painel
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'in_progress' | 'ai'>('all');
  const [cadenceFilter, setCadenceFilter] = useState<'all' | 'followup_3d' | 'followup_7d' | 'inativo'>('all');
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados dos Modelos Rápidos
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(DEFAULT_QUICK_REPLIES);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isOperatorAuthenticated, setIsOperatorAuthenticated] = useState(false);
  const [operatorPasswordInput, setOperatorPasswordInput] = useState('');
  const [operatorPasswordError, setOperatorPasswordError] = useState('');
  const [editingReplies, setEditingReplies] = useState<QuickReply[]>(DEFAULT_QUICK_REPLIES);
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);
  const [templatesSaveSuccess, setTemplatesSaveSuccess] = useState(false);

  // Estados da Área de Administração Crítica (System Prompt & Exportação)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exportDays, setExportDays] = useState<'7' | '30' | 'all'>('7');
  const [isExporting, setIsExporting] = useState(false);

  // Monitora a Sessão Inicial do Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput.trim(),
      password: passwordInput,
    });

    if (error) {
      setLoginError(error.message === 'Invalid login credentials' 
        ? 'Email ou senha incorretos.' 
        : 'Erro ao autenticar: ' + error.message);
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('vw_contacts_cadence')
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

  const loadPromptSettings = async () => {
    const { data } = await supabase
      .from('clinic_settings')
      .select('value')
      .eq('key', 'system_prompt')
      .single();

    if (data) {
      setPromptText(data.value);
    }
  };

  const fetchQuickReplies = async () => {
    const { data, error } = await supabase
      .from('quick_replies')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      setQuickReplies(data as QuickReply[]);
      setEditingReplies(data as QuickReply[]);
    } else {
      setEditingReplies(DEFAULT_QUICK_REPLIES);
    }
  };

  useEffect(() => {
    if (!session) return;

    fetchContacts();
    fetchQuickReplies();

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quick_replies' },
        () => fetchQuickReplies()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, selectedId]);

  useEffect(() => {
    if (session && selectedId) {
      fetchMessages(selectedId);
      const contact = contacts.find((c) => c.id === selectedId);
      if (contact) setNotes(contact.internal_notes || '');
    }
  }, [session, selectedId]);

  const currentContact = contacts.find((c) => c.id === selectedId);

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name?.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone?.includes(search) ||
      contact.tag?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'waiting' && contact.status !== 'waiting_agent') return false;
    if (filter === 'in_progress' && contact.status !== 'in_progress') return false;
    if (filter === 'ai' && contact.status !== 'with_ai') return false;

    if (cadenceFilter !== 'all' && contact.cadence_stage !== cadenceFilter) return false;

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

  const handleInsertQuickReply = (content: string) => {
    if (!currentContact) return;
    const firstName = currentContact.name ? currentContact.name.split(' ')[0] : 'tudo bem';
    const parsed = content.replace(/{nome}/g, firstName);
    setInputText(parsed);
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPasswordError('');

    const { data } = await supabase
      .from('clinic_settings')
      .select('value')
      .eq('key', 'admin_password')
      .single();

    if (data && data.value === adminPasswordInput) {
      setIsAdminAuthenticated(true);
      setAdminPasswordInput('');
      await loadPromptSettings();
    } else {
      setAdminPasswordError('Senha de administrador incorreta.');
    }
  };

  const handleOperatorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setOperatorPasswordError('');

    const { data: settings } = await supabase
      .from('clinic_settings')
      .select('key, value')
      .in('key', ['operator_password', 'admin_password']);

    const validPasswords = settings?.map(s => s.value) || [];

    if (validPasswords.includes(operatorPasswordInput)) {
      setIsOperatorAuthenticated(true);
      setOperatorPasswordInput('');
    } else {
      setOperatorPasswordError('Senha incorreta. Tente novamente.');
    }
  };

  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    setSaveSuccess(false);

    await supabase
      .from('clinic_settings')
      .upsert({
        key: 'system_prompt',
        value: promptText,
        updated_at: new Date().toISOString()
      });

    setIsSavingPrompt(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveTemplates = async () => {
    setIsSavingTemplates(true);
    setTemplatesSaveSuccess(false);

    for (const item of editingReplies) {
      await supabase
        .from('quick_replies')
        .upsert({
          slug: item.slug,
          title: item.title,
          content: item.content,
          updated_at: new Date().toISOString()
        }, { onConflict: 'slug' });
    }

    await fetchQuickReplies();
    setIsSavingTemplates(false);
    setTemplatesSaveSuccess(true);
    setTimeout(() => setTemplatesSaveSuccess(false), 3000);
  };

  const handleExportSingleChat = () => {
    if (!currentContact || messages.length === 0) return;

    let content = `======================================================\n`;
    content += `HISTÓRICO DE ATENDIMENTO - DR. CRISTIANO MIRANDA\n`;
    content += `Paciente: ${currentContact.name} (${currentContact.phone})\n`;
    content += `Status Atual: ${currentContact.status} | Tag: ${currentContact.tag}\n`;
    content += `Motivo: ${currentContact.triage_intent || 'N/A'}\n`;
    content += `Modalidade: ${currentContact.triage_modality || 'N/A'}\n`;
    content += `Queixa: ${currentContact.triage_complaint || 'N/A'}\n`;
    content += `Data da Exportação: ${new Date().toLocaleString('pt-BR')}\n`;
    content += `======================================================\n\n`;

    messages.forEach((msg) => {
      const time = new Date(msg.created_at).toLocaleString('pt-BR');
      let senderLabel = '[PACIENTE]';
      if (msg.sender === 'bot') senderLabel = '[MARINA - IA]';
      if (msg.sender === 'agent') senderLabel = '[POLIANA - SECRETÁRIA]';

      content += `${time} - ${senderLabel}:\n${msg.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atendimento_${currentContact.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllMessagesCSV = async () => {
    setIsExporting(true);

    try {
      let query = supabase
        .from('messages')
        .select(`
          id,
          created_at,
          sender,
          text,
          phone,
          contacts (
            name,
            status,
            triage_intent,
            triage_modality
          )
        `)
        .order('created_at', { ascending: true });

      if (exportDays !== 'all') {
        const days = parseInt(exportDays, 10);
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        query = query.gte('created_at', dateLimit.toISOString());
      }

      const { data, error } = await query;

      if (error || !data) {
        alert('Erro ao exportar dados do Supabase.');
        setIsExporting(false);
        return;
      }

      const headers = ['Data_Hora', 'Paciente_Nome', 'Telefone', 'Status_Atual', 'Remetente', 'Motivo_Triagem', 'Modalidade', 'Mensagem'];
      
      const rows = data.map((item: any) => {
        const date = new Date(item.created_at).toLocaleString('pt-BR');
        const name = (item.contacts?.name || 'Não identificado').replace(/"/g, '""');
        const phone = item.phone || '';
        const status = item.contacts?.status || '';
        
        let senderRole = 'Paciente';
        if (item.sender === 'bot') senderRole = 'Marina (IA)';
        if (item.sender === 'agent') senderRole = 'Poliana (Secretária)';

        const intent = (item.contacts?.triage_intent || '').replace(/"/g, '""');
        const modality = (item.contacts?.triage_modality || '').replace(/"/g, '""');
        const messageText = (item.text || '').replace(/"/g, '""').replace(/\n/g, ' ');

        return `"${date}","${name}","${phone}","${status}","${senderRole}","${intent}","${modality}","${messageText}"`;
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_mensagens_${exportDays}d_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erro inesperado durante a geração do arquivo CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  // Carregamento de Inicialização
  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-500 mr-2" />
        Carregando painel de atendimento...
      </div>
    );
  }

  // TELA DE LOGIN DE ENTRADA (SE NÃO HOUVER SESSÃO ATIVA)
  if (!session) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold mx-auto text-base">
              CM
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Dr. Cristiano Miranda</h1>
              <p className="text-xs text-slate-400">Cardiologia Integrativa • Central de Atendimento</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input 
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="seu-email@clinica.com"
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input 
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {loginError && (
              <p className="text-rose-400 text-xs flex items-center gap-1.5 pt-1">
                <ShieldAlert className="w-4 h-4 shrink-0" /> {loginError}
              </p>
            )}

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Entrando...
                </>
              ) : (
                'Acessar Painel'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PAINEL COMPLETO (RENDERIZADO QUANDO AUTENTICADO)
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

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Supabase Conectado
          </div>
          <div className="text-xs text-slate-400 border-l border-slate-800 pl-3 flex items-center gap-2">
            <span>Operador: <strong>{session.user?.email || 'Poliana'}</strong></span>
          </div>

          {/* BOTÃO DE ACESSO CRÍTICO: INSTRUÇÕES IA & EXPORTAÇÃO */}
          <button 
            onClick={() => {
              setIsSettingsOpen(true);
              if (isAdminAuthenticated) loadPromptSettings();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs border border-slate-700"
            title="Instruções da IA & Relatórios de Mensagens"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Instruções IA</span>
          </button>

          {/* BOTÃO DE LOGOUT */}
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 transition flex items-center gap-1 text-xs border border-rose-800/50"
            title="Encerrar Sessão / Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sair</span>
          </button>
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
            
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              <button 
                onClick={() => setFilter('waiting')} 
                className={filter === 'waiting' ? 'px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition bg-amber-600 text-white' : 'px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Aguardando ({contacts.filter(c => c.status === 'waiting_agent').length})
              </button>
              <button 
                onClick={() => setFilter('in_progress')} 
                className={filter === 'in_progress' ? 'px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition bg-emerald-600 text-white' : 'px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Atendimento ({contacts.filter(c => c.status === 'in_progress').length})
              </button>
              <button 
                onClick={() => setFilter('ai')} 
                className={filter === 'ai' ? 'px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition bg-purple-600 text-white' : 'px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Marina ({contacts.filter(c => c.status === 'with_ai').length})
              </button>
              <button 
                onClick={() => setFilter('all')} 
                className={filter === 'all' ? 'px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition bg-slate-800 text-white' : 'px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Todos
              </button>
            </div>

            <div className="flex items-center gap-1 pt-1 border-t border-slate-200/60 overflow-x-auto">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> Fila:
              </span>
              <button
                onClick={() => setCadenceFilter('all')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition whitespace-nowrap ${
                  cadenceFilter === 'all' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setCadenceFilter('followup_3d')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition whitespace-nowrap ${
                  cadenceFilter === 'followup_3d' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-500 hover:bg-blue-50'
                }`}
              >
                Follow-up (3-6d)
              </button>
              <button
                onClick={() => setCadenceFilter('followup_7d')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition whitespace-nowrap ${
                  cadenceFilter === 'followup_7d' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-500 hover:bg-amber-50'
                }`}
              >
                Fechamento (7-14d)
              </button>
              <button
                onClick={() => setCadenceFilter('inativo')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition whitespace-nowrap ${
                  cadenceFilter === 'inativo' ? 'bg-slate-500 text-white font-semibold' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Inativos (+15d)
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

                    {contact.days_inactive !== undefined && contact.days_inactive >= 3 && contact.status !== 'scheduled' && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium inline-flex items-center gap-1 border ${
                        contact.days_inactive >= 15
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : contact.days_inactive >= 7
                            ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        🕒 {contact.days_inactive}d sem resposta
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
              <div className="bg-white px-5 py-3 border-b border-slate-200 flex items-center justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">{currentContact.name}</h2>
                    <span className="text-xs text-slate-400">{currentContact.phone}</span>
                    {currentContact.days_inactive !== undefined && currentContact.days_inactive >= 3 && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                        Sem resposta há {currentContact.days_inactive} dias
                      </span>
                    )}
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
                    onClick={handleExportSingleChat}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center gap-1 text-xs border border-slate-200"
                    title="Baixar Histórico Desta Conversa (.txt)"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden lg:inline text-[11px]">Exportar Chat</span>
                  </button>

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
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className={msg.sender === 'agent' ? 'block text-[10px] text-right mt-1 text-emerald-100' : 'block text-[10px] text-right mt-1 text-slate-400'}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ATALHOS RÁPIDOS DINÂMICOS */}
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <MessageSquareQuote className="w-3 h-3 text-emerald-600" /> Atalhos:
                </span>
                
                {quickReplies.map((qr) => (
                  <button 
                    key={qr.slug}
                    onClick={() => handleInsertQuickReply(qr.content)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-full text-[11px] text-slate-700 hover:text-emerald-800 whitespace-nowrap transition font-medium shadow-2xs"
                  >
                    {qr.title}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setEditingReplies(quickReplies);
                    setIsTemplatesModalOpen(true);
                  }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition ml-auto shrink-0"
                  title="Editar Modelos de Mensagens (Acesso da Operadora)"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* ENVIAR MENSAGEM */}
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

        {/* COLUNA 3: DOSSIÊ DE TRIAGEM */}
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

      {/* MODAL 1: EDIÇÃO DOS MODELOS DE RESPOSTAS RÁPIDAS (OPERADOR) */}
      {isTemplatesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <MessageSquareQuote className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Editar Modelos de Mensagens</h2>
                  <p className="text-[11px] text-slate-400">Acesso da Equipe de Atendimento</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsTemplatesModalOpen(false);
                  setOperatorPasswordInput('');
                  setOperatorPasswordError('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {!isOperatorAuthenticated ? (
                <form onSubmit={handleOperatorLogin} className="space-y-4 max-w-sm mx-auto py-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-slate-100">Área de Atendimento</h3>
                    <p className="text-xs text-slate-400 mt-1">Introduza a senha de operador para editar os modelos rápidos.</p>
                  </div>

                  <div>
                    <input 
                      type="password"
                      value={operatorPasswordInput}
                      onChange={e => setOperatorPasswordInput(e.target.value)}
                      placeholder="Senha do operador..."
                      autoFocus
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {operatorPasswordError && (
                      <p className="text-rose-400 text-[11px] mt-1.5 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> {operatorPasswordError}
                      </p>
                    )}
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Desbloquear Modelos
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                    💡 Dica: Use a tag <strong>{'{nome}'}</strong> no texto para inserir automaticamente o primeiro nome do paciente.
                  </p>

                  <div className="space-y-4">
                    {editingReplies.map((item, index) => (
                      <div key={item.slug} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const updated = [...editingReplies];
                              updated[index].title = e.target.value;
                              setEditingReplies(updated);
                            }}
                            className="bg-transparent font-semibold text-xs text-emerald-400 border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none px-1"
                          />
                          <span className="text-[10px] text-slate-500 font-mono">slug: {item.slug}</span>
                        </div>
                        <textarea
                          rows={3}
                          value={item.content}
                          onChange={(e) => {
                            const updated = [...editingReplies];
                            updated[index].content = e.target.value;
                            setEditingReplies(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500 resize-none font-sans"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      {templatesSaveSuccess && (
                        <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Modelos atualizados com sucesso no Supabase!
                        </span>
                      )}
                    </div>

                    <button 
                      onClick={handleSaveTemplates}
                      disabled={isSavingTemplates}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      {isSavingTemplates ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Salvando...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> Salvar Todos os Modelos
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: INSTRUÇÕES CRÍTICAS DA IA & EXPORTAÇÃO GERAL (ADMINISTRADOR) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Administração da Marina & Auditoria</h2>
                  <p className="text-[11px] text-slate-400">Acesso Estritamente Restrito ao Administrador</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsSettingsOpen(false);
                  setAdminPasswordInput('');
                  setAdminPasswordError('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {!isAdminAuthenticated ? (
                <form onSubmit={handleAdminLogin} className="space-y-4 max-w-sm mx-auto py-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-purple-400">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-slate-100">Área Administrativa Mestre</h3>
                    <p className="text-xs text-slate-400 mt-1">Exclusivo para o responsável técnico. Altera diretamente o comportamento da IA e exporta relatórios.</p>
                  </div>

                  <div>
                    <input 
                      type="password"
                      value={adminPasswordInput}
                      onChange={e => setAdminPasswordInput(e.target.value)}
                      placeholder="Senha do administrador mestre..."
                      autoFocus
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    {adminPasswordError && (
                      <p className="text-rose-400 text-[11px] mt-1.5 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> {adminPasswordError}
                      </p>
                    )}
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Desbloquear Painel Mestre
                  </button>
                </form>
              ) : (
                <div className="space-y-5">
                  
                  {/* SEÇÃO 1: SYSTEM INSTRUCTIONS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" /> System Instructions da Marina
                      </label>
                      <span className="text-[11px] text-slate-400">Atualização em tempo real</span>
                    </div>

                    <textarea 
                      value={promptText}
                      onChange={e => setPromptText(e.target.value)}
                      rows={10}
                      placeholder="Escreva aqui as instruções de atendimento..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-purple-500 resize-none"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-slate-400">
                        {saveSuccess && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Instruções salvas com sucesso no banco!
                          </span>
                        )}
                      </div>

                      <button 
                        onClick={handleSavePrompt}
                        disabled={isSavingPrompt}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-4 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5"
                      >
                        {isSavingPrompt ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> A guardar...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" /> Salvar Instruções
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* SEÇÃO 2: EXPORTAÇÃO DE DADOS PARA AUDITORIA (CSV) */}
                  <div className="border-t border-slate-800 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Exportação Consolidada de Atendimentos
                        </h4>
                        <p className="text-[11px] text-slate-400">Baixe um arquivo CSV com as mensagens, remetentes e triagens para análise externa.</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Período:</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setExportDays('7')}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                              exportDays === '7' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            7 dias
                          </button>
                          <button
                            type="button"
                            onClick={() => setExportDays('30')}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                              exportDays === '30' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            30 dias
                          </button>
                          <button
                            type="button"
                            onClick={() => setExportDays('all')}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                              exportDays === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            Tudo
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleExportAllMessagesCSV}
                        disabled={isExporting}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0"
                      >
                        {isExporting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gerando CSV...
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" /> Baixar Planilha CSV
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { 
  Search, Bot, CalendarCheck, CalendarX, Send, AlertCircle, Copy, Sparkles, RefreshCw,
  Settings, Lock, KeyRound, Check, X, ShieldAlert, Clock, MessageSquareQuote, 
  Edit3, Download, FileSpreadsheet, LogOut, Mail, Volume2, VolumeX, Archive, HelpCircle,
  Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Paperclip, FileText, ExternalLink
} from 'lucide-react';
import { supabase } from './supabase';

const HelpModal = lazy(() => import('./HelpModal'));

interface Message {
  id: string;
  contact_id: string;
  phone: string;
  sender: string;
  text: string;
  created_at: string;
}

interface Contact {
  id: string;
  phone: string;
  name: string;
  status: 'with_ai' | 'waiting_agent' | 'in_progress' | 'scheduled' | 'archived';
  tag: string;
  last_message: string;
  triage_intent: string;
  triage_modality: string;
  triage_complaint: string;
  reimbursement_notice: boolean;
  internal_notes: string;
  cadence_stage?: 'recente' | 'gancho_24h' | 'arquivado' | 'concluido';
  hours_inactive?: number;
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

const PILL_COLOR_OPTIONS = [
  {
    key: 'follow_up',
    label: 'Azul (Follow-up)',
    dotClass: 'bg-blue-500',
    pillClass: 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 text-blue-800'
  },
  {
    key: 'atendimento',
    label: 'Verde (Cadastro / Clínico)',
    dotClass: 'bg-emerald-500',
    pillClass: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300 text-emerald-800'
  },
  {
    key: 'financeiro',
    label: 'Âmbar (Financeiro)',
    dotClass: 'bg-amber-500',
    pillClass: 'bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300 text-amber-800'
  },
  {
    key: 'agendamento',
    label: 'Roxo (Agenda)',
    dotClass: 'bg-purple-500',
    pillClass: 'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-300 text-purple-800'
  }
];

function getPillColorClass(category?: string): string {
  const found = PILL_COLOR_OPTIONS.find((opt) => opt.key === category);
  return found
    ? found.pillClass
    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300 text-emerald-800';
}

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    id: '1',
    slug: 'gancho_clinico',
    title: 'Gancho Clínico (24h-48h)',
    category: 'follow_up',
    content: 'Oi, {nome}, tudo bem? Poliana por aqui. O Dr. Cristiano me pediu para verificar se você conseguiu tirar todas as suas dúvidas sobre a consulta integrativa ou se ficou alguma questão sobre o formato do atendimento. Se preferir, estou à disposição!',
    display_order: 1
  },
  {
    id: '2',
    slug: 'pec_gancho_clinico',
    title: 'PEC Gancho Clínico (24h-48h)',
    category: 'follow_up',
    content: 'Oi, {nome}, tudo bem? Poliana por aqui. O Dr. Cristiano me pediu para verificar se você conseguiu tirar todas as suas dúvidas sobre o Programa de Emagrecimento Consciente ou se ficou alguma questão sobre o formato do atendimento. Se preferir, estou à disposição!',
    display_order: 2
  },
  {
    id: '3',
    slug: 'formas_pagamento',
    title: 'Formas de Pagamento',
    category: 'financeiro',
    content: 'Olá, {nome}! Sobre as formas de pagamento, aceitamos *Pix* ou *cartão de crédito em até 3x* (sem juros).\n\nAssim que definirmos o melhor dia e horário para você, eu te envio o link de pagamento ou a chave Pix para confirmarmos o seu agendamento.',
    display_order: 3
  },
  {
    id: '4',
    slug: 'como_funciona_exames',
    title: 'Como Funciona (Exames)',
    category: 'atendimento',
    content: '{nome}, como a consulta do Dr. Cristiano é bastante aprofundada, é fundamental que você já leve seus exames iniciais prontos para analisarmos tudo juntos no dia.\n\nFunciona assim:\n1️⃣ *Cadastro e Horário:* Você me envia seus dados e escolhemos o melhor dia na agenda.\n2️⃣ *Confirmação:* Você realiza o pagamento da consulta para reservar o seu horário.\n3️⃣ *Guia de Exames:* Assim que o horário estiver confirmado, já te envio o pedido médico do Dr. Cristiano para você fazer os exames pelo seu convênio ou laboratório de preferência antes da consulta.',
    display_order: 4
  },
  {
    id: '5',
    slug: 'dados_cadastro',
    title: 'Dados para Cadastro',
    category: 'atendimento',
    content: 'Para eu gerar seu prontuário e preparar a reserva do horário, por favor me envie os dados abaixo:\n\n*Nome completo:*\n*CPF:*\n*Data de nascimento:*\n*E-mail:*\n*CEP:*\n*Endereço completo (com número):*',
    display_order: 5
  },
  {
    id: '6',
    slug: 'dados_receita',
    title: 'Dados da Receita',
    category: 'atendimento',
    content: 'Para que possamos emitir ou validar a sua receita/pedido médico, por favor confirme:\n- Nome completo:\n- CPF:\n- Data de nascimento:\n- Endereço completo com CEP:\n- Farmácia ou medicação necessária:',
    display_order: 6
  },
  {
    id: '7',
    slug: 'horarios_savassi',
    title: 'Horários Savassi',
    category: 'agendamento',
    content: 'O Dr. Cristiano realiza os atendimentos presenciais na Savassi (Belo Horizonte) às terças e quintas-feiras, com horários agendados para garantir uma avaliação aprofundada e sem pressa. Gostaria de verificar as opções disponíveis para esta semana ou para a próxima?',
    display_order: 7
  },
  {
    id: '8',
    slug: 'regra_reembolso',
    title: 'Regra de Reembolso',
    category: 'financeiro',
    content: 'O atendimento do Dr. Cristiano é exclusivamente particular, mas emitimos nota fiscal e relatório médico completo com todos os critérios exigidos pelas operadoras para que você solicite o reembolso diretamente ao seu plano de saúde. A maioria dos convênios oferece essa modalidade!',
    display_order: 8
  }
];

function getSenderRole(sender?: string): 'patient' | 'bot' | 'agent' {
  const normalized = (sender || '').toLowerCase().trim();
  if (['bot', 'ai', 'assistant', 'marina', 'ia'].includes(normalized)) {
    return 'bot';
  }
  if (['agent', 'poliana', 'human', 'attendant', 'secretaria'].includes(normalized)) {
    return 'agent';
  }
  return 'patient';
}

function formatMediaPreviewText(rawText?: string): string {
  if (!rawText) return 'Sem mensagens';
  const imgMatch = rawText.match(/^\[MEDIA:image\|[^\]]+\]\s*(.*)$/s);
  if (imgMatch) {
    return imgMatch[1] ? `📷 ${imgMatch[1]}` : '📷 Imagem';
  }
  if (/^\[MEDIA:audio\|[^\]]+\]/.test(rawText)) {
    return '🎤 Mensagem de áudio';
  }
  const docMatch = rawText.match(/^\[MEDIA:document\|([^|\]]+)\|[^\]]+\]\s*(.*)$/s);
  if (docMatch) {
    return docMatch[2] ? `📄 ${docMatch[1]} - ${docMatch[2]}` : `📄 ${docMatch[1]}`;
  }
  return rawText;
}

async function triggerDirectFileDownload(url: string, suggestedName: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = suggestedName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function MessageContent({
  msg,
  isAgent,
  onDeleteMedia
}: {
  msg: Message;
  isAgent: boolean;
  onDeleteMedia: (msg: Message) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;
    if (!window.confirm('Deseja excluir esta mídia permanentemente do armazenamento da clínica?')) return;
    setDeleting(true);
    try {
      await onDeleteMedia(msg);
    } finally {
      setDeleting(false);
    }
  };

  const imgMatch = msg.text.match(/^\[MEDIA:image\|([^\]]+)\]\s*(.*)$/s);
  if (imgMatch) {
    const [, url, caption] = imgMatch;
    const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `imagem_${msg.id.slice(0, 6)}.${ext}`;

    return (
      <div className="space-y-1.5">
        <div className="relative group rounded-xl overflow-hidden border border-black/10 bg-black/5">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            title="Clique para abrir a imagem em tamanho real"
          >
            <img
              src={url}
              alt="Mídia enviada"
              className="max-h-64 w-auto max-w-full object-contain rounded-xl transition group-hover:opacity-95"
              loading="lazy"
            />
          </a>

          {/* Barra discreta de ações (Salvar / Abrir / Excluir) */}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-85 group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                triggerDirectFileDownload(url, fileName);
              }}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white shadow-sm transition"
              title="Salvar imagem no computador"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white shadow-sm transition"
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleting}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-600 text-white shadow-sm transition disabled:opacity-50"
              title="Excluir imagem para liberar espaço"
            >
              {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        {caption && <p className="whitespace-pre-wrap">{caption}</p>}
      </div>
    );
  }

  const audMatch = msg.text.match(/^\[MEDIA:audio\|([^\]]+)\]\s*(.*)$/s);
  if (audMatch) {
    const [, url] = audMatch;
    const ext = url.split('.').pop()?.split('?')[0] || 'ogg';
    const fileName = `audio_${msg.id.slice(0, 6)}.${ext}`;

    return (
      <div className="flex items-center gap-2 min-w-[230px]">
        <audio
          controls
          preload="metadata"
          src={url}
          className="h-9 max-w-[210px] rounded-lg"
        />
        <button
          type="button"
          onClick={() => triggerDirectFileDownload(url, fileName)}
          className={`p-1.5 rounded-lg transition shrink-0 ${
            isAgent
              ? 'hover:bg-emerald-700 text-emerald-100 hover:text-white'
              : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
          }`}
          title="Salvar áudio no computador"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={deleting}
          className={`p-1.5 rounded-lg transition shrink-0 disabled:opacity-50 ${
            isAgent
              ? 'hover:bg-rose-600 text-emerald-100 hover:text-white'
              : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
          }`}
          title="Excluir áudio para liberar espaço"
        >
          {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  const docMatch = msg.text.match(/^\[MEDIA:document\|([^|\]]+)\|([^\]]+)\]\s*(.*)$/s);
  if (docMatch) {
    const [, fileName, url, caption] = docMatch;
    return (
      <div className="space-y-1.5">
        <div
          className={`flex items-center gap-2 p-2.5 rounded-xl border transition ${
            isAgent
              ? 'bg-emerald-700/60 border-emerald-400/40 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 min-w-0 flex-1 group"
            title="Clique para visualizar o documento"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isAgent ? 'bg-emerald-500/30 text-white' : 'bg-rose-100 text-rose-600'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate group-hover:underline">{fileName}</p>
              <p className={`text-[10px] ${isAgent ? 'text-emerald-200' : 'text-slate-400'}`}>
                Documento anexado
              </p>
            </div>
          </a>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => triggerDirectFileDownload(url, fileName)}
              className={`p-1.5 rounded-lg transition ${
                isAgent
                  ? 'hover:bg-emerald-600 text-emerald-100 hover:text-white'
                  : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
              }`}
              title="Salvar arquivo no computador"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleting}
              className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
                isAgent
                  ? 'hover:bg-rose-600 text-emerald-100 hover:text-white'
                  : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
              }`}
              title="Excluir arquivo para liberar espaço"
            >
              {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        {caption && <p className="whitespace-pre-wrap">{caption}</p>}
      </div>
    );
  }

  return <p className="whitespace-pre-wrap">{msg.text}</p>;
}

function playSubtleNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playTone(880, now, 0.25);
    playTone(1108.73, now + 0.14, 0.35);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 800);
  } catch (err) {
    console.warn('Áudio bloqueado pelo navegador até a primeira interação:', err);
  }
}

export default function App() {
  // Autenticação Geral do Supabase
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Controle de Alerta Sonoro
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const soundEnabledRef = useRef<boolean>(true);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Controle do Modal de Ajuda (Guia Rápido)
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Estados Operacionais do Painel
  const [contacts, setContacts] = useState<Contact[]>([]);
  const contactsRef = useRef<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const selectedIdRef = useRef<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'in_progress' | 'ai' | 'scheduled'>('all');
  const [cadenceFilter, setCadenceFilter] = useState<'all' | 'gancho_24h' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para Anexo de Mídia (Imagem / PDF)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  // Referência para rolagem automática do chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados dos Modelos Rápidos
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(DEFAULT_QUICK_REPLIES);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isOperatorAuthenticated, setIsOperatorAuthenticated] = useState(false);
  const [operatorPasswordInput, setOperatorPasswordInput] = useState('');
  const [operatorPasswordError, setOperatorPasswordError] = useState('');
  const [editingReplies, setEditingReplies] = useState<QuickReply[]>(DEFAULT_QUICK_REPLIES);
  const [deletedSlugs, setDeletedSlugs] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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

  // Rolagem automática para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const fetchMessages = async (contactId: string, contactPhone?: string) => {
    if (!contactId && !contactPhone) return;

    const targetContact = contactsRef.current.find((c) => c.id === contactId);
    const phoneToSearch = contactPhone || targetContact?.phone;

    if (contactId) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setMessages(data as Message[]);
        return;
      }
    }

    if (phoneToSearch) {
      const cleanDigits = phoneToSearch.replace(/\D/g, '').slice(-8);
      const { data: byPhone, error: phoneErr } = await supabase
        .from('messages')
        .select('*')
        .ilike('phone', `%${cleanDigits}`)
        .order('created_at', { ascending: true });

      if (!phoneErr && byPhone) {
        setMessages(byPhone as Message[]);
      }
    }
  };

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('vw_contacts_cadence')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (!error && data) {
      const typedData = data as Contact[];
      setContacts(typedData);
      contactsRef.current = typedData;

      if (typedData.length > 0) {
        const activeId = selectedIdRef.current;
        const activeContact = typedData.find((c) => c.id === activeId);

        if (!activeId || !activeContact) {
          const firstActive = typedData.find((c) => c.status !== 'archived') || typedData[0];
          setSelectedId(firstActive.id);
          selectedIdRef.current = firstActive.id;
          setNotes(firstActive.internal_notes || '');
          await fetchMessages(firstActive.id, firstActive.phone);
          setTimeout(() => fetchMessages(firstActive.id, firstActive.phone), 800);
        } else {
          await fetchMessages(activeContact.id, activeContact.phone);
        }
      } else {
        setSelectedId('');
        selectedIdRef.current = '';
        setMessages([]);
      }
    }
    setLoading(false);
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
      const dbReplies = data as QuickReply[];
      const existingSlugs = new Set(dbReplies.map((r) => r.slug));
      const missingDefaults = DEFAULT_QUICK_REPLIES.filter((d) => !existingSlugs.has(d.slug));
      const merged = [...dbReplies, ...missingDefaults].sort(
        (a, b) => (a.display_order || 99) - (b.display_order || 99)
      );
      setQuickReplies(merged);
      setEditingReplies(merged);
    } else {
      setQuickReplies(DEFAULT_QUICK_REPLIES);
      setEditingReplies(DEFAULT_QUICK_REPLIES);
    }
  };

  useEffect(() => {
    if (!session) return;

    fetchContacts();
    fetchQuickReplies();

    const channel = supabase
      .channel('realtime-clinic-crm')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          const role = getSenderRole(newMsg.sender);

          if (role === 'patient' && soundEnabledRef.current) {
            playSubtleNotificationChime();
          }

          const currentObj = contactsRef.current.find((c) => c.id === selectedIdRef.current);
          const samePhone =
            currentObj &&
            newMsg.phone &&
            currentObj.phone.replace(/\D/g, '').slice(-8) === newMsg.phone.replace(/\D/g, '').slice(-8);

          if (newMsg.contact_id === selectedIdRef.current || samePhone) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }

          fetchContacts();

          setTimeout(() => {
            if (selectedIdRef.current) {
              fetchMessages(selectedIdRef.current);
            }
          }, 800);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? { ...m, text: updatedMsg.text } : m))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        () => {
          fetchContacts();
          setTimeout(() => {
            if (selectedIdRef.current) {
              fetchMessages(selectedIdRef.current);
            }
          }, 800);
        }
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
  }, [session]);

  useEffect(() => {
    if (session && selectedId) {
      const contact = contactsRef.current.find((c) => c.id === selectedId);
      fetchMessages(selectedId, contact?.phone);
      if (contact) setNotes(contact.internal_notes || '');
      clearAttachment();
    }
  }, [session, selectedId]);

  const currentContact = contacts.find((c) => c.id === selectedId);

  const filteredContacts = contacts.filter((contact) => {
    const isSearching = search.trim().length > 0;
    const matchesSearch =
      contact.name?.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone?.includes(search) ||
      contact.tag?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (cadenceFilter === 'archived') {
      return contact.status === 'archived' || contact.cadence_stage === 'arquivado';
    }

    if (!isSearching && contact.status === 'archived') {
      return false;
    }

    if (filter === 'waiting' && contact.status !== 'waiting_agent') return false;
    if (filter === 'in_progress' && contact.status !== 'in_progress') return false;
    if (filter === 'ai' && contact.status !== 'with_ai') return false;
    if (filter === 'scheduled' && contact.status !== 'scheduled') return false;

    if (cadenceFilter === 'gancho_24h' && contact.cadence_stage !== 'gancho_24h') return false;

    return true;
  });

  const handleAttachFile = (file: File) => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }
  };

  const clearAttachment = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasteInTextarea = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const namedFile = new File([file], `print_${Date.now()}.png`, { type: file.type });
          handleAttachFile(namedFile);
          break;
        }
      }
    }
  };

  const handleDeleteMediaMessage = async (msg: Message) => {
    const imgMatch = msg.text.match(/^\[MEDIA:image\|([^\]]+)\]\s*(.*)$/s);
    const audMatch = msg.text.match(/^\[MEDIA:audio\|([^\]]+)\]\s*(.*)$/s);
    const docMatch = msg.text.match(/^\[MEDIA:document\|[^|\]]+\|([^\]]+)\]\s*(.*)$/s);
    const mediaUrl = imgMatch ? imgMatch[1] : audMatch ? audMatch[1] : docMatch ? docMatch[1] : null;
    const caption = imgMatch ? imgMatch[2] : audMatch ? audMatch[2] : docMatch ? docMatch[2] : '';

    if (mediaUrl && mediaUrl.includes('/chat-media/')) {
      const storagePath = decodeURIComponent(mediaUrl.split('/chat-media/')[1].split('?')[0]);
      const { error: storageErr } = await supabase.storage.from('chat-media').remove([storagePath]);
      if (storageErr) {
        alert('Aviso ao remover arquivo do Storage: ' + storageErr.message);
      }
    }

    const updatedText = `[Mídia removida pelo atendente]${caption ? ' ' + caption : ''}`;
    await supabase.from('messages').update({ text: updatedText }).eq('id', msg.id);

    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, text: updatedText } : m)));
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedFile) || !currentContact || isUploadingMedia) return;

    const captionText = inputText.trim();
    const fileToSend = selectedFile;

    setInputText('');
    clearAttachment();

    let finalMessageText = captionText;

    if (fileToSend) {
      setIsUploadingMedia(true);
      try {
        const cleanPhone = currentContact.phone.replace(/\D/g, '') || 'geral';
        const ext = fileToSend.name.includes('.')
          ? fileToSend.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '')
          : fileToSend.type.startsWith('image/')
          ? 'png'
          : 'pdf';
        const storagePath = `${cleanPhone}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from('chat-media')
          .upload(storagePath, fileToSend, {
            contentType: fileToSend.type || 'application/octet-stream',
            upsert: false
          });

        if (uploadErr) {
          alert('Erro ao enviar arquivo: ' + uploadErr.message);
          setIsUploadingMedia(false);
          return;
        }

        const { data: pub } = supabase.storage.from('chat-media').getPublicUrl(storagePath);
        const publicUrl = pub?.publicUrl;

        if (!publicUrl) {
          alert('Não foi possível obter a URL pública do arquivo.');
          setIsUploadingMedia(false);
          return;
        }

        if (fileToSend.type.startsWith('image/')) {
          finalMessageText = `[MEDIA:image|${publicUrl}]${captionText ? ' ' + captionText : ''}`;
        } else {
          const safeName = fileToSend.name.replace(/[|\[\]]/g, '_');
          finalMessageText = `[MEDIA:document|${safeName}|${publicUrl}]${captionText ? ' ' + captionText : ''}`;
        }
      } catch (err: any) {
        alert('Falha no upload do arquivo: ' + (err?.message || 'Erro desconhecido'));
        setIsUploadingMedia(false);
        return;
      } finally {
        setIsUploadingMedia(false);
      }
    }

    await supabase.from('messages').insert({
      contact_id: currentContact.id,
      phone: currentContact.phone,
      sender: 'agent',
      text: finalMessageText,
    });

    await supabase.from('contacts').update({
      last_message: formatMediaPreviewText(finalMessageText),
      status: 'in_progress',
      last_message_at: new Date().toISOString()
    }).eq('id', currentContact.id);

    fetchMessages(currentContact.id, currentContact.phone);
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

  const toggleScheduledStatus = async () => {
    if (!currentContact) return;
    const isCurrentlyScheduled = currentContact.status === 'scheduled';

    if (isCurrentlyScheduled) {
      await supabase
        .from('contacts')
        .update({
          status: 'in_progress',
          last_message_at: new Date().toISOString(),
          desapego_sent_at: null
        })
        .eq('id', currentContact.id);

      setContacts(contacts.map(c => c.id === currentContact.id ? { ...c, status: 'in_progress' } : c));
    } else {
      await supabase
        .from('contacts')
        .update({ status: 'scheduled' })
        .eq('id', currentContact.id);

      setContacts(contacts.map(c => c.id === currentContact.id ? { ...c, status: 'scheduled' } : c));
    }
  };

  const markAsArchived = async () => {
    if (!currentContact) return;
    await supabase.from('contacts').update({ status: 'archived' }).eq('id', currentContact.id);
    setContacts(contacts.map(c => c.id === currentContact.id ? { ...c, status: 'archived' } : c));
  };

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState) {
      playSubtleNotificationChime();
    }
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

  const handleAddTemplate = () => {
    const nextOrder = editingReplies.length + 1;
    const uniqueSlug = `atalho_${Date.now()}`;
    setEditingReplies([
      ...editingReplies,
      {
        id: uniqueSlug,
        slug: uniqueSlug,
        title: `Novo Atalho ${nextOrder}`,
        category: 'atendimento',
        content: 'Olá, {nome}! ',
        display_order: nextOrder
      }
    ]);
  };

  const handleRemoveTemplate = (index: number) => {
    const item = editingReplies[index];
    if (item?.slug) {
      setDeletedSlugs((prev) => [...prev, item.slug]);
    }
    setEditingReplies(editingReplies.filter((_, i) => i !== index));
  };

  const moveTemplate = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= editingReplies.length || fromIndex === toIndex) return;
    const updated = [...editingReplies];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    setEditingReplies(updated);
  };

  const handleSaveTemplates = async () => {
    setIsSavingTemplates(true);
    setTemplatesSaveSuccess(false);

    if (deletedSlugs.length > 0) {
      await supabase
        .from('quick_replies')
        .delete()
        .in('slug', deletedSlugs);
      setDeletedSlugs([]);
    }

    for (let i = 0; i < editingReplies.length; i++) {
      const item = editingReplies[i];
      await supabase
        .from('quick_replies')
        .upsert({
          slug: item.slug,
          title: item.title,
          content: item.content,
          category: item.category || 'atendimento',
          display_order: i + 1,
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
      const role = getSenderRole(msg.sender);
      
      let senderLabel = '[PACIENTE]';
      if (role === 'bot') senderLabel = '[MARINA - IA]';
      if (role === 'agent') senderLabel = '[POLIANA - SECRETÁRIA]';

      content += `${time} - ${senderLabel}:\n${formatMediaPreviewText(msg.text)}\n\n`;
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
        const role = getSenderRole(item.sender);
        
        let senderRole = 'Paciente';
        if (role === 'bot') senderRole = 'Marina (IA)';
        if (role === 'agent') senderRole = 'Poliana (Secretária)';

        const intent = (item.contacts?.triage_intent || '').replace(/"/g, '""');
        const modality = (item.contacts?.triage_modality || '').replace(/"/g, '""');
        const messageText = formatMediaPreviewText(item.text || '').replace(/"/g, '""').replace(/\n/g, ' ');

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

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-500 mr-2" />
        Carregando painel de atendimento...
      </div>
    );
  }

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

          <button
            onClick={handleToggleSound}
            className={`p-1.5 rounded-lg transition flex items-center gap-1.5 text-xs border ${
              soundEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                : 'bg-slate-800/50 hover:bg-slate-800 text-slate-500 border-slate-800'
            }`}
            title={soundEnabled ? 'Alerta sonoro ativado (clique para silenciar)' : 'Alerta sonoro silenciado (clique para ativar)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden lg:inline text-[11px]">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>

          <div className="text-xs text-slate-400 border-l border-slate-800 pl-3 flex items-center gap-2">
            <span>Operador: <strong>{session.user?.email || 'Poliana'}</strong></span>
          </div>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs border border-slate-700"
            title="Guia Rápido de Uso do Painel"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">Ajuda</span>
          </button>

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
      <div className="flex-1 flex overflow-hidden min-w-0">

        {/* COLUNA 1: LISTA DE CONVERSAS */}
        <aside className="w-72 lg:w-80 xl:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
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
                onClick={() => { setFilter('waiting'); setCadenceFilter('all'); }} 
                className={filter === 'waiting' && cadenceFilter !== 'archived' ? 'px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition bg-amber-600 text-white' : 'px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Aguardando ({contacts.filter(c => c.status === 'waiting_agent').length})
              </button>
              <button 
                onClick={() => { setFilter('in_progress'); setCadenceFilter('all'); }} 
                className={filter === 'in_progress' && cadenceFilter !== 'archived' ? 'px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition bg-emerald-600 text-white' : 'px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Atendimento ({contacts.filter(c => c.status === 'in_progress').length})
              </button>
              <button 
                onClick={() => { setFilter('scheduled'); setCadenceFilter('all'); }} 
                className={filter === 'scheduled' && cadenceFilter !== 'archived' ? 'px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition bg-blue-600 text-white' : 'px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Agendados ({contacts.filter(c => c.status === 'scheduled').length})
              </button>
              <button 
                onClick={() => { setFilter('ai'); setCadenceFilter('all'); }} 
                className={filter === 'ai' && cadenceFilter !== 'archived' ? 'px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition bg-purple-600 text-white' : 'px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Marina ({contacts.filter(c => c.status === 'with_ai').length})
              </button>
              <button 
                onClick={() => { setFilter('all'); setCadenceFilter('all'); }} 
                className={filter === 'all' && cadenceFilter === 'all' ? 'px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition bg-slate-800 text-white' : 'px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition bg-slate-100 text-slate-600 hover:bg-slate-200'}
              >
                Ativos
              </button>
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 overflow-x-auto">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> Cadência:
              </span>
              <button
                onClick={() => { setCadenceFilter('all'); setFilter('all'); }}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition whitespace-nowrap ${
                  cadenceFilter === 'all' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => { setCadenceFilter('gancho_24h'); setFilter('all'); }}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition whitespace-nowrap ${
                  cadenceFilter === 'gancho_24h' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-500 hover:bg-blue-50'
                }`}
              >
                Gancho (24h-48h) ({contacts.filter(c => c.cadence_stage === 'gancho_24h').length})
              </button>
              <button
                onClick={() => { setCadenceFilter('archived'); setFilter('all'); }}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition whitespace-nowrap ${
                  cadenceFilter === 'archived' ? 'bg-slate-600 text-white font-semibold' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Arquivados (+8d) ({contacts.filter(c => c.status === 'archived').length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" /> A carregar contactos...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Nenhum contacto encontrado nesta fila.</div>
            ) : (
              filteredContacts.map(contact => (
                <div 
                  key={contact.id}
                  onClick={() => {
                    setSelectedId(contact.id);
                    selectedIdRef.current = contact.id;
                    fetchMessages(contact.id, contact.phone);
                  }}
                  className={selectedId === contact.id ? 'p-3.5 cursor-pointer transition bg-emerald-50/60 border-l-4 border-emerald-600' : 'p-3.5 cursor-pointer transition hover:bg-slate-50'}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{contact.name}</span>
                    <span className="text-[10px] text-slate-400">{contact.phone}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-2">{formatMediaPreviewText(contact.last_message)}</p>
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
                    {contact.status === 'archived' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700 border border-slate-300">
                        Arquivado (Desapego)
                      </span>
                    )}

                    {contact.cadence_stage === 'gancho_24h' && contact.status !== 'scheduled' && contact.status !== 'archived' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 border bg-blue-50 text-blue-700 border-blue-200">
                        🕒 Gancho Clínico ({Math.floor(contact.hours_inactive || 24)}h)
                      </span>
                    )}

                    {contact.days_inactive !== undefined && contact.days_inactive >= 3 && contact.status !== 'scheduled' && contact.status !== 'archived' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium inline-flex items-center gap-1 border bg-amber-50 text-amber-800 border-amber-200">
                        🕒 {contact.days_inactive}d sem resposta
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* COLUNA 2: ÁREA DE CHAT (min-w-0 impede empurrar a barra de resumo) */}
        <section className="flex-1 min-w-0 bg-[#f0f2f5] flex flex-col border-r border-slate-200 relative">
          {currentContact ? (
            <>
              <div className="bg-white px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2 shadow-sm shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-slate-900 truncate">{currentContact.name}</h2>
                    <span className="text-xs text-slate-400">{currentContact.phone}</span>
                    {currentContact.cadence_stage === 'gancho_24h' && (
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                        Janela Gancho Clínico (24h-48h)
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
                    {currentContact.status === 'archived' && (
                      <span className="text-slate-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-500"></span> Contato Arquivado (Ciclo de Desapego Concluído)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleExportSingleChat}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center gap-1 text-xs border border-slate-200"
                    title="Baixar Histórico Desta Conversa (.txt)"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden xl:inline text-[11px]">Exportar</span>
                  </button>

                  {currentContact.status !== 'archived' && (
                    <button 
                      onClick={markAsArchived}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                      title="Arquivar contato manualmente"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Arquivar</span>
                    </button>
                  )}

                  <button 
                    onClick={toggleAiStatus}
                    className={currentContact.status === 'with_ai' ? 'px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300' : 'px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300'}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    {currentContact.status === 'with_ai' ? 'Pausar IA / Assumir' : 'Reativar Marina IA'}
                  </button>
                  
                  <button 
                    onClick={toggleScheduledStatus}
                    className={
                      currentContact.status === 'scheduled'
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition'
                    }
                    title={
                      currentContact.status === 'scheduled'
                        ? 'Reverter agendamento e devolver paciente para atendimento ativo'
                        : 'Confirmar paciente como agendado'
                    }
                  >
                    {currentContact.status === 'scheduled' ? (
                      <>
                        <CalendarX className="w-3.5 h-3.5" /> Desmarcar / Reabrir
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="w-3.5 h-3.5" /> Marcar Agendado
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ÁREA DE MENSAGENS */}
              <div className="flex-1 min-h-0 px-5 py-4 overflow-y-auto space-y-3">
                {messages.map(msg => {
                  const role = getSenderRole(msg.sender);
                  return (
                    <div 
                      key={msg.id} 
                      className={role === 'patient' ? 'flex justify-start' : 'flex justify-end'}
                    >
                      <div className={
                        role === 'patient' 
                          ? 'max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-sm bg-white text-slate-800 rounded-tl-none border border-slate-100' 
                          : role === 'bot'
                          ? 'max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-sm bg-purple-50 border border-purple-200 text-slate-800 rounded-tr-none'
                          : 'max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-sm bg-emerald-600 text-white rounded-tr-none'
                      }>
                        {role === 'bot' && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1">
                            <Sparkles className="w-3 h-3" /> Marina (IA)
                          </div>
                        )}
                        {role === 'agent' && (
                          <div className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider mb-1">
                            Poliana (Secretária)
                          </div>
                        )}
                        <MessageContent
                          msg={msg}
                          isAgent={role === 'agent'}
                          onDeleteMedia={handleDeleteMediaMessage}
                        />
                        <span className={role === 'agent' ? 'block text-[10px] text-right mt-1 text-emerald-100' : 'block text-[10px] text-right mt-1 text-slate-400'}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* ATALHOS RÁPIDOS COLORIDOS POR CATEGORIA */}
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 shrink-0 max-h-28 overflow-y-auto">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-600" /> Atalhos:
                  </span>
                  
                  {quickReplies.map((qr) => (
                    <button 
                      key={qr.slug}
                      onClick={() => handleInsertQuickReply(qr.content)}
                      className={`px-2.5 py-1 border rounded-full text-[11px] transition font-medium shadow-2xs ${getPillColorClass(qr.category)}`}
                    >
                      {qr.title}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setEditingReplies(quickReplies);
                      setDeletedSlugs([]);
                      setIsTemplatesModalOpen(true);
                    }}
                    className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition ml-auto flex items-center gap-1 text-[10px] font-medium"
                    title="Editar, Colorir e Reordenar Modelos de Mensagens"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                </div>
              </div>

              {/* PRÉ-VISUALIZAÇÃO DO ARQUIVO ANEXADO */}
              {selectedFile && (
                <div className="bg-emerald-50/90 border-t border-emerald-200 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {filePreviewUrl ? (
                      <img
                        src={filePreviewUrl}
                        alt="Prévia do anexo"
                        className="w-10 h-10 rounded-lg object-cover border border-emerald-300 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(0)} KB • Digite uma legenda opcional ou clique em Enviar
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearAttachment}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                    title="Remover anexo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ENVIAR MENSAGEM / ANEXO */}
              <div className="bg-white p-3.5 border-t border-slate-200 flex items-end gap-2.5 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAttachFile(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingMedia}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0"
                  title="Anexar imagem ou documento (PDF)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <textarea 
                  rows={3}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onPaste={handlePasteInTextarea}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    selectedFile
                      ? 'Adicione uma legenda para o arquivo (opcional)...'
                      : 'Digite a mensagem como Poliana ou cole um print (Ctrl+V)...'
                  }
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs leading-relaxed focus:outline-none focus:border-emerald-600 transition resize-none"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isUploadingMedia || (!inputText.trim() && !selectedFile)}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0 shadow-xs"
                  title="Enviar mensagem ou arquivo (Enter)"
                >
                  {isUploadingMedia ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
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
          <aside className="w-72 xl:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
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

      {/* MODAL 1: EDIÇÃO, COR E ORDENAÇÃO DOS MODELOS DE RESPOSTAS RÁPIDAS (OPERADOR) */}
      {isTemplatesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <MessageSquareQuote className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Editar, Colorir e Ordenar Atalhos</h2>
                  <p className="text-[11px] text-slate-400">Arraste pelo ícone ⋮⋮ para ordenar e escolha a cor de cada pílula</p>
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
                  <div className="flex items-center justify-between gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-400">
                      💡 Use <strong>{'{nome}'}</strong> para inserir o primeiro nome do paciente. Escolha a cor pela bolinha ao lado do título.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddTemplate}
                      className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 font-semibold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Novo Atalho
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editingReplies.map((item, index) => (
                      <div
                        key={item.slug}
                        draggable
                        onDragStart={() => setDraggedIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedIndex !== null && draggedIndex !== index) {
                            moveTemplate(draggedIndex, index);
                          }
                          setDraggedIndex(null);
                        }}
                        onDragEnd={() => setDraggedIndex(null)}
                        className={`bg-slate-950 p-3.5 rounded-xl border transition space-y-2 ${
                          draggedIndex === index
                            ? 'border-emerald-500 opacity-60'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                            <span
                              className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-emerald-400 p-1 rounded"
                              title="Arraste para reordenar"
                            >
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 w-4 text-center">
                              {index + 1}.
                            </span>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const updated = [...editingReplies];
                                updated[index].title = e.target.value;
                                setEditingReplies(updated);
                              }}
                              className="bg-transparent font-semibold text-xs text-white border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none px-1 flex-1 min-w-0"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* SELETOR DE COR DA PÍLULA */}
                            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                              {PILL_COLOR_OPTIONS.map((opt) => {
                                const isSelected = (item.category || 'atendimento') === opt.key;
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => {
                                      const updated = [...editingReplies];
                                      updated[index].category = opt.key;
                                      setEditingReplies(updated);
                                    }}
                                    className={`w-3.5 h-3.5 rounded-full transition ${opt.dotClass} ${
                                      isSelected
                                        ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110'
                                        : 'opacity-45 hover:opacity-100'
                                    }`}
                                    title={`Cor: ${opt.label}`}
                                  />
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => moveTemplate(index, index - 1)}
                              disabled={index === 0}
                              className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
                              title="Mover para cima"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTemplate(index, index + 1)}
                              disabled={index === editingReplies.length - 1}
                              className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
                              title="Mover para baixo"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveTemplate(index)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                              title="Remover este atalho"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                          <Check className="w-3.5 h-3.5" /> Cores, ordem e modelos salvos com sucesso no Supabase!
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

      {/* MODAL 3: GUIA RÁPIDO DE USO DO PAINEL (CARREGAMENTO SOB DEMANDA) */}
      {isHelpOpen && (
        <Suspense fallback={null}>
          <HelpModal onClose={() => setIsHelpOpen(false)} />
        </Suspense>
      )}

    </div>
  );
}

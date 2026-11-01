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

  // Carregar contactos do Supabase
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

  // Carregar mensagens do contacto selecionado
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

    // Sincronização em tempo real (Supabase Realtime)
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

    // Salvar mensagem como agente no Supabase
    await supabase.from('messages').insert({
      contact_id: currentContact.id,
      phone: currentContact.phone,
      sender: 'agent',
      text: textToSend,
    });

    // Atualizar último registo no contacto mudando o status para 'in_progress'
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
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  filter === 'waiting' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Atendimento Poliana ({contacts.filter(c => c.status === 'waiting_agent' || c.status === 'in_progress').length})
              </button>
              <button 
                onClick={() => setFilter('ai')} 
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  filter === 'ai' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Com Marina ({contacts.filter(c => c.status === 'with_ai').length})
              </button>
              <button 
                onClick={() => setFilter('all')} 
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
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
                  className={`p-3.5 cursor-pointer transition

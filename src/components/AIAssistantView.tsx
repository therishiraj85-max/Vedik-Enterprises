import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Product, Customer, Invoice, Expense } from '../types';
import { Send, Lock, HelpCircle, Bot, Sparkles, MessageSquare } from 'lucide-react';

interface AIAssistantViewProps {
  chatMessages: ChatMessage[];
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  expenses: Expense[];
  isPro: boolean;
  onUpdateChat: (updatedList: ChatMessage[]) => void;
  triggerUpgrade: () => void;
  showToast: (msg: string) => void;
}

export default function AIAssistantView({
  chatMessages,
  products,
  customers,
  invoices,
  expenses,
  isPro,
  onUpdateChat,
  triggerUpgrade,
  showToast
}: AIAssistantViewProps) {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Seed default greetings if empty
  useEffect(() => {
    if (chatMessages.length === 0) {
      const defaultGreet: ChatMessage = {
        id: 'msg_greet',
        sender: 'bot',
        text: 'Pranam! 🙏 Mai hu Vedik Enterprises (वेदिक इंटरप्राइजेज) Assistant. Aap apne business ke bared me koi bhi sawal poochh sakte hain.\n\nJaise:\n- Aaj ki bikri kitni hai?\n- Profit kya hai?\n- Kaunsa maal khatam hone wala hai?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateChat([defaultGreet]);
    }
  }, [chatMessages, onUpdateChat]);

  // Help buttons
  const quickQuestions = [
    "Aaj kitni bikri hui?",
    "Kaunsa product sabse zyada bika?",
    "Is mahine profit kitna hai?",
    "Low stock items kaunse hain?"
  ];

  const handleSendMessage = (textToSend: string) => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }

    if (!textToSend.trim()) return;

    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // User Msg
    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: timestampStr
    };

    const currentHistory = [...chatMessages, userMsg];
    onUpdateChat(currentHistory);
    setInputText('');

    // Process Bot reply with rule-based patterns
    setTimeout(() => {
      const botResponse = generateHinglishReply(textToSend);
      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateChat([...currentHistory, botMsg]);
    }, 850);
  };

  const generateHinglishReply = (query: string): string => {
    const q = query.toLowerCase();

    // 1. "Aaj kitni bikri hui?" / Sales queries
    if (q.includes('bikri') || q.includes('sale') || q.includes('becha')) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayInvoices = invoices.filter(inv => inv.date === todayStr);
      const sum = todayInvoices.reduce((acc, inv) => acc + inv.total, 0);
      
      return `📊 Aaj ki bikri (today's sales) **₹${sum.toLocaleString('en-IN')}** hai. Aaj kul **${todayInvoices.length} general receipts** banaye gaye hain. Kuch aur poochhna chahte hain?`;
    }

    // 2. "Kaunsa product sabse zyada bika?"
    if (q.includes('bika') || q.includes('popular') || q.includes('item') || q.includes('saman')) {
      // Find top product sold by units
      const qtyMap: { [name: string]: number } = {};
      invoices.forEach(inv => {
        inv.items.forEach(item => {
          qtyMap[item.productName] = (qtyMap[item.productName] || 0) + item.qty;
        });
      });

      const topItem = Object.entries(qtyMap).sort((a, b) => b[1] - a[1])[0];
      if (topItem) {
        return `🌟 Sabse zyada bikne wala product **"${topItem[0]}"** hai, jiski kul **${topItem[1]} units** biki hain billing list me.`;
      }
      return `📦 Filhal billing data me koi products ki sale history nahi dikh rahi hai. Invoice banakar check karein!`;
    }

    // 3. "Is mahine profit kitna hai?"
    if (q.includes('profit') || q.includes('munafa') || q.includes('kama') || q.includes('fayda')) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const monthlySales = invoices
        .filter(inv => {
          const d = new Date(inv.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + inv.total, 0);

      const monthlyExpenses = expenses
        .filter(exp => {
          const d = new Date(exp.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

      const monthlyProfit = monthlySales - monthlyExpenses;

      return `📈 Is mahine (june 2026) ka profit state:\n\n- Kul Bikri (Sales): **₹${monthlySales.toLocaleString('en-IN')}**\n- Kul Kharche (Expenses): **₹${monthlyExpenses.toLocaleString('en-IN')}**\n\nNet Profit: **₹${monthlyProfit.toLocaleString('en-IN')}** ${
        monthlyProfit >= 0 ? '🟢 (Munafe me hai!)' : '🔴 (Nuksaan me hai, kharche kam karein.)'
      }`;
    }

    // 4. "Low stock items kaunse hain?"
    if (q.includes('stock') || q.includes('low') || q.includes('maal') || q.includes('khatam')) {
      const lowStock = products.filter(p => p.quantity < 5);
      if (lowStock.length > 0) {
        const listStr = lowStock.map(p => `- **${p.name}**: ${p.quantity} ${p.unit} left.`).join('\n');
        return `⚠️ Ye saman khatam hone wale hain (quantity < 5):\n\n${listStr}\n\nKripya distributor se turant order karein!`;
      }
      return `🎉 Badhiya! Koi bhi product low stock me nahi hai. Sabhi items healthy hain!`;
    }

    // 5. Default generic reply
    return `Sir, mujhe aapka sawal samajh nahi aya. Kripya nichi diye gaye topic me se poochhein:\n\n- Aaj ki bikri dekhna\n- Kaunsa maal behtareen bika\n- Is mahine ka profit\n- Low stock products`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-[450px] flex flex-col justify-between">
      
      {/* WhatsApp themed Header */}
      <div className="bg-[#0F6E56] text-white p-4 flex items-center space-x-3 shadow-md shrink-0">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-black text-white shadow">
          VE
        </div>
        <div>
          <h4 className="font-extrabold text-sm flex items-center space-x-1">
            <span>Vedik Enterprises AI Bot</span>
            <Sparkles className="w-3.5 h-3.5 text-[#F5A623] fill-current" />
          </h4>
          <span className="text-[10px] text-emerald-100 opacity-90 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
            Online • Aapka personal mudra-sahayak
          </span>
        </div>
      </div>

      {/* Suggested quick capsules */}
      <div className="bg-gray-50/70 p-2 border-b border-gray-100 flex items-center space-x-2 overflow-x-auto shrink-0 max-w-full">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={!isPro}
            className={`px-3 py-1 bg-white border border-gray-200 text-xxs font-bold text-gray-600 rounded-full shadow-sm hover:border-[#0F6E56] hover:text-[#0F6E56] transition-all whitespace-nowrap inline-flex items-center space-x-1 ${
              !isPro ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <span>{q}</span>
            {!isPro && <Lock className="w-2.5 h-2.5 text-gray-400" />}
          </button>
        ))}
      </div>

      {/* Conversation Thread bubbles */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f0ede5] relative">
        <div className="absolute inset-0 bg-[radial-gradient(#108a6b_0.6px,transparent_0.6px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

        {chatMessages.map((msg) => {
          const isMe = msg.sender === 'user';
          
          return (
            <div 
              key={msg.id} 
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-150`}
            >
              <div className={`max-w-[80%] rounded-xl p-3 shadow-sm relative ${
                isMe 
                  ? 'bg-[#E1F7EC] text-emerald-950 border border-emerald-100 rounded-tr-none' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
              }`}>
                {/* Text string rendered beautifully with multi line line breakers support */}
                <div className="text-xs whitespace-pre-line leading-relaxed font-semibold">
                  {msg.text}
                </div>
                <span className="text-[9px] text-gray-450 block text-right mt-1.5 font-medium font-mono">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef}></div>
      </div>

      {/* Input container at bottom */}
      <div className="p-3 bg-gray-50 border-t border-gray-100 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={isPro ? "Apna sawal poochho..." : "Locks: Pro plan me upgrade karein sawal poochhne ke liye"}
            disabled={!isPro}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(inputText);
            }}
            className={`w-full bg-white border border-gray-200 outline-none rounded-lg py-2.5 pl-4 pr-10 text-xs shadow-inner focus:border-[#0F6E56] ${
              !isPro ? 'opacity-65 cursor-not-allowed bg-gray-100' : ''
            }`}
          />

          {!isPro ? (
            <button
              onClick={triggerUpgrade}
              className="absolute right-2.5 p-1.5 hover:bg-gray-150 text-gray-400"
              title="Unlock Pro plan"
            >
              <Lock className="w-4 h-4 text-amber-500 animate-pulse" />
            </button>
          ) : (
            <button
              onClick={() => handleSendMessage(inputText)}
              className="absolute right-2.5 p-1.5 hover:bg-gray-100 text-[#0F6E56]"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

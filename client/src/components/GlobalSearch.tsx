import React, { useState, useEffect, useRef } from 'react';
import { Search, Building, User, FileText, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

interface GlobalSearchProps {
  onNavigate: (page: string, id?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'client': return <User className="w-4 h-4 text-blue-500" />;
      case 'property': return <Building className="w-4 h-4 text-emerald-500" />;
      case 'invoice': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'contract': return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleSelect = (item: any) => {
    setIsOpen(false);
    setQuery('');
    if (item.type === 'client') onNavigate('clients', item.id);
    else if (item.type === 'property') onNavigate('properties', item.id);
    else if (item.type === 'invoice') onNavigate('invoices', item.id);
    else if (item.type === 'contract') onNavigate('contracts', item.id);
    else if (item.type === 'intervention') onNavigate('services', item.id);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-12 py-2 text-xs md:text-sm bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
          ⌘K
        </kbd>
      </div>

      {isOpen && (query.trim() !== '' || loading) && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-xs text-slate-400 text-center">{t('loading')}</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-4 text-xs text-slate-500 text-center">{t('noData')}</div>
          ) : (
            results.map((res, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(res)}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
              >
                <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                  {getIcon(res.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 truncate">{res.title}</div>
                  <div className="text-[11px] text-slate-500 truncate">{res.subtitle}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

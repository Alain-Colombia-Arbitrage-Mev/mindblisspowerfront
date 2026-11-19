'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from 'cmdk';
import { walletCountrySearch } from '@/lib/wallet-country-search.mjs';
import styles from './production-country-select.module.css';

export default function ProductionCountrySelect({ id, value, countries, disabled, onChange, locale, label, placeholder, searchLabel, emptyLabel }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState('');
  const mounted = useRef(false), live = useRef(null);
  live.current = { disabled, countries, onChange, value };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (disabled) { setOpen(false); setQuery(''); } }, [disabled]);
  const options = walletCountrySearch(countries, locale, query), selected = walletCountrySearch(countries, locale).find(item => item.code === value);
  const choose = code => {
    if (!mounted.current || live.current.disabled || !live.current.countries.some(item => item.code === code)) return;
    if (code !== live.current.value) live.current.onChange(code);
    setOpen(false); setQuery('');
  };
  return <Popover open={open && !disabled} onOpenChange={next => { if (mounted.current) { setOpen(Boolean(next) && !live.current.disabled); if (!next) setQuery(''); } }}>
    <PopoverTrigger asChild><button id={id} type="button" role="combobox" aria-expanded={open && !disabled}
      aria-required="true" aria-label={label} value={value} disabled={disabled} className={styles.trigger}>
      <span>{selected?.label || placeholder}</span><ChevronsUpDown size={16} aria-hidden="true" />
    </button></PopoverTrigger>
    {open && !disabled ? <PopoverContent align="start" collisionPadding={16} className={styles.content}>
      <Command label={label} shouldFilter={false} className={styles.command}>
        <CommandInput value={query} onValueChange={setQuery} placeholder={searchLabel} aria-label={searchLabel} className={styles.search} />
        <CommandList label={label} className={styles.list}>
          <CommandEmpty className={styles.empty}>{emptyLabel}</CommandEmpty>
          {options.map(item => <CommandItem key={item.code} value={item.code} onSelect={() => choose(item.code)} className={styles.item}>
            <span>{item.label}</span><span className={styles.code}>{item.code}</span>{item.code === value ? <Check size={16} aria-hidden="true" /> : null}
          </CommandItem>)}
        </CommandList>
      </Command>
    </PopoverContent> : null}
  </Popover>;
}

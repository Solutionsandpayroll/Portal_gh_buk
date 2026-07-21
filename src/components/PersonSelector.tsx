'use client';

import React, { useState, useRef, useEffect } from 'react';
import './PersonSelector.css';

const PEOPLE = [
  "Alba Luz Borja","Alba Suarez","Alejandro Echavarria","Alfonso Fonseca","Ana Maria Gutierrez","Brayan Pardo","Camila Herrera","Carolina Morales","Cristian Parada","Daniela Sandoval","Dayan Manjarres","Dayana Mejia","Deissy Preciado","Diana Mendez","Eduard Forero","Eduardo Castañeda","Erika Letrado","Fabian Morales","German Hincapie","Giovanna Guio","Heliana Ramirez","Ingrid Pineda","Jennifer Cervantes","Jhon Jairo Leon","Johana Arevalo","Juan David Urbina","Julieth Bonilla","Kevin Gonzalez","Lesly Madrid","Lina Chinome","Lina Guio","Lorena Garcia Navarro","Marco Castiblanco","Michael Pertuz","Michelle Sanchez","Nathalie Vaquiro","Nicolas Ballesteros","Oscar Cano","Paola Gonzalez","Paola Velasquez","Patricia Jimenez","Patricia Osorio","Ricardo Arambulo Polo","Rocio Guacaneme","Sandra Bello","Sharon Amaya","Simon Tschannen","Tatiana Chavarro","Tatiana Cumbe","Viviana Achury","Viviana Guzman","Viviana Martinez","William Romero","Yadira Pineda","Yeferson Pineda","Yenny Delgado","Yina Vega","Yuly Peña"
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  options?: string[];
}

export default function PersonSelector({ value, onChange, placeholder, required, id, options }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const sourceList = options ?? PEOPLE;

  useEffect(() => {
    setFilter(value ?? '');
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const filtered = sourceList.filter((p) => p.toLowerCase().includes(filter.toLowerCase()));

  function pick(v: string) {
    onChange(v);
    setFilter(v);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered.length > 0) {
        e.preventDefault();
        pick(filtered[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="person-select" ref={containerRef}>
      <input
        id={id}
        ref={inputRef}
        className="person-input"
        type="text"
        placeholder={placeholder}
        value={filter}
        onChange={(e) => { setFilter(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        aria-autocomplete="list"
        aria-expanded={open}
        required={required}
      />

      {open && (
        <div className="person-dropdown" role="listbox">
          {filtered.length === 0 ? (
            <div className="person-empty">No hay coincidencias</div>
          ) : (
            <ul>
              {filtered.map((p, i) => (
                <li
                  key={p}
                  className={`person-option${i === highlight ? ' highlighted' : ''}`}
                  onMouseDown={(ev) => { ev.preventDefault(); pick(p); }}
                  onMouseEnter={() => setHighlight(i)}
                >
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

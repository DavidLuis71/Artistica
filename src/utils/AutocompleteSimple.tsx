import { useState } from "react";
import "./AutocompleteSimple.css";

interface Option {
  id: number;
  label: string;
}

interface Props {
  options: Option[];
  value: number | null | undefined;
  onChange: (value: number | null | undefined) => void;
  placeholder?: string;
  badgeIds?: number[];
}

export default function AutocompleteSimple({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  badgeIds,
}: Props) {
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);

  const selectedOption = options.find((o) => o.id === value) || null;
  const filtered = options
    .filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="Auto-wrapper" onBlur={() => setShow(false)}>
      <span className="Auto-icon">🔍</span>

      <input
        className="Auto-input"
        placeholder={placeholder}
        value={selectedOption ? selectedOption.label : search}
        onChange={(e) => {
          onChange(null);
          setSearch(e.target.value);
        }}
        onFocus={() => setShow(true)}
        onClick={(e) => e.stopPropagation()}
      />
      {selectedOption && (
        <button
          className="Auto-clear"
          onMouseDown={(e) => {
            e.preventDefault(); // evita perder el foco
            onChange(null);
            setSearch("");
          }}
        >
          ✕
        </button>
      )}

      {show && (
        <div className="Auto-list">
          {filtered.map((o) => {
            const idx = o.label.toLowerCase().indexOf(search.toLowerCase());
            const before = o.label.slice(0, idx);
            const match = o.label.slice(idx, idx + search.length);
            const after = o.label.slice(idx + search.length);

            return (
              <div
                key={o.id}
                className="Auto-item"
                onMouseDown={() => {
                  onChange(o.id);
                  setSearch(o.label);
                  setShow(false);
                }}
              >
                <div className="Auto-avatar">{o.label.charAt(0)}</div>
                <span>
                  {before}
                  <span className="Auto-highlight">{match}</span>
                  {after}
                </span>
                {badgeIds?.includes(o.id) && <span className="Auto-badge" />}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="Auto-empty">No hay resultados</div>
          )}
        </div>
      )}
    </div>
  );
}

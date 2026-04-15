import { useState, useRef, useEffect } from "react";
import "./AutocompleteSimple.css";

interface Option {
  id: number;
  label: string;
}

interface Props {
  options: Option[];
  value: number[]; // array de IDs seleccionadas
  onChange: (value: number[]) => void;
  placeholder?: string;
}

export default function AutocompleteMultiple({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
}: Props) {
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) &&
      !value.includes(o.id)
  );

  const addOption = (id: number) => {
    onChange([...value, id]);
    setSearch("");
    setShow(false);
  };

  const removeOption = (id: number) => {
    onChange(value.filter((v) => v !== id));
  };

  return (
    <div className="Auto-wrapper" ref={wrapperRef}>
      <div className="Auto-Multiple-chips-container">
        {value.map((id) => {
          const option = options.find((o) => o.id === id);
          if (!option) return null;
          return (
            <div key={id} className="Auto-Multiple-chip">
              {option.label}
              <span
                className="Auto-Multiple-chip-remove"
                onClick={() => removeOption(id)}
              >
                ✕
              </span>
            </div>
          );
        })}
        <input
          className="Auto-input"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShow(true)}
        />
      </div>

      {show && filtered.length > 0 && (
        <div className="Auto-list">
          {filtered.map((o) => (
            <div
              key={o.id}
              className="Auto-item"
              onMouseDown={() => addOption(o.id)}
            >
              <div className="Auto-avatar">{o.label.charAt(0)}</div>
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

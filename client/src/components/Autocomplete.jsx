import React, { useState, useEffect, useRef } from 'react';

const Autocomplete = ({
    label,
    value,
    onChange,
    onSelect,
    placeholder,
    fetchSuggestions
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        // Close suggestions on outside click
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (value && value.length > 1 && isOpen) {
                setLoading(true);
                try {
                    const results = await fetchSuggestions(value);
                    setSuggestions(results);
                } catch (error) {
                    console.error("Autocomplete error:", error);
                    setSuggestions([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [value, isOpen, fetchSuggestions]);

    return (
        <div className="autocomplete-wrapper" ref={wrapperRef} style={{ position: 'relative' }}>
            {label && <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{label}</label>}
            <input
                type="text"
                className="input"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
            />

            {isOpen && suggestions.length > 0 && (
                <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    listStyle: 'none',
                    padding: 0,
                    margin: '4px 0 0 0',
                    zIndex: 100,
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {suggestions.map((item, index) => (
                        <li
                            key={item.id || index}
                            onClick={() => {
                                onSelect(item);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                borderBottom: index === suggestions.length - 1 ? 'none' : '1px solid var(--border)',
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--background)'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                        >
                            {item.label || item.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Autocomplete;

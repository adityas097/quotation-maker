import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationControls = ({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange
}) => {
    if (totalItems === 0) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex-between" style={{
            padding: '1rem',
            borderTop: '1px solid var(--border)',
            marginTop: '1rem',
            background: '#f9fafb',
            borderRadius: '0 0 0.5rem 0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Showing <b>{startItem}-{endItem}</b> of <b>{totalItems}</b>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rows per page:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(e.target.value)}
                        className="input"
                        style={{ padding: '0.25rem', fontSize: '0.875rem', width: 'auto' }}
                    >
                        <option value="10">10</option>
                        <option value="30">30</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="500">500</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    className="btn btn-secondary p-1"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft size={16} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Simple logic to show near pages, for now just show first 5 or simpler logic?
                        // Let's just show current page number and be done or a simple range.
                        // For simplicity, let's just show "Page X of Y" and arrows.
                        return null;
                    })}
                    <span style={{ fontSize: '0.875rem', margin: '0 0.5rem' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                </div>
                <button
                    className="btn btn-secondary p-1"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default PaginationControls;

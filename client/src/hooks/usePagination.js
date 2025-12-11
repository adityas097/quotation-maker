import { useState, useMemo } from 'react';

const usePagination = (data = [], initialPageSize = 30) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    // Reset page if data length changes drastically or search filter changes
    // But for client side search, we usually pass filtered data.

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const currentData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return data.slice(start, start + pageSize);
    }, [data, currentPage, pageSize]);

    const goToPage = (page) => {
        const p = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(p);
    };

    const changePageSize = (newSize) => {
        setPageSize(Number(newSize));
        setCurrentPage(1); // Reset to first page to avoid out of bounds
    };

    return {
        currentData,
        currentPage,
        totalPages,
        pageSize,
        totalItems,
        goToPage,
        changePageSize
    };
};

export default usePagination;

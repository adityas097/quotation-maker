import { useState, useMemo } from 'react';

const usePagination = (data = [], initialPageSize = 30) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    // Reset page if data length changes drastically or search filter changes
    // But for client side search, we usually pass filtered data.

    // Ensure data is always an array
    const validData = Array.isArray(data) ? data : [];

    const totalItems = validData.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return validData.slice(start, start + pageSize);
    }, [validData, currentPage, pageSize]);

    const goToPage = (page) => {
        const p = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(p);
    };

    const changePageSize = (newSize) => {
        setPageSize(Number(newSize));
        setCurrentPage(1); // Reset to first page to avoid out of bounds
    };

    return {
        currentItems,
        currentPage,
        totalPages,
        pageSize,
        totalItems,
        goToPage,
        changePageSize
    };
};

export default usePagination;

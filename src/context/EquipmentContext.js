import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const EQUIPMENT_API_URL = 'http://localhost:4221/equipments';
const STORAGE_KEY = 'sport_equipments';
const CATEGORIES_STORAGE_KEY = 'sport_categories';

const EquipmentContext = createContext(null);

// Helper to extract unique { category_id, category_name } objects from equipment list
const extractCategories = (list) => {
  const catMap = new Map();
  (Array.isArray(list) ? list : []).forEach((item) => {
    const catId = item.category_id;
    const catName = item.category_name;
    if (catId != null || catName) {
      const key = String(catId);
      if (!catMap.has(key)) {
        catMap.set(key, {
          category_id: catId,
          category_name: catName,
        });
      }
    }
  });
  return Array.from(catMap.values());
};

export const EquipmentProvider = ({ children }) => {
  const [equipments, setEquipments] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [categories, setCategories] = useState(() => {
    try {
      const stored = sessionStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Fallback extraction from cached equipments
      const storedEq = sessionStorage.getItem(STORAGE_KEY);
      return storedEq ? extractCategories(JSON.parse(storedEq)) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Background fetch - fire and forget, won't block UI
  const fetchEquipments = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch(EQUIPMENT_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch equipments');
        return res.json();
      })
      .then((data) => {
        // data: [{ equipment_id, equipment_name, quantity, category_id, category_name }, ...]
        const list = Array.isArray(data) ? data : [];
        setEquipments(list);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));

        const extractedCategories = extractCategories(list);
        setCategories(extractedCategories);
        sessionStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(extractedCategories));
      })
      .catch((err) => {
        console.error('Background equipment fetch failed:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  // Group equipments by category for easy lookup (matches by category_name, category, or category_id)
  const getByCategory = useCallback((category) => {
    if (!category) return [];
    const search = category.toString().toUpperCase().trim();
    return equipments.filter(
      (eq) =>
        (eq.category_name && eq.category_name.toUpperCase().trim() === search) ||
        (eq.category && eq.category.toUpperCase().trim() === search) ||
        (eq.category_id != null && String(eq.category_id) === search)
    );
  }, [equipments]);

  return (
    <EquipmentContext.Provider
      value={{
        equipments,
        categories,
        setCategories,
        loading,
        error,
        fetchEquipments,
        getByCategory,
      }}
    >
      {children}
    </EquipmentContext.Provider>
  );
};

export const useEquipment = () => {
  const context = useContext(EquipmentContext);
  if (!context) {
    throw new Error('useEquipment must be used within an EquipmentProvider');
  }
  return context;
};

export default EquipmentContext;


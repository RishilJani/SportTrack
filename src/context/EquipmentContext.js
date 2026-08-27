import React, { createContext, useContext, useState, useCallback } from 'react';

const EQUIPMENT_API_URL = 'http://localhost:4221/equipments';

const EquipmentContext = createContext(null);

export const EquipmentProvider = ({ children }) => {
  const [equipments, setEquipments] = useState([]);
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
        // data: [{ equipment_id, equipment_name, category }, ...]
        setEquipments(data);
      })
      .catch((err) => {
        console.error('Background equipment fetch failed:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Group equipments by category for easy lookup
  const getByCategory = useCallback((category) => {
    return equipments.filter(
      (eq) => eq.category?.toUpperCase() === category?.toUpperCase()
    );
  }, [equipments]);

  // Get unique categories
  const categories = [...new Set(equipments.map((eq) => eq.category))];

  return (
    <EquipmentContext.Provider
      value={{ equipments, categories, loading, error, fetchEquipments, getByCategory }}
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

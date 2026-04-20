import React, { useState, createContext, useContext } from 'react';

const TabsContext = createContext(null);

export function Tabs({ children, value, onValueChange, className = '', ...props }) {
  const [activeTab, setActiveTab] = useState(value);

  const handleChange = (newValue) => {
    setActiveTab(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange }}>
      <div className={`w-full ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '', ...props }) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-start rounded-md bg-gray-100 p-1 text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ children, value, className = '', ...props }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'hover:bg-gray-200 hover:text-gray-900'} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, className = '', ...props }) {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== value) return null;

  return (
    <div
      className={`mt-2 focus-visible:outline-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Tabs;

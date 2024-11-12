// src/app/context/menuVisibilityContext.tsx
import { createContext, useState } from "react";

const MenuVisibilityContext = createContext({
  menuVisible: false,
  toggleMenu: () => {},
});

export const MenuVisibilityProvider = ({ children }) => {
  const [menuVisible, setMenuVisible] = useState(true);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  return (
    <MenuVisibilityContext.Provider value={{ menuVisible, toggleMenu }}>
      {children}
    </MenuVisibilityContext.Provider>
  );
};

export default MenuVisibilityContext;

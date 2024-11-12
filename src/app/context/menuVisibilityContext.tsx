// src/app/context/menuVisibilityContext.tsx
import { createContext, useState, ReactNode } from "react";

interface MenuVisibilityContextProps {
  menuVisible: boolean;
  toggleMenu: () => void;
}

const MenuVisibilityContext = createContext<MenuVisibilityContextProps>({
  menuVisible: false,
  toggleMenu: () => {},
});

interface MenuVisibilityProviderProps {
  children: ReactNode;
}

export const MenuVisibilityProvider: React.FC<MenuVisibilityProviderProps> = ({ children }) => {
  const [menuVisible, setMenuVisible] = useState(true);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  return (
    <MenuVisibilityContext.Provider value={{ menuVisible, toggleMenu }}>
      {children}
    </MenuVisibilityContext.Provider>
  );
};

export default MenuVisibilityContext;

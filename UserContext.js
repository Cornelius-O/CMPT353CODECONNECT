import React, { createContext, useState, useContext } from 'react';

export const UserContext = createContext();

export const useUserContext = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [userId, setUserId] = useState(null); // Add userId state

    return (
        <UserContext.Provider value={{ isLoggedIn, setIsLoggedIn, username, setUsername, userId, setUserId }}>
            {children}
        </UserContext.Provider>
    );
};
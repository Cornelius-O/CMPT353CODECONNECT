import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './components/UserContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import Registration from './components/Registration';
import Channel from './components/Channel';

function App() {
    return (
        <UserProvider>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/register" element={<Registration />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/channels" element={<Channel />} />
                    {/* Other routes */}
                </Routes>
            </Router>
        </UserProvider>
    );
}

export default App;
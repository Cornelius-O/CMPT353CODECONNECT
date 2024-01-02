import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { UserContext } from './UserContext'; // Import UserContext
import './Navbar.css';

const Navbar = () => {
    const { isLoggedIn, setIsLoggedIn, username } = useContext(UserContext); // Access states from UserContext
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = React.useState(false);

    const handleLogout = () => {
        // Clear any authentication tokens or user-specific data here
        localStorage.removeItem('authToken');
        setIsLoggedIn(false); // Update isLoggedIn state
        setShowLogoutModal(true);
        setTimeout(() => {
            navigate('/'); // Redirect to home page after logout
        }, 2000); // Redirect after 2 seconds
    };

    const handleCloseModal = () => {
        setShowLogoutModal(false);
    };

    return (
        <>
            <nav className="navbar">
                <div className="nav-brand">
                    <Link to="/">Code Connect</Link>
                </div>
                <div className="nav-links">
                    {isLoggedIn ? (
                        <>
                            <span className="welcome-message">Welcome, {username}</span>
                            <button onClick={handleLogout}>Logout</button>
                            <Link to="/channels">Channels</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/register">Register</Link>
                            <Link to="/login">Login</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Logout Modal */}
            <Modal show={showLogoutModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Logout Successful</Modal.Title>
                </Modal.Header>
                <Modal.Body>You have been logged out.</Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleCloseModal}>
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Navbar;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const LoginRegister = () => {
    const [isActive, setIsActive] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const navigate = useNavigate();

    //  Toast Notification State
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    //password visibility state
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
    };

    const [registerData, setRegisterData] = useState({
        email: "",
        password: "",
        role: "Staff"
    });

    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
        role: "Staff"
    });

    const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/signup`, registerData);
            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
                showToast("Nexus Protocol Initialized!", "success");
                setTimeout(() => navigate("/dashboard"), 1200);
            } else {
                showToast("Account created. Please Sign In.", "success");
                setIsActive(false);
            }
        } catch (err) {
            showToast(err.response?.data?.message || "Registration Denied");
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, loginData);
            localStorage.setItem("token", res.data.token);
            showToast("Access Granted. Welcome back.", "success");
            setTimeout(() => navigate("/dashboard"), 1200);
        } catch (err) {
            showToast(err.response?.data?.message || "Invalid Credentials");
        }
    };

    return (
        <div className={`login-page-wrapper ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>

            {/* 🚨 NEW: Custom Toast UI */}
            {toast.show && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        <div className="toast-content">
                            <span>{toast.type === 'success' ? '✅' : '🚨'}</span>
                            <span className="toast-message">{toast.message}</span>
                        </div>
                        <button className="toast-close" onClick={() => setToast({ ...toast, show: false })}>✕</button>
                    </div>
                </div>
            )}

            <button className="theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
                {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>

            <div className={`container ${isActive ? "active" : ""}`} id="container">
                <div className="form-container sign-up">
                    <form onSubmit={handleRegister}>
                        <h1>Create Account</h1>
                        <span>Initialize new Nexus protocol</span>
                        <input type="text" placeholder="Username" name="username" value={registerData.username} onChange={handleRegisterChange} required />
                        <input type="email" placeholder="Email" name="email" value={registerData.email} onChange={handleRegisterChange} required />
                        {/* here we define password visible/invisible functionality */}
                        <div className="password-container">
                            <input type={showRegisterPassword ? "text" : "password"} placeholder="Password" name="password" value={registerData.password} onChange={handleRegisterChange} required />
                            <button type="button" className="password-toggle" onClick={() => setShowRegisterPassword(!showRegisterPassword)}>
                                {showRegisterPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                        <select name="role" value={registerData.role} onChange={handleRegisterChange} className="role-select">
                            <option value="Staff">Staff</option>
                            <option value="Admin">Admin</option>
                        </select>
                        <button type="submit">Sign Up</button>
                    </form>
                </div>

                <div className="form-container sign-in">
                    <form onSubmit={handleLogin}>
                        <h1>Sign In</h1>
                        <span>Access the Vault</span>
                        <input type="email" placeholder="Email" name="email" value={loginData.email} onChange={handleLoginChange} required />
                        {/* here we define password visible/invisible functionality */}
                        <div className="password-container">
                            <input type={showLoginPassword ? "text" : "password"} placeholder="Password" name="password" value={loginData.password} onChange={handleLoginChange} required />
                            <button type="button" className="password-toggle" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                                {showLoginPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>

                        </div>
                        <select name="role" value={loginData.role} onChange={handleLoginChange} className="role-select">
                            <option value="Staff">Staff</option>
                            <option value="Admin">Admin</option>
                        </select>
                        <a href="#">Forgot your password?</a>
                        <button type="submit">Sign In</button>
                    </form>
                </div>

                <div className="toggle-container">
                    <div className="toggle">
                        <div className="toggle-panel toggle-left">
                            <h1>Welcome Back!</h1>
                            <p>Enter your credentials to manage inventory</p>
                            <button type="button" className="hidden" onClick={() => setIsActive(false)}>Sign In</button>
                        </div>
                        <div className="toggle-panel toggle-right">
                            <h1>Hello, User!</h1>
                            <p>Register your credentials to enter the Nexus</p>
                            <button type="button" className="hidden" onClick={() => setIsActive(true)}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default LoginRegister
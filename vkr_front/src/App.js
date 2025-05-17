import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import LoginModal from "./components/auth";
import Main from "./components/main";
import Notification from "./components/notifications";
import TaskPage from "./components/task";
import AccountPage from "./components/account";
import Admin from "./components/admin";
import StatsPage from "./components/statistics";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import "./App.css";

function App() {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (message, type = "info") => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeNotification(id), 5000);
    };
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <>
            {/* Контейнер для уведомлений, который будет показываться во всей системе */}
            <div className="notificationsWrapper">
                {notifications.map(notification => (
                    <Notification
                        key={notification.id}
                        {...notification}
                        onClose={removeNotification}
                    />
                ))}
            </div>
            <Routes>
                <Route path="/main" element={<Main />} />
                <Route path="/task/:id" element={<TaskPage />} />
                <Route path="/" element={<LoginModal addNotification={addNotification} />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/stats" element={<StatsPage />} />
            </Routes>
        </>
    );
}

export default App;

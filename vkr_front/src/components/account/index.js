import React, { useState, useEffect } from "react";
import "./styles.css";
import {useParams, useNavigate} from "react-router-dom";
import formatDueDate from "../forms/DateFormat";

const AccountPage = () => {
    const [user, setUser] = useState({});
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/logout?user_id=${localStorage.getItem('activeUser')}`);
            localStorage.removeItem('activeUser');
            window.location.href = '/';
        } catch (e) {
            console.error(e);
        }
    };

    const fetchUser = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/users?user_id=${localStorage.getItem('activeUser')}&detailed=true`);
            const data = await response.json();
            setUser(data[0]);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <div className="account-page">
            <button className="back-button-account" onClick={() => navigate(-1)}>Назад</button>
            <h1>{user.name}</h1>
            <div className="account-details">
                <p><strong>Почта:</strong> {user.email}</p>
                <p><strong>Телефон:</strong> {user.phone}</p>
                <p><strong>Дата рождения:</strong> {formatDueDate(user.birthday, false)}</p>
                <p><strong>Роль:</strong> {user.role}</p>
                <p><strong>Опыт:</strong> {user.experience?.toFixed(2)}</p>
            </div>
            <button onClick={handleLogout} className="logout-button">Выйти</button>
        </div>
    );
};

export default AccountPage;

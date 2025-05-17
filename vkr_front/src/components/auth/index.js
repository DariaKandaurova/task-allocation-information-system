import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import styles from './styles.css';

const icons = {
    eye: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12S4 4 12 4s11 8 11 8-3 8-11 8S1 12 1 12z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
};

const LoginModal = ({addNotification}) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [serverError, setServerError] = useState('');


    const handleSubmit = async (e) => {
        e.preventDefault();
        setEmailError('');
        setPasswordError('');

        let valid = true;
        if (!email) {
            setEmailError('Заполните поле');
            valid = false;
        }
        if (!password) {
            setPasswordError('Заполните поле');
            valid = false;
        }
        if (!valid) return;

        try {
            const response = await fetch('http://127.0.0.1:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });
            const data = await response.json();
            if (response.status === 200) {
                localStorage.setItem('activeUser', data.id);
                localStorage.setItem('activeUserName', data.name);
                addNotification('Успешная авторизация', 'success');
                if (data.role === 'Администратор') {
                    navigate("/admin");
                }
                navigate("/main");
            } else {
                setServerError(data.detail || 'Неверные имя пользователя или пароль');
                setPassword('');
            }
        } catch (error) {
            console.error(error);
            addNotification(error.message || 'Ошибка авторизации', 'error');
        }
    };

    const isUserAuthenticated = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/users?user_id=${localStorage.getItem('activeUser')}`);
            const data = await response.json();
            if (data[0].status === 'logged_in') {
                console.log(data[0].role)
                if (data[0].role === 'Администратор') {
                    navigate("/admin");
                } else {
                    navigate("/main");
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        isUserAuthenticated();
    });

    const renderLoginForm = () => (
        <form onSubmit={handleSubmit}>
            <div className="formGroup">
                <label className="formGroupLabel">Адрес электронной почты</label>
                <div className="loginWrapper">
                <input
                    className={`formGroupInput ${emailError ? "errorBorder" : ""}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {emailError && <p className="errorMessage">{emailError}</p>}
                </div>
            </div>
            <div className="formGroup">
                <label className="formGroupLabel">Пароль</label>
                <div className="passwordWrapper">
                    <input
                        className={`formGroupInput ${passwordError ? "errorBorder" : ""}`}
                        type={passwordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        className="showPasswordBtn"
                        onMouseDown={() => setPasswordVisible(true)}
                        onMouseUp={() => setPasswordVisible(false)}
                        onMouseLeave={() => setPasswordVisible(false)}
                    >
                        {icons.eye}
                    </button>
                </div>
                {passwordError && <p className="errorMessage">{passwordError}</p>}
            </div>
            <button type="submit" className="button">Войти</button>
            {serverError && <p className="serverError">{serverError}</p>}
        </form>
    );


    return (

            <div className="modalOverlay">
                <div className="modalContent">
                    {renderLoginForm()}
                </div>
            </div>
    );
};

export default LoginModal;

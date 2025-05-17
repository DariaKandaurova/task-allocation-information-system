import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "./styles.css";
import {FaRegUser} from "react-icons/fa";

function AdminPage() {
    const navigate = useNavigate();

    const [validationErrors, setValidationErrors] = useState({});

    const [searchQuery, setSearchQuery] = useState("");
    const [projects, setProjects] = useState([]);

    const [users, setUsers] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserRole, setNewUserRole] = useState("Заказчик");

    const [selectedProject, setSelectedProject] = useState(null);

    const [updatedRoles, setUpdatedRoles] = useState({});

    const roleOptions = [
        { value: "Администратор", label: "Администратор" },
        { value: "Сотрудник", label: "Сотрудник" },
        { value: "Заказчик", label: "Заказчик" },
        { value: "Руководитель проектов", label: "Руководитель проектов" },
        { value: "Тимлид", label: "Тимлид" },
    ];

    const loginOptions = {
        "logged_in": "Сессия активна",
        "logged_out": "Сессия неактивна"
    };

    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [newEmployeeRole, setNewEmployeeRole] = useState("");

    const [activeTab, setActiveTab] = useState("employees");

    const fetchUsers = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/users?type=user");
            const data = await response.json();
            setUsers(data);
            const roles = {};
            data.forEach((user) => {
                roles[user.id] = user.role;
            });
            setUpdatedRoles(roles);
        } catch (error) {
            console.error("Ошибка получения пользователей:", error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/users?type=employee");
            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            console.error("Ошибка получения сотрудников:", error);
        }
    };

    const getProjects = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/projects`);
            const data = await response.json();
            setProjects(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        getProjects();
        fetchUsers();
        fetchEmployees();
    }, []);

    const filteredUsers = users.filter(
        (user) =>
            (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredEmployees = employees.filter(
        (emp) =>
            (emp.name && emp.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const updateUserRole = async (userId) => {
        try {
            const newRole = updatedRoles[userId];
            const response = await fetch(`http://127.0.0.1:8000/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (response.ok) {
                fetchUsers();
            } else {
                console.error("Не удалось обновить роль пользователя");
            }
        } catch (error) {
            console.error("Ошибка обновления роли пользователя:", error);
        }
    };

    const deleteUser = async (userId) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/users/${userId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                fetchUsers();
            } else {
                console.error("Ошибка удаления пользователя");
            }
        } catch (error) {
            console.error("Ошибка удаления пользователя:", error);
        }
    };

    const handleAccountClick = () => {
        navigate("/account");
    };

    const addNewUser = async () => {
        const errors = {};
        if (!newUserEmail.trim()) {
            errors.newUserEmail = "Поле обязательно для заполнения.";
        }
        if (!newUserPassword.trim()) {
            errors.newUserPassword = "Поле обязательно для заполнения.";
        }
        if (!selectedProject) {
            errors.selectedProject = "Поле обязательно для заполнения.";
        }
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        try {
            console.log(selectedProject, 'svsvervrev');
            const response = await fetch("http://127.0.0.1:8000/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPassword,
                    role: newUserRole,
                    project_id: selectedProject,
                }),
            });
            if (response.ok) {
                fetchUsers();
                setShowNewUserModal(false);
                setNewUserEmail("");
                setNewUserPassword("");
                setNewUserRole("");
                setSelectedProject(null);
                setValidationErrors({});
            } else {
                console.error("Ошибка при добавлении нового пользователя");
            }
        } catch (error) {
            console.error("Ошибка при добавлении нового пользователя:", error);
        }
    };

    const addEmployeeToUsers = async () => {
        const errors = {};
        if (!newEmployeeRole.trim()) {
            errors.newEmployeeRole = "Поле обязательно для заполнения.";
        }
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        if (!selectedEmployee || !newEmployeeRole) return;
        try {
            const response = await fetch("http://127.0.0.1:8000/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: selectedEmployee.email,
                    role: newEmployeeRole,
                }),
            });
            if (response.ok) {
                fetchUsers();
                setShowAddEmployeeModal(false);
                setSelectedEmployee(null);
                setNewEmployeeRole("");
                setValidationErrors({});
            } else {
                console.error("Ошибка при добавлении сотрудника в пользователи");
            }
        } catch (error) {
            console.error("Ошибка при добавлении сотрудника:", error);
        }
    };

    const selectStyles = {
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#f6ce45' : provided.backgroundColor,
            color: state.isSelected ? 'black' : provided.color,
            '&:hover': {
                backgroundColor: 'rgba(246,206,69,0.64)',
                color: 'black',
            },
        }),
    };

    const projectOptions = projects.map((project) => ({
        value: project.id,
        label: project.name,
    }));

    return (
        <>
            <header className="app-header-admin">
                <button className="account-button" onClick={handleAccountClick}>
                    <FaRegUser />
                </button>
            </header>
            <div className="admin-page">
                <header className="admin-header">
                    <h1>Управление пользователями</h1>
                </header>

                {/* Кнопки переключения между подстраницами */}
                <div className="tab-buttons">
                    <button
                        className={activeTab === "employees" ? "active" : ""}
                        onClick={() => setActiveTab("employees")}
                    >
                        Сотрудники
                    </button>
                    <button
                        className={activeTab === "users" ? "active" : ""}
                        onClick={() => setActiveTab("users")}
                    >
                        Учетные записи
                    </button>
                </div>

                <div className="top-panel">
                    <input
                        type="text"
                        placeholder="Поиск"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {/* Кнопка создания пользователя показывается только на вкладке "Учетные записи" */}
                    {activeTab === "users" && (
                        <button
                            className="new-user-button"
                            onClick={() => setShowNewUserModal(true)}
                        >
                            Создать внешнюю учетную запись
                        </button>
                    )}
                </div>

                {/* Отображение таблицы в зависимости от активной вкладки */}
                {activeTab === "employees" && (
                    <div className="table-section">
                        <h2>Сотрудники</h2>
                        <table>
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Имя</th>
                                <th>Email</th>
                                <th>Отдел</th>
                                <th>Должность</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredEmployees.map((emp) => {
                                const hasAccount = users.some(
                                    (user) => user.email === emp.email
                                );
                                return (
                                    <tr key={emp.id}>
                                        <td>{emp.id}</td>
                                        <td>{emp.name}</td>
                                        <td>{emp.email}</td>
                                        <td>{emp.department}</td>
                                        <td>{emp.position}</td>
                                        <td>
                                            {!hasAccount ? (
                                                <button
                                                    className="create-exist-user-button"
                                                    onClick={() => {
                                                        setSelectedEmployee(emp);
                                                        setShowAddEmployeeModal(true);
                                                    }}
                                                >
                                                    Добавить в пользователи
                                                </button>
                                            ) : (
                                                <span>Учётная запись существует</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredEmployees.length === 0 && (
                                <tr>
                                    <td colSpan="6">Нет сотрудников</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "users" && (
                    <div className="table-section">
                        <h2>Учетные записи</h2>
                        <table>
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Имя пользователя</th>
                                <th>Email</th>
                                <th>Роль</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username || user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <Select
                                            options={roleOptions}
                                            value={roleOptions.find(
                                                (opt) => opt.value === updatedRoles[user.id]
                                            )}
                                            onChange={(option) =>
                                                setUpdatedRoles((prev) => ({
                                                    ...prev,
                                                    [user.id]: option.value,
                                                }))
                                            }
                                            menuPlacement="auto"
                                            styles={selectStyles}
                                            isSearchable={false}
                                        />
                                    </td>
                                    <td style={{ color: user.status === "logged_in" ? "green" : "red" }}>
                                        {loginOptions[user.status]}
                                    </td>
                                    <td>
                                        <button className="change-role-button" onClick={() => updateUserRole(user.id)}>
                                            Изменить роль
                                        </button>
                                        <button className="delete-user-button" onClick={() => deleteUser(user.id)}>
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="6">Нет пользователей</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Модальное окно для создания нового пользователя */}
                {showNewUserModal && (
                    <div className="modal-overlay" onClick={() => setShowNewUserModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Создание учетной записи</h2>
                            <label>Email</label>
                            <input
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => {
                                    setNewUserEmail(e.target.value);
                                    setValidationErrors(prev => ({ ...prev, newUserEmail: "" }));}
                                }
                            />
                            {validationErrors.newUserEmail && (
                                <div className="error-message">{validationErrors.newUserEmail}</div>
                            )}
                            <label>Пароль</label>
                            <input
                                type="password"
                                value={newUserPassword}
                                onChange={(e) => {
                                    setNewUserPassword(e.target.value);
                                    setValidationErrors(prev => ({ ...prev, newUserPassword: "" }));}
                                }
                            />
                            {validationErrors.newUserPassword && (
                                <div className="error-message">{validationErrors.newUserPassword}</div>
                            )}
                            <label>Проект</label>
                            <Select
                                options={projectOptions}
                                value={projectOptions.find(option => option.value === selectedProject)}
                                onChange={(option) => {
                                    setSelectedProject(option.value);
                                    setValidationErrors(prev => ({ ...prev, selectedProject: "" }));
                                }
                            }
                                placeholder="Выберите проект..."
                                menuPlacement="auto"
                                styles={selectStyles}
                                isSearchable={true}
                            />
                            {validationErrors.selectedProject && (
                                <div className="error-message">{validationErrors.selectedProject}</div>
                            )}
                            <label>Роль</label>
                            <label className="role">Заказчик</label>

                            <div className="modal-buttons">
                                <button className="create-user-button" onClick={addNewUser}>Создать</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Модальное окно для добавления сотрудника в пользователей */}
                {showAddEmployeeModal && (
                    <div
                        className="modal-overlay"
                        onClick={() => setShowAddEmployeeModal(false)}
                    >
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Создание учетной записи</h2>
                            <p>
                                Email: <strong>{selectedEmployee && selectedEmployee.email}</strong>
                            </p>
                            <label>Выберите роль</label>
                            <Select
                                options={roleOptions}
                                value={roleOptions.find((opt) => opt.value === newEmployeeRole)}
                                onChange={(option) => {
                                    setNewEmployeeRole(option.value);
                                    setValidationErrors(prev => ({ ...prev, newEmployeeRole: "" }));
                                }}
                                placeholder="Выберите роль..."
                                menuPlacement="auto"
                                styles={selectStyles}
                                isSearchable={false}
                            />
                            {validationErrors.newEmployeeRole && (
                                <div className="error-message">{validationErrors.newEmployeeRole}</div>
                            )}
                            <div className="modal-buttons">
                                <button className="create-user-button" onClick={addEmployeeToUsers}>Создать</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default AdminPage;

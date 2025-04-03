import React from "react";
import AuthForm from "../components/AuthForm";

const Login = () => {
    const handleLogin = (data) => {
        console.log("Login Data:", data);
    };

    return <AuthForm formType="login" onSubmit={handleLogin} />;
};

export default Login;

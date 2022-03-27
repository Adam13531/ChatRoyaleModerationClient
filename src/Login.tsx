import React, { useState } from "react";

interface LoginProps {
  onLogin: (name: string, password: string) => void;
}

function Login(props: LoginProps) {
  const { onLogin } = props;
  const [name, setName] = useState("");
  const [password, setPassword] = useState("hunter2");
  const login = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    onLogin(name, password);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div>
      <input
        type="text"
        id="name"
        placeholder="Name"
        value={name}
        onChange={handleNameChange}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={handlePasswordChange}
      />
      <button onClick={login}>Login</button>
    </div>
  );
}

export default Login;

import "./styles.scss";

import { GoogleLogo } from "phosphor-react";
import { GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { useState } from "react";

import { auth } from "../../lib/firebase-context";

export default function SignIn() {
  const [user, setUser] = useState<User | null>(null);

  async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);

      setUser(result.user);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="container">
      {user && (
        <div className="user">
          {user.photoURL && <img src={user.photoURL} alt="Foto do usuário" />}
          <strong>{user.displayName}</strong>
          <small>{user.email}</small>
        </div>
      )}

      <h1>Acesse sua conta</h1>

      <span>
        Utilizando autenticação social, como por exemplo, a autenticação com a
        Google, você <br /> facilita a vida do usuário permitindo utlizar sua
        aplicação sem fazer cadastro.
      </span>

      <button type="button" className="button" onClick={handleGoogleSignIn}>
        <GoogleLogo />
        Entrar com Google
      </button>
    </div>
  );
}
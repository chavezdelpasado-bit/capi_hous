// ===============================
// CAPI HOUSE - LOGIN
// ===============================
const form = document.getElementById("loginForm");
const message = document.getElementById("message");
const btnLogin = document.getElementById("btnLogin");
const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

// Mostrar / Ocultar contraseña
togglePassword.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
        togglePassword.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
        password.type = "password";
        togglePassword.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
});

// Login
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.innerHTML = "";
    message.style.color = "white";

    const login = document.getElementById("login").value.trim();
    const clave = document.getElementById("password").value.trim();
    const rol = document.getElementById("rol").value;

    if (!login || !clave || !rol) {
        message.style.color = "#ff6b6b";
        message.innerHTML = "Complete todos los campos.";
        return;
    }

    btnLogin.disabled = true;
    btnLogin.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Ingresando...
    `;

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                login,
                password: clave,
                rol
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        // Guardar sesión
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        message.style.color = "#6bff95";
        message.innerHTML = "Bienvenido...";

        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 800);
    }
    catch (error) {
        message.style.color = "#ff6b6b";
        message.innerHTML = error.message;
    }
    finally {
        btnLogin.disabled = false;
        btnLogin.innerHTML = `
            <span>Iniciar Sesión</span>
        `;
    }
});
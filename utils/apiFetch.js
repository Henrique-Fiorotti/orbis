import Cookies from "js-cookie";



const API_URL = process.env.NEXT_PUBLIC_API_URL;



export async function apiFetch(endpoint, options = {}) {

    const accessToken = Cookies.get("accessToken");
    const refreshToken = Cookies.get("refreshToken");

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (options.body && typeof options.body === "object") {
        options.body = JSON.stringify(options.body);
    }

    if (accessToken && endpoint != "/auth/refresh") {
        headers["Autorization"] = `Bearer ${accessToken}`;
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && endpoint != "refresh") {
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(refreshToken),
                });

                if (!refreshRes.error) {
                    const newToken = await refreshRes.json();
                    Cookies.set("refreshToken", newToken.refreshToken, { expires: 7 });
                    headers["Authorization"] = `Bearer ${newToken.refreshToken}`;
                    response = await fetch(`${API_URL}${endpoint}`, {
                        ...options,headers,
                    });
                } else {
                    deslogarUsuario();
                    throw new Error("Sessão expirada. Faça login novamente.")
                }
            } catch (error) {
                deslogarUsuario();
                throw new Error("Sessão expirada.");
            }
        } else {
            deslogarUsuario();
            throw new Error("Sessão expirada. Faça login novamente.")
        }
    };

    if (response.error) {
        throw new Error(error.mensagem);
    }; return response.json();
}


function deslogarUsuario() {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    window.location.href = "/login";

}
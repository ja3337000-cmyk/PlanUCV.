/* =====================================================
   PLANU+
   SISTEMA INTELIGENTE DE PLANIFICACIÓN ACADÉMICA
   SCRIPT PRINCIPAL
   ===================================================== */


/* =====================================================
   DATOS POR USUARIO
   ===================================================== */

function claveDatos(tipo, usuario = usuarioActual) {
    const nombre = String(usuario || "").trim().toLowerCase();
    return `planU_${tipo}_${encodeURIComponent(nombre)}`;
}

function obtenerProgresoInicial() {
    let guardado = null;

    try {
        guardado = JSON.parse(
            localStorage.getItem(claveDatos("progreso")) || "null"
        );
    } catch (error) {
        guardado = null;
    }

    return {
        cursos: guardado?.cursos === true,
        notas: guardado?.notas === true,
        perfil: guardado?.perfil === true,
        horario: guardado?.horario === true,
        recomendaciones: guardado?.recomendaciones === true
    };
}

let usuarioActual = localStorage.getItem("planU_usuario") || "";

let cursos = [];
let notas = [];
let perfil = {};

let horariosGenerados = [];
let cursoEditando = null;

function cargarCursosGuardados() {
    try {
        const guardados = JSON.parse(
            localStorage.getItem("planU_cursos") || "[]"
        );

        cursos = Array.isArray(guardados) ? guardados : [];
        mostrarCursos();
    } catch (error) {
        console.error("Error al cargar los cursos:", error);
        cursos = [];
    }
}

function cargarDatosDeUsuario(usuario) {
    if (!usuario) return;

    const claveCursos = claveDatos("cursos", usuario);
    const claveNotas = claveDatos("notas", usuario);
    const claveProgreso = claveDatos("progreso", usuario);
    const clavePerfil = claveDatos("perfil", usuario);

    // Migrar los datos antiguos una sola vez.
    if (!localStorage.getItem("planU_migracion_usuarios_v1")) {
        [
            ["planU_cursos", claveCursos],
            ["planU_notas", claveNotas],

        ].forEach(([anterior, nueva]) => {
            if (
                localStorage.getItem(nueva) === null &&
                localStorage.getItem(anterior) !== null
            ) {
                localStorage.setItem(
                    nueva,
                    localStorage.getItem(anterior)
                );
            }
        });

        localStorage.setItem(
            "planU_migracion_usuarios_v1",
            "true"
        );
    }

    // Recuperar el perfil que ya existía.
    const perfilAnterior =
        localStorage.getItem("planU_perfil_" + usuario);

    if (
        localStorage.getItem(clavePerfil) === null &&
        perfilAnterior !== null
    ) {
        localStorage.setItem(clavePerfil, perfilAnterior);
    }

    try {
        cursos = JSON.parse(
            localStorage.getItem(claveCursos)
        ) || [];
    } catch {
        cursos = [];
    }

    try {
        notas = JSON.parse(
            localStorage.getItem(claveNotas)
        ) || [];
    } catch {
        notas = [];
    }

    try {
        perfil = JSON.parse(
            localStorage.getItem(clavePerfil)
        ) || {};
    } catch {
        perfil = {};
    }

   try {
    const progresoGuardado = localStorage.getItem(claveProgreso);

    progreso = progresoGuardado
        ? JSON.parse(progresoGuardado)
        : {
            cursos: false,
            notas: false,
            perfil: false,
            horario: false,
            recomendaciones: false
        };
} catch {
    progreso = {
        cursos: false,
        notas: false,
        perfil: false,
        horario: false,
        recomendaciones: false
    };
}

    localStorage.setItem(claveCursos, JSON.stringify(cursos));
    localStorage.setItem(claveNotas, JSON.stringify(notas));
    localStorage.setItem(claveProgreso, JSON.stringify(progreso));
}



/* =====================================================
   PLAN UCV — FUNCIONES GRATUITAS
   ===================================================== */

function puedeGenerarHorario() {
    return true;
}

function registrarGeneracionHorario() {
    actualizarEstadoGeneraciones();
}

function actualizarEstadoGeneraciones() {
    const estado = document.getElementById("scheduleStatus");

    if (!estado) return;

    estado.textContent =
        "Generación de horarios gratuita e ilimitada";
}

function mostrarModalPremium() {
    // PLAN UCV no utiliza funciones Premium.
}

function cerrarModalPremium() {
    const modal = document.getElementById("premiumModal");

    if (modal) {
        modal.remove();
    }
}

/* =====================================================
   PROGRESO DEL ESTUDIANTE
   ===================================================== */


let progreso = obtenerProgresoInicial();



/* =====================================================
   ACTUALIZAR PROGRESO
   ===================================================== */

function actualizarProgreso() {

    const pasos = [
        progreso.cursos,
        progreso.notas,
        progreso.perfil,
        progreso.horario,
        progreso.recomendaciones
    ];

    const completados = pasos.filter(Boolean).length;
    const porcentaje = completados * 20;

    // Guardar el progreso del usuario actual
    localStorage.setItem(
        claveDatos("progreso"),
        JSON.stringify(progreso)
    );

    const barra = document.getElementById("profileProgress");
    const texto = document.getElementById("progressText");

    if (barra) {
        barra.style.width = `${porcentaje}%`;
    }

    if (texto) {
        texto.textContent = `${porcentaje}% perfil completado`;
    }
}



/* =====================================================
   INICIALIZAR PROGRESO
   ===================================================== */

function inicializarProgreso() {

    // Cargar el progreso del usuario que inició sesión
    progreso = obtenerProgresoInicial();

    // Actualizar la barra y guardar los datos del usuario
    actualizarProgreso();

}



/* =====================================================
   INICIO DE SESIÓN
   ===================================================== */

function configurarLogin() {

    const loginScreen = document.getElementById("loginScreen");
    const loginForm = document.getElementById("loginForm");

    if (!loginScreen) return;

    const sesionActiva =
        localStorage.getItem("planU_sesion") === "activa";

    if (sesionActiva) {
        mostrarAplicacion();
    } else {
        mostrarLogin();
    }

    if (loginForm) {

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();

            iniciarSesion();

        });

    }

}


function iniciarSesion() {

    const usuario =
        document.getElementById("loginUser")?.value.trim();

    const password =
        document.getElementById("loginPassword")?.value.trim();

    if (!usuario || !password) {
        mostrarToastLogin(
            "Completa tu usuario y contraseña."
        );
        return;
    }

    // Guardar la sesión del usuario
    usuarioActual = usuario;

    localStorage.setItem(
        "planU_sesion",
        "activa"
    );

    localStorage.setItem(
        "planU_usuario",
        usuario
    );

    
    // Cargar los datos exclusivos del usuario
    cargarDatosDeUsuario(usuarioActual);

    // Usar el nombre de inicio de sesión si no hay uno guardado
    if (!perfil.nombre) {
    perfil.nombre = usuarioActual;

    localStorage.setItem(
        claveDatos("perfil", usuarioActual),
        JSON.stringify(perfil)
    );
}

    // Inicializar el progreso
    inicializarProgreso();

    mostrarAplicacion();

}

function mostrarLogin() {

    const loginScreen =
        document.getElementById("loginScreen");

    const app =
        document.querySelector(".app");

    if (loginScreen) {

        loginScreen.style.display = "flex";
        loginScreen.style.visibility = "visible";
        loginScreen.style.opacity = "1";
        loginScreen.style.pointerEvents = "auto";

    }

    if (app) {

        app.style.display = "none";

    }

    document.body.classList.add("login-active");

}

function mostrarAplicacion() {
    const loginScreen = document.getElementById("loginScreen");
    const app = document.querySelector(".app");

    if (loginScreen) {
        loginScreen.style.display = "none";
        loginScreen.style.visibility = "hidden";
        loginScreen.style.opacity = "0";
        loginScreen.style.pointerEvents = "none";
    }

    if (app) {
        app.style.display = "";
    }

    document.body.classList.remove("login-active");

    // Recuperar el perfil del usuario actual.
    try {
        perfil = JSON.parse(
            localStorage.getItem(
                claveDatos("perfil", usuarioActual)
            )
        ) || {};
    } catch (error) {
        perfil = {};
    }

    cargarPerfil();
    actualizarProgreso();
    actualizarEstadoGeneraciones();
}



function cerrarSesion() {

    localStorage.removeItem("planU_sesion");
    localStorage.removeItem("planU_usuario");

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {
        loginForm.reset();
    }

    mostrarLogin();

}


function mostrarToastLogin(mensaje) {

    const loginScreen =
        document.getElementById("loginScreen");

    if (!loginScreen) return;

    let mensajeLogin =
        document.getElementById("loginMessage");

    if (!mensajeLogin) {

        mensajeLogin =
            document.createElement("div");

        mensajeLogin.id = "loginMessage";

        mensajeLogin.style.marginTop = "14px";
        mensajeLogin.style.padding = "10px 12px";
        mensajeLogin.style.borderRadius = "10px";
        mensajeLogin.style.background = "#fff1f1";
        mensajeLogin.style.color = "#c62828";
        mensajeLogin.style.fontSize = "13px";
        mensajeLogin.style.textAlign = "center";

        const form =
            document.getElementById("loginForm");

        if (form) {
            form.appendChild(mensajeLogin);
        }

    }

    mensajeLogin.textContent = mensaje;

}


/* =====================================================
   COLORES
   ===================================================== */

const coloresCursos = [
    "",
    "green",
    "pink",
    "orange",
    "blue"
];


/* =====================================================
   LIBROS
   ===================================================== */

const libros = [
    {
        titulo: "Artificial Intelligence: A Modern Approach",
        autor: "Stuart Russell & Peter Norvig",
        categoria: "ia",
        icono: "🤖",
        descripcion: "Fundamentos de inteligencia artificial y sistemas inteligentes.",
        url: "https://aima.cs.berkeley.edu/"
    },
    {
        titulo: "Python for Data Analysis",
        autor: "Wes McKinney",
        categoria: "datos",
        icono: "🐍",
        descripcion: "Análisis de datos utilizando Python, NumPy y pandas.",
        url: "https://wesmckinney.com/book/"
    },
    {
        titulo: "Clean Code",
        autor: "Robert C. Martin",
        categoria: "programacion",
        icono: "💻",
        descripcion: "Buenas prácticas para escribir código limpio y mantenible.",
        url: "https://www.oreilly.com/library/view/clean-code-a/9780136083238/"
    },
    {
        titulo: "HTML and CSS: Design and Build Websites",
        autor: "Jon Duckett",
        categoria: "diseno",
        icono: "🌐",
        descripcion: "Introducción práctica al desarrollo y diseño web.",
        url: "https://www.htmlandcssbook.com/"
    },
    {
        titulo: "Computer Networking: A Top-Down Approach",
        autor: "James Kurose & Keith Ross",
        categoria: "tecnologia",
        icono: "🌐",
        descripcion: "Conceptos fundamentales de redes de computadoras.",
        url: "https://gaia.cs.umass.edu/kurose_ross/index.php"
    },
    {
        titulo: "Computer Security: Principles and Practice",
        autor: "William Stallings",
        categoria: "tecnologia",
        icono: "🔐",
        descripcion: "Principios fundamentales de seguridad informática.",
        url: "https://www.pearson.com/en-us/subject-catalog/p/computer-security-principles-and-practice/P200000003271"
    }
];


/* =====================================================
   RECOMENDACIONES
   ===================================================== */

const recomendaciones = [
    {
        titulo: "Inteligencia Artificial",
        descripcion: "Explora fundamentos y aplicaciones de la IA.",
        categoria: "ia",
        icono: "🤖",
        match: 96
    },
    {
        titulo: "Programación",
        descripcion: "Fortalece tus habilidades para desarrollar software.",
        categoria: "programacion",
        icono: "💻",
        match: 94
    },
    {
        titulo: "Ciencia de Datos",
        descripcion: "Aprende a analizar información y encontrar patrones.",
        categoria: "datos",
        icono: "📊",
        match: 91
    },
    {
        titulo: "Desarrollo Web",
        descripcion: "Construye sitios y aplicaciones web modernas.",
        categoria: "diseno",
        icono: "🌐",
        match: 88
    },
    {
        titulo: "Tecnología",
        descripcion: "Descubre nuevas herramientas y tendencias tecnológicas.",
        categoria: "tecnologia",
        icono: "⚙️",
        match: 86
    },
    {
        titulo: "Diseño de Interfaces",
        descripcion: "Mejora la experiencia y usabilidad de tus aplicaciones.",
        categoria: "diseno",
        icono: "🎨",
        match: 84
    }
];


/* =====================================================
   INICIO
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    configurarLogin();
    inicializarProgreso();
    actualizarEstadoGeneraciones();

    configurarNavegacion();
    configurarTabs();
    configurarNotificaciones();
    configurarMenuUsuario();
    configurarFormularios();

    cargarPerfil();
    mostrarCursos();
    mostrarLibrosRecomendados();
    generarRecomendaciones();
    mostrarNotas();
    actualizarInicio();

    const topSearch = document.querySelector(".top-search input");

    if (topSearch) {
        topSearch.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                buscarGlobal(topSearch.value);
            }
        });
    }

});


/* =====================================================
   FORMULARIOS
   ===================================================== */

function configurarFormularios() {

    const formularioNota = document.getElementById("gradeForm");

    if (formularioNota) {
        formularioNota.addEventListener("submit", guardarNota);
    }

}


/* =====================================================
   NAVEGACIÓN
   ===================================================== */

function configurarNavegacion() {

    document.querySelectorAll(".nav-item").forEach(button => {

        button.addEventListener("click", () => {

            const destino = button.dataset.section;

            if (!destino) return;

            document.querySelectorAll(".nav-item").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            document.querySelectorAll(".section").forEach(section => {
                section.classList.remove("active-section");
            });

            const section = document.getElementById(destino);

            if (section) {
                section.classList.add("active-section");
            }

            if (destino === "recomendaciones") {

                progreso.recomendaciones = true;

                actualizarProgreso();

            }

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });

    });

}


function goToSection(nombre) {

    const boton = document.querySelector(
        `.nav-item[data-section="${nombre}"]`
    );

    if (boton) {
        boton.click();
    }

}


/* =====================================================
   TABS
   ===================================================== */

function configurarTabs() {

    document.querySelectorAll(".tab").forEach(tab => {

        tab.addEventListener("click", () => {

            const destino = tab.dataset.tab;

            document.querySelectorAll(".tab").forEach(t => {
                t.classList.remove("active");
            });

            tab.classList.add("active");

            document.querySelectorAll(".tab-content").forEach(content => {
                content.classList.remove("active");
            });

            const contenido = document.getElementById(
                destino + "Tab"
            );

            if (contenido) {
                contenido.classList.add("active");
            }

            if (destino === "libros") {
                mostrarTodosLosLibros();
            }

            if (destino === "materias") {
                generarRecomendaciones();
                mostrarLibrosRecomendados();
            }

        });

    });

}


/* =====================================================
   RECOMENDACIONES
   ===================================================== */

function obtenerIntereses() {

    const checks = document.querySelectorAll(
        '#recomendaciones input[type="checkbox"]'
    );

    return Array.from(checks)
        .filter(input => input.checked)
        .map(input => input.value);

}


function generarRecomendaciones() {

    const contenedor = document.getElementById(
        "subjectRecommendations"
    );

    if (!contenedor) return;

    const intereses = obtenerIntereses();

    let resultados = recomendaciones.filter(item =>
        intereses.includes(item.categoria)
    );

    if (resultados.length === 0) {
        resultados = recomendaciones.slice(0, 4);
    }

    resultados.sort((a, b) => b.match - a.match);

    contenedor.innerHTML = resultados.map(item => `

        <div class="recommendation-card">

            <div class="recommendation-icon">
                ${item.icono}
            </div>

            <div>
                <h3>${item.titulo}</h3>
                <p>${item.descripcion}</p>
            </div>

            <div class="match">
                ${item.match}% coincidencia
            </div>

            <button
                class="arrow-btn"
                onclick="seleccionarRecomendacion('${item.titulo}')"
                type="button"
            >
                →
            </button>

        </div>

    `).join("");

}


function seleccionarRecomendacion(nombre) {

    mostrarToast(
        `Recomendación seleccionada: ${nombre}`
    );

}


/* =====================================================
   LIBROS
   GOOGLE BOOKS API
   ===================================================== */

function obtenerLibrosPorIntereses() {

    const intereses = obtenerIntereses();

    let resultados = libros.filter(libro =>
        intereses.includes(libro.categoria)
    );

    if (resultados.length === 0) {
        resultados = libros.slice(0, 3);
    }

    return resultados;

}


/* =====================================================
   MOSTRAR LIBROS RECOMENDADOS
   ===================================================== */

async function mostrarLibrosRecomendados() {

    const contenedor = document.getElementById(
        "bookPreview"
    );

    if (!contenedor) return;

    const seleccionados = obtenerLibrosPorIntereses().slice(0, 3);

    contenedor.innerHTML = `

        <div class="subsection-title">
            Libros recomendados para ti
        </div>

        <div class="book-row">

            ${seleccionados.map(libro => `

                <div class="book-card">

                    <div class="book-cover">
                        ${libro.icono}
                    </div>

                    <strong title="${libro.titulo}">
                        ${libro.titulo}
                    </strong>

                    <small>
                        ${libro.autor}
                    </small>

                </div>

            `).join("")}

        </div>

    `;

    try {

        const intereses = obtenerIntereses();

        let consulta = "computer science";

        if (intereses.includes("ia")) {
            consulta = "artificial intelligence";
        } else if (intereses.includes("programacion")) {
            consulta = "programming computer science";
        } else if (intereses.includes("datos")) {
            consulta = "data science";
        } else if (intereses.includes("diseno")) {
            consulta = "web design";
        } else if (intereses.includes("tecnologia")) {
            consulta = "technology computer science";
        }

        const resultados = await consultarGoogleBooks(
            consulta,
            3
        );

        if (resultados.length > 0) {

            contenedor.innerHTML = `

                <div class="subsection-title">
                    Libros recomendados para ti
                </div>

                <div class="book-row">

                    ${resultados.map(libro =>
                        crearLibroPreviewHTML(libro)
                    ).join("")}

                </div>

            `;

        }

    } catch (error) {

        console.warn(
            "Google Books no disponible. Se mantienen las recomendaciones locales.",
            error
        );

    }

}


/* =====================================================
   GOOGLE BOOKS
   ===================================================== */

async function consultarGoogleBooks(
    consulta,
    cantidad = 6
) {

    const url =
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(consulta)}&maxResults=${cantidad}&langRestrict=es`;

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error(
            "No se pudo conectar con Google Books."
        );
    }

    const datos = await respuesta.json();

    if (!datos.items) {
        return [];
    }

    return datos.items.map(item => {

        const info = item.volumeInfo || {};

        const autores =
            info.authors?.join(", ") ||
            "Autor no disponible";

        const imagen =
            info.imageLinks?.thumbnail ||
            info.imageLinks?.smallThumbnail ||
            "";

        return {

            id: item.id,

            titulo:
                info.title ||
                "Libro sin título",

            autor:
                autores,

            descripcion:
                info.description ||
                "No hay descripción disponible.",

            imagen:
                imagen.replace(
                    "http://",
                    "https://"
                ),

            url:
                info.previewLink ||
                `https://books.google.com/books?id=${item.id}`,

            categoria:
                info.categories?.join(", ") ||
                "Libro académico"

        };

    });

}


/* =====================================================
   HTML LIBRO PREVIEW
   ===================================================== */

function crearLibroPreviewHTML(libro) {

    const portada = libro.imagen
        ? `
            <img
                src="${libro.imagen}"
                alt="Portada de ${escaparHTML(libro.titulo)}"
                loading="lazy"
            >
          `
        : "📚";

    return `

        <div class="book-card">

            <div class="book-cover">

                ${portada}

            </div>

            <strong
                title="${escaparHTML(libro.titulo)}"
            >
                ${escaparHTML(libro.titulo)}
            </strong>

            <small>
                ${escaparHTML(libro.autor)}
            </small>

            <a
                href="${libro.url}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                    display:inline-block;
                    margin-top:8px;
                    text-decoration:none;
                "
            >
                Ver libro →
            </a>

        </div>

    `;

}


/* =====================================================
   MOSTRAR TODOS LOS LIBROS
   ===================================================== */

async function mostrarTodosLosLibros() {
    const contenedor = document.getElementById("bookResults");

    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="empty-box">
            📚
            <strong>Explorando la biblioteca...</strong>
            <span>Buscando libros de distintas áreas académicas.</span>
        </div>
    `;

    try {
        const temas = [
            "programming computer science",
            "mathematics",
            "artificial intelligence",
            "engineering",
            "study skills"
        ];

        const consultas = temas.map(tema =>
            consultarGoogleBooks(tema, 4)
        );

        const resultadosPorTema = await Promise.all(consultas);
        const vistos = new Set();

        const libros = resultadosPorTema
            .flat()
            .filter(libro => {
                const clave = libro.id || libro.title || libro.titulo;

                if (!clave || vistos.has(clave)) return false;

                vistos.add(clave);
                return true;
            });

        if (libros.length > 0) {
            contenedor.innerHTML = libros
                .map(libro => crearLibroResourceHTML(libro))
                .join("");
        } else {
            mostrarLibrosLocales();
        }
    } catch (error) {
        console.warn("Error al cargar libros:", error);
        mostrarLibrosLocales();
    }
}



/* =====================================================
   LIBROS LOCALES - RESPALDO
   ===================================================== */

function mostrarLibrosLocales() {

    const contenedor = document.getElementById(
        "bookResults"
    );

    if (!contenedor) return;

    contenedor.innerHTML = libros.map(libro => `

        <div class="resource-card">

            <div class="book-cover">
                ${libro.icono}
            </div>

            <h3>
                ${libro.titulo}
            </h3>

            <p>
                <strong>Autor:</strong>
                ${libro.autor}
            </p>

            <p>
                ${libro.descripcion}
            </p>

            <a
                href="${libro.url}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Ver libro →
            </a>

        </div>

    `).join("");

}


/* =====================================================
   CREAR TARJETA GOOGLE BOOKS
   ===================================================== */

function crearLibroResourceHTML(libro) {

    const portada = libro.imagen
        ? `
            <img
                src="${libro.imagen}"
                alt="Portada de ${escaparHTML(libro.titulo)}"
                loading="lazy"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:10px;
                "
            >
          `
        : "📚";

    const descripcion = libro.descripcion.length > 180
        ? libro.descripcion.substring(0, 180) + "..."
        : libro.descripcion;

    return `

        <div class="resource-card">

            <div
                class="book-cover"
                style="
                    min-height:190px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    overflow:hidden;
                "
            >
                ${portada}
            </div>

            <h3>
                ${escaparHTML(libro.titulo)}
            </h3>

            <p>
                <strong>Autor:</strong>
                ${escaparHTML(libro.autor)}
            </p>

            <p>
                ${escaparHTML(descripcion)}
            </p>

            <p>
                <small>
                    ${escaparHTML(libro.categoria)}
                </small>
            </p>

            <a
                href="${libro.url}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Ver en Google Books →
            </a>

        </div>

    `;

}


/* =====================================================
   BUSCAR LIBROS EN GOOGLE BOOKS
   ===================================================== */

async function buscarLibros() {

    const input = document.getElementById("bookSearch");
    const contenedor = document.getElementById("bookResults");

    if (!input || !contenedor) return;

    const texto = input.value.trim();

    if (!texto) {

        mostrarTodosLosLibros();

        return;

    }

    contenedor.innerHTML = `

        <div class="empty-box">

            🔎

            <strong>
                Buscando "${escaparHTML(texto)}"...
            </strong>

            <span>
                Consultando Google Books.
            </span>

        </div>

    `;

    try {

        const resultados =
            await consultarGoogleBooks(
                texto,
                12
            );

        if (resultados.length === 0) {

            contenedor.innerHTML = `

                <div class="empty-box">

                    📚

                    <strong>
                        No encontramos libros
                    </strong>

                    <span>
                        Prueba con otro término de búsqueda.
                    </span>

                </div>

            `;

            return;

        }

        contenedor.innerHTML = resultados
            .map(libro => crearLibroResourceHTML(libro))
            .join("");

    } catch (error) {

        console.error(
            "Error Google Books:",
            error
        );

        contenedor.innerHTML = `

            <div class="empty-box">

                ⚠️

                <strong>
                    No se pudo conectar con Google Books
                </strong>

                <span>
                    Mostrando libros disponibles localmente.
                </span>

            </div>

        `;

        setTimeout(() => {
            mostrarLibrosLocales();
        }, 800);

    }

}


/* =====================================================
   ESCAPAR HTML
   ===================================================== */

function escaparHTML(texto) {

    return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================================
   ARTÍCULOS
   ===================================================== */

const articulos = [

    {
        titulo: "Artificial Intelligence",
        descripcion: "Recursos y publicaciones relacionadas con inteligencia artificial.",
        categoria: "ia"
    },

    {
        titulo: "Software Engineering",
        descripcion: "Material académico relacionado con desarrollo de software.",
        categoria: "programacion"
    },

    {
        titulo: "Data Science",
        descripcion: "Recursos sobre análisis de datos y aprendizaje automático.",
        categoria: "datos"
    }

];


function buscarArticulos() {

    const input = document.getElementById("articleSearch");
    const contenedor = document.getElementById("articleResults");

    if (!input || !contenedor) return;

    const texto = input.value.trim().toLowerCase();

    const resultados = texto
        ? articulos.filter(a =>
            a.titulo.toLowerCase().includes(texto) ||
            a.descripcion.toLowerCase().includes(texto) ||
            a.categoria.toLowerCase().includes(texto)
        )
        : articulos;

    if (resultados.length === 0) {

        contenedor.innerHTML = `
            <div class="empty-box">
                📰
                <strong>No encontramos resultados</strong>
                <span>Prueba con otra búsqueda.</span>
            </div>
        `;

        return;
    }

    contenedor.innerHTML = resultados.map(a => `

        <div class="resource-card article-card">

            <h3>${a.titulo}</h3>

            <p>
                ${a.descripcion}
            </p>

            <a
                href="https://scholar.google.com/scholar?q=${encodeURIComponent(a.titulo)}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Buscar publicaciones →
            </a>

        </div>

    `).join("");

}


/* =====================================================
   CURSOS
   ===================================================== */

function mostrarCursos() {

    const grupoCursos = document.querySelector(".course-group");

    if (!grupoCursos) return;

    grupoCursos.innerHTML = "";

    if (cursos.length === 0) {

        grupoCursos.innerHTML = `
            <div
                class="empty-box"
                style="min-height:130px;"
            >
                📚
                <strong>
                    Todavía no tienes cursos
                </strong>
                <span>
                    Agrega tus cursos para comenzar a crear horarios.
                </span>
            </div>
        `;

        return;
    }

    cursos.forEach(curso => {

        const contenedor = document.createElement("div");

        contenedor.className = "course-check";

        contenedor.style.display = "flex";
        contenedor.style.alignItems = "center";
        contenedor.style.justifyContent = "space-between";
        contenedor.style.gap = "12px";

        contenedor.innerHTML = `

            <label
                style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                    flex:1;
                    cursor:pointer;
                "
            >

                <input
                    type="checkbox"
                    class="schedule-course"
                    value="${curso.id}"
                    checked
                >

                <span>

                    <strong>
                        ${curso.nombre}
                    </strong>

                    <small
                        style="
                            display:block;
                            margin-top:3px;
                            opacity:.65;
                        "
                    >
                        ${curso.dia} · ${curso.inicio} - ${curso.fin}
                    </small>

                </span>

            </label>

            <button
                type="button"
                onclick="eliminarCurso(${curso.id})"
                style="
                    border:none;
                    background:#ffe5e5;
                    color:#c62828;
                    border-radius:8px;
                    padding:7px 10px;
                    cursor:pointer;
                    font-weight:700;
                    flex-shrink:0;
                "
                title="Eliminar curso"
            >
                🗑️
            </button>

        `;

        grupoCursos.appendChild(contenedor);

    });

}


/* =====================================================
   MODAL CURSO
   ===================================================== */

function abrirModalCurso() {

    const modal = document.getElementById("courseModal");
    const form = document.getElementById("courseForm");

    if (!modal) return;

    cursoEditando = null;

    if (form) {
        form.reset();
    }

    modal.classList.add("show");

}


function cerrarModalCurso() {

    const modal = document.getElementById("courseModal");

    if (modal) {
        modal.classList.remove("show");
    }

    cursoEditando = null;

}


/* =====================================================
   GUARDAR CURSO
   ===================================================== */

function guardarCurso(event) {

    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const nombre = document.getElementById("courseName")?.value.trim();
    const profesor = document.getElementById("courseTeacher")?.value.trim();
    const dia = document.getElementById("courseDay")?.value;
    const inicio = document.getElementById("courseStart")?.value;
    const fin = document.getElementById("courseEnd")?.value;

    if (!nombre) {

        mostrarToast("Escribe el nombre de la materia.");
        return false;

    }

    if (!dia || !inicio || !fin) {

        mostrarToast("Completa los datos del horario.");
        return false;

    }

    const horaInicio = Number(inicio);
    const horaFin = Number(fin);

    if (
        Number.isNaN(horaInicio) ||
        Number.isNaN(horaFin)
    ) {

        mostrarToast("Selecciona correctamente las horas.");
        return false;

    }

    if (horaFin <= horaInicio) {

        mostrarToast(
            "La hora de inicio debe ser menor que la hora final."
        );

        return false;

    }

    const curso = {

        id: Date.now(),

        nombre: nombre,

        profesor:
            profesor || "Profesor no registrado",

        dia: dia,

        inicio:
            `${String(horaInicio).padStart(2, "0")}:00`,

        fin:
            `${String(horaFin).padStart(2, "0")}:00`

    };

    cursos.push(curso);

    /* PROGRESO */
    progreso.cursos = true;
    actualizarProgreso();

    localStorage.setItem(
        "planU_cursos",
        JSON.stringify(cursos)
    );

    mostrarCursos();
    actualizarInicio();
    cerrarModalCurso();

    mostrarToast(
        `Curso "${nombre}" agregado correctamente.`
    );

    return false;

}


/* =====================================================
   ELIMINAR CURSO
   ===================================================== */

function eliminarCurso(id) {

    const curso = cursos.find(
        item => Number(item.id) === Number(id)
    );

    if (!curso) return;

    const confirmar = confirm(
        `¿Quieres eliminar el curso "${curso.nombre}"?`
    );

    if (!confirmar) return;

    cursos = cursos.filter(
        item => Number(item.id) !== Number(id)
    );

    localStorage.setItem(
        "planU_cursos",
        JSON.stringify(cursos)
    );

    horariosGenerados = [];

    mostrarCursos();
    actualizarInicio();

    mostrarEstadoHorario(
        "Curso eliminado. Puedes generar nuevamente tus horarios."
    );

    mostrarToast(
        `Curso "${curso.nombre}" eliminado.`
    );

}


/* =====================================================
   NOTAS
   ===================================================== */

function abrirModalNota() {

    const modal = document.getElementById("gradeModal");
    const form = document.getElementById("gradeForm");

    if (form) {
        form.reset();
    }

    if (modal) {
        modal.classList.add("show");
    }

}


function cerrarModalNota() {

    const modal = document.getElementById("gradeModal");

    if (modal) {
        modal.classList.remove("show");
    }

}


function guardarNota(event) {

    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const nombre = document.getElementById("gradeName")?.value.trim();

    const valor = Number(
        document.getElementById("gradeValue")?.value
    );

    if (!nombre || Number.isNaN(valor)) {

        mostrarToast(
            "Completa los datos de la nota."
        );

        return;

    }

    notas.push({
        id: Date.now(),
        nombre: nombre,
        valor: valor
    });

    /* PROGRESO */
    progreso.notas = true;
    actualizarProgreso();

    localStorage.setItem(
        "planU_notas",
        JSON.stringify(notas)
    );

    mostrarNotas();
    cerrarModalNota();
    actualizarInicio();

    mostrarToast(
        "Nota agregada correctamente."
    );

}


/* =====================================================
   MOSTRAR NOTAS
   ===================================================== */

function mostrarNotas() {

    const contenedor = document.getElementById("gradesList");

    if (!contenedor) return;

    if (notas.length === 0) {

        contenedor.innerHTML = `
            <div>
                <span>
                    Aún no hay notas registradas.
                </span>
            </div>
        `;

        return;
    }

    contenedor.innerHTML = notas.map(nota => `

        <div>

            <span>
                ${nota.nombre}
            </span>

            <b>
                ${nota.valor}
            </b>

        </div>

    `).join("");

}


/* =====================================================
   GENERADOR DE HORARIOS
   ===================================================== */

function generarHorarios() {

    console.log("PlanU+: generando horarios...");

    const checkboxes = document.querySelectorAll(
        ".course-group input[type='checkbox']:checked"
    );

    const seleccionados = Array.from(checkboxes).map(
        input => Number(input.value)
    );

    console.log(
        "Cursos seleccionados:",
        seleccionados
    );

    if (seleccionados.length === 0) {

        mostrarEstadoHorario(
            "Agrega y selecciona al menos un curso."
        );

        return;

    }

    const cursosSeleccionados = cursos.filter(curso =>
        seleccionados.includes(Number(curso.id))
    );

    console.log(
        "Cursos encontrados:",
        cursosSeleccionados
    );

    if (cursosSeleccionados.length === 0) {

        mostrarEstadoHorario(
            "No se encontraron los cursos seleccionados."
        );

        return;

    }

    /* =================================================
       COMPROBAR PLAN GRATUITO / PREMIUM
       ================================================= */

    if (!puedeGenerarHorario()) {
        return;
    }

    registrarGeneracionHorario();

    /* =================================================
       GENERAR HORARIOS
       ================================================= */

    const restricciones =
        obtenerRestricciones();

    horariosGenerados =
        generarCombinaciones(
            cursosSeleccionados,
            restricciones,
            20
        );

    console.log(
        "Horarios generados:",
        horariosGenerados
    );

    mostrarHorarios(
        horariosGenerados
    );

    /* PROGRESO */

    if (horariosGenerados.length > 0) {

        progreso.horario = true;

        actualizarProgreso();

    }

    /* Mostrar contador */

    actualizarEstadoGeneraciones();

}


/* =====================================================
   RESTRICCIONES
   ===================================================== */

function obtenerRestricciones() {

    const dias = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes"
    ];

    const ids = [
        "noLunes",
        "noMartes",
        "noMiercoles",
        "noJueves",
        "noViernes"
    ];

    return {

        noTarde:
            document.getElementById("noTarde")?.checked || false,

        noTemprano:
            document.getElementById("noTemprano")?.checked || false,

        sinHuecos:
            document.getElementById("sinHuecos")?.checked || false,

        maxClasesDia:
            Number(
                document.getElementById("maxClasesDia")?.value || 0
            ),

        diasBloqueados:
            dias.filter((dia, index) =>
                document.getElementById(ids[index])?.checked
            )

    };

}


/* =====================================================
   BACKTRACKING
   ===================================================== */

function generarCombinaciones(
    lista,
    restricciones,
    limite
) {

    const resultados = [];

    function backtracking(indice, actual) {

        if (resultados.length >= limite) {
            return;
        }

        if (indice >= lista.length) {

            if (
                cumpleRestricciones(
                    actual,
                    restricciones
                )
            ) {

                resultados.push(
                    actual.map(item => ({
                        ...item
                    }))
                );

            }

            return;
        }

        const curso = lista[indice];

        const opcionesDia = curso.dia
            ? [curso.dia]
            : [
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes"
            ];

        for (const dia of opcionesDia) {

            if (
                restricciones.diasBloqueados.includes(dia)
            ) {
                continue;
            }

            const horaInicio = convertirHora(curso.inicio);

            if (
                restricciones.noTarde &&
                horaInicio >= 13
            ) {
                continue;
            }

            if (
                restricciones.noTemprano &&
                horaInicio < 9
            ) {
                continue;
            }

            const candidato = {
                ...curso,
                dia: dia
            };

            let conflicto = false;

            for (const existente of actual) {

                if (
                    existente.dia === candidato.dia &&
                    hayCruce(existente, candidato)
                ) {

                    conflicto = true;
                    break;

                }

            }

            if (conflicto) {
                continue;
            }

            actual.push(candidato);

            if (
                cumpleMaximoClases(
                    actual,
                    restricciones
                )
            ) {

                backtracking(
                    indice + 1,
                    actual
                );

            }

            actual.pop();

        }

    }

    backtracking(0, []);

    return resultados;

}


/* =====================================================
   DETECTAR CRUCES
   ===================================================== */

function hayCruce(a, b) {

    const inicioA = convertirHora(a.inicio);
    const finA = convertirHora(a.fin);

    const inicioB = convertirHora(b.inicio);
    const finB = convertirHora(b.fin);

    return (
        inicioA < finB &&
        inicioB < finA
    );

}


function convertirHora(hora) {

    if (typeof hora === "number") {
        return hora;
    }

    if (typeof hora === "string") {

        const partes = hora.split(":");

        const valor = Number(partes[0]);

        return Number.isNaN(valor) ? 0 : valor;

    }

    return 0;

}


/* =====================================================
   MÁXIMO DE CLASES
   ===================================================== */

function cumpleMaximoClases(
    horario,
    restricciones
) {

    if (!restricciones.maxClasesDia) {
        return true;
    }

    const contador = {};

    horario.forEach(curso => {

        contador[curso.dia] =
            (contador[curso.dia] || 0) + 1;

    });

    return Object.values(contador).every(total =>
        total <= restricciones.maxClasesDia
    );

}


/* =====================================================
   RESTRICCIONES COMPLETAS
   ===================================================== */

function cumpleRestricciones(
    horario,
    restricciones
) {

    if (
        !cumpleMaximoClases(
            horario,
            restricciones
        )
    ) {
        return false;
    }

    if (restricciones.sinHuecos) {

        const porDia = {};

        horario.forEach(curso => {

            if (!porDia[curso.dia]) {
                porDia[curso.dia] = [];
            }

            porDia[curso.dia].push(curso);

        });

        for (const dia in porDia) {

            const clases = porDia[dia].sort(
                (a, b) =>
                    convertirHora(a.inicio) -
                    convertirHora(b.inicio)
            );

            for (
                let i = 0;
                i < clases.length - 1;
                i++
            ) {

                if (
                    convertirHora(clases[i].fin) !==
                    convertirHora(clases[i + 1].inicio)
                ) {

                    return false;

                }

            }

        }

    }

    return true;

}


/* =====================================================
   ESTADO HORARIO
   ===================================================== */

function mostrarEstadoHorario(texto) {

    const estado = document.getElementById(
        "scheduleStatus"
    );

    if (estado) {
        estado.textContent = texto;
    }

    const contador = document.getElementById(
        "scheduleCounter"
    );

    if (contador) {
        contador.textContent = "0 opciones";
    }

    const contenedor = document.getElementById(
        "scheduleOptions"
    );

    if (contenedor) {

        contenedor.innerHTML = `
            <div class="schedule-placeholder">

                📅

                <strong>
                    ${texto}
                </strong>

                <span>
                    Agrega tus cursos y configura tus restricciones.
                </span>

            </div>
        `;

    }

}


/* =====================================================
   MOSTRAR HORARIOS
   ===================================================== */

function mostrarHorarios(horarios) {

    const estado = document.getElementById(
        "scheduleStatus"
    );

    const contador = document.getElementById(
        "scheduleCounter"
    );

    const contenedor = document.getElementById(
        "scheduleOptions"
    );

    if (!contenedor) return;

    if (horarios.length === 0) {

        if (estado) {
            estado.textContent =
                "No se encontró una combinación compatible con tus restricciones.";
        }

        if (contador) {
            contador.textContent = "0 opciones";
        }

        contenedor.innerHTML = `
            <div class="schedule-placeholder">

                ⚠️

                <strong>
                    No hay horarios compatibles
                </strong>

                <span>
                    Prueba quitando alguna restricción.
                </span>

            </div>
        `;

        return;
    }

    if (estado) {
        estado.textContent =
            "Horarios generados correctamente sin cruces.";
    }

    if (contador) {
        contador.textContent =
            `${horarios.length} opciones`;
    }

    contenedor.innerHTML = horarios
        .map((horario, index) =>
            crearHorarioHTML(horario, index)
        )
        .join("");

}


/* =====================================================
   CREAR HORARIO VISUAL
   ===================================================== */

function crearHorarioHTML(
    horario,
    numero
) {

    const dias = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes"
    ];

    const horas = [];

    for (let h = 7; h <= 20; h++) {

        horas.push(
            `${String(h).padStart(2, "0")}:00`
        );

    }

    let html = `

        <div class="schedule-option">

            <div class="schedule-option-head">

                <strong>
                    Opción ${numero + 1}
                </strong>

                <span class="valid-badge">
                    SIN CRUCES
                </span>

            </div>

            <div class="schedule-table">

                <div class="schedule-header">
                    Hora
                </div>

                ${dias.map(dia => `

                    <div class="schedule-header">
                        ${dia.substring(0, 3)}
                    </div>

                `).join("")}

    `;

    horas.forEach(hora => {

        html += `

            <div class="time-cell">
                ${hora}
            </div>

        `;

        dias.forEach(dia => {

            const curso = horario.find(item =>

                item.dia === dia &&

                convertirHora(item.inicio) <=
                convertirHora(hora) &&

                convertirHora(item.fin) >
                convertirHora(hora)

            );

            if (curso) {

                const indiceCurso =
                    horario.findIndex(
                        item =>
                            item.id === curso.id
                    );

                const color =
                    coloresCursos[
                        (indiceCurso + 1) %
                        coloresCursos.length
                    ];

                html += `

                    <div
                        class="class-cell ${color}"
                    >

                        ${curso.nombre}

                        <small>
                            ${curso.inicio}
                            -
                            ${curso.fin}
                        </small>

                    </div>

                `;

            } else {

                html += `<div></div>`;

            }

        });

    });

    html += `

            </div>

        </div>

    `;

    return html;

}


/* =====================================================
   APOYO ACADÉMICO
   ===================================================== */

function buscarTemaAcademico() {

    const input = document.getElementById(
        "academicSearch"
    );

    if (!input) return;

    const texto = input.value.trim();

    if (!texto) {

        mostrarToast(
            "Escribe un tema académico."
        );

        return;

    }

    seleccionarTema(texto);

}


function seleccionarTema(tema) {

    const titulo = document.getElementById(
        "summaryTitle"
    );

    const contenido = document.getElementById(
        "summaryContent"
    );

    if (titulo) {
        titulo.textContent = tema;
    }

    if (contenido) {

        contenido.innerHTML = `

            <p>

                <strong>
                    ${tema}
                </strong>

                es un tema que puede estudiarse
                mediante conceptos fundamentales,
                ejemplos prácticos y recursos
                académicos.

            </p>

            <p>

                PlanU+ puede ayudarte a organizar
                el estudio del tema y encontrar
                recursos relacionados.

            </p>

            <div class="summary-highlight">

                💡 Recomendación:
                divide el tema en conceptos
                pequeños y estudia uno por uno.

            </div>

        `;

    }

}


function generarResumenCompleto() {

    const titulo = document.getElementById(
        "summaryTitle"
    )?.textContent?.trim();

    const contenido = document.getElementById(
        "summaryContent"
    );

    if (
        !titulo ||
        titulo === "Selecciona un tema" ||
        !contenido
    ) {
        mostrarToast("Selecciona primero un tema.");
        return;
    }

    const resúmenes = {
        "Inteligencia Artificial": [
            "La Inteligencia Artificial (IA) es una rama de la informática que desarrolla sistemas capaces de realizar tareas que normalmente requieren inteligencia humana.",
            "Sus principales áreas incluyen el aprendizaje automático, el procesamiento del lenguaje natural, la visión por computadora y los sistemas expertos.",
            "Se utiliza en asistentes virtuales, educación, medicina y análisis de datos."
        ],
        "Redes Neuronales": [
            "Las redes neuronales artificiales son modelos computacionales inspirados en las conexiones entre neuronas biológicas.",
            "Están formadas por capas de nodos que procesan datos y ajustan sus parámetros durante el entrenamiento.",
            "Se utilizan para reconocer imágenes, procesar lenguaje y realizar predicciones."
        ],
        "Bases de Datos": [
            "Una base de datos es un conjunto organizado de información que puede almacenarse, consultarse y actualizarse.",
            "Los sistemas gestores de bases de datos permiten administrar los datos. Entre los modelos más utilizados están las bases relacionales, que organizan la información en tablas.",
            "SQL es un lenguaje empleado para consultar y manipular datos en sistemas relacionales."
        ]
    };

    const resumen = resúmenes[titulo] || [
        `${titulo} es un tema académico que puede estudiarse identificando sus conceptos principales y aplicaciones.`,
        "Para comprenderlo, conviene revisar sus fundamentos teóricos, analizar ejemplos y practicar con ejercicios.",
        "Finalmente, relaciona lo aprendido con casos reales y consulta fuentes académicas confiables."
    ];

    contenido.innerHTML = `
        <h3>Resumen ampliado: ${titulo}</h3>
        ${resumen.map(parrafo => `<p>${parrafo}</p>`).join("")}
        <div class="summary-highlight">
            💡 <strong>Para estudiar:</strong>
            identifica los conceptos clave, escribe tus propias notas
            y comprueba lo aprendido con ejercicios.
        </div>
    `;

    mostrarToast("Resumen ampliado disponible.");
}



function buscarLibrosDesdeApoyo() {

    document
        .querySelector(
            '.tab[data-tab="libros"]'
        )
        ?.click();

}


function buscarVideos() {

    const tema =
        document.getElementById(
            "summaryTitle"
        )?.textContent ||
        "tema académico";

    window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(tema)}`,
        "_blank"
    );

}


function buscarArticulosDesdeApoyo() {

    document
        .querySelector(
            '.tab[data-tab="revistas"]'
        )
        ?.click();

}


/* =====================================================
   PERFIL
   ===================================================== */


function cargarPerfil() {

    const nombre =
        perfil.nombre ||
        usuarioActual ||
        localStorage.getItem("planU_usuario") ||
        "";

    const carrera =
        perfil.carrera || "Ingeniería de Sistemas";

    const universidad =
        perfil.universidad || "";

    const semestre =
        perfil.semestre || "";

    const campos = {
        profileName: nombre,
        profileCareer: carrera,
        profileUniversity: universidad,
        profileSemester: semestre
    };

    Object.entries(campos).forEach(([id, valor]) => {

        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.value = valor;
        }

    });

    actualizarDatosVisuales(nombre, carrera);

   if (perfil.completado === true) {
    progreso.perfil = true;
    actualizarProgreso();
}

}



function actualizarDatosVisuales(
    nombre,
    carrera
) {

    const displayName =
        document.getElementById(
            "profileDisplayName"
        );

    const displayCareer =
        document.getElementById(
            "profileDisplayCareer"
        );

    const homeCareer =
        document.getElementById(
            "homeCareer"
        );

    const userNameTop =
        document.getElementById(
            "userNameTop"
        );

    if (displayName) {
        displayName.textContent = nombre;
    }

    if (displayCareer) {
        displayCareer.textContent = carrera;
    }

    if (homeCareer) {
        homeCareer.textContent = carrera;
    }

    if (userNameTop) {
        userNameTop.textContent = nombre;
    }

    const inicial =
        nombre.charAt(0).toUpperCase();

    document
        .querySelectorAll(
            "#topAvatar, #largeAvatar"
        )
        .forEach(avatar => {

            avatar.textContent = inicial;

        });

}


function guardarPerfil() {
    const nombre = document.getElementById("profileName")?.value.trim();
    const carrera = document.getElementById("profileCareer")?.value.trim();
    const universidad = document.getElementById("profileUniversity")?.value.trim();
    const semestre = document.getElementById("profileSemester")?.value;

    if (!usuarioActual) {
        mostrarToast("Inicia sesión para guardar tu perfil.");
        return;
    }

    perfil = {
        nombre: nombre || "",
        carrera: carrera || "Ingeniería de Sistemas",
        universidad: universidad || "",
        semestre: semestre || ""
    };

    const clavePerfil = claveDatos("perfil", usuarioActual);

    localStorage.setItem(
        clavePerfil,
        JSON.stringify(perfil)
    );

    // Mantener compatibilidad con el perfil anterior.
    localStorage.setItem(
        "planU_perfil_" + usuarioActual,
        JSON.stringify(perfil)
    );

    progreso.perfil = true;
    actualizarProgreso();

    actualizarDatosVisuales(
        perfil.nombre,
        perfil.carrera
    );

    mostrarToast("Perfil actualizado correctamente.");
}


/* =====================================================
   INICIO
   ===================================================== */

function actualizarInicio() {

    const totalCursos = cursos.length;

    const elementos =
        document.querySelectorAll(
            "[data-courses-count]"
        );

    elementos.forEach(elemento => {

        elemento.textContent =
            totalCursos;

    });

}


/* =====================================================
   NOTIFICACIONES
   ===================================================== */

function configurarNotificaciones() {

    const boton =
        document.querySelector(
            ".notification-btn"
        );

    const panel =
        document.getElementById(
            "notificationPanel"
        );

    if (!boton || !panel) return;

    boton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            panel.classList.toggle("show");

        }
    );

    document.addEventListener(
        "click",
        event => {

            if (
                !panel.contains(event.target) &&
                !boton.contains(event.target)
            ) {

                panel.classList.remove("show");

            }

        }
    );

}


/* =====================================================
   MENÚ DEL PERFIL
   ===================================================== */

function configurarMenuUsuario() {

    const userButton =
        document.getElementById("userMenuButton");

    const userMenu =
        document.getElementById("userMenu");

    if (!userButton || !userMenu) return;

    userButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            userMenu.classList.toggle("show");

        }
    );

    document.addEventListener(
        "click",
        () => {

            userMenu.classList.remove("show");

        }
    );

    userMenu.addEventListener(
        "click",
        event => {

            event.stopPropagation();

        }
    );

}


/* =====================================================
   BÚSQUEDA GLOBAL
   ===================================================== */

function buscarGlobal(texto) {

    if (!texto.trim()) return;

    const termino =
        texto.toLowerCase();

    if (
        termino.includes("libro") ||
        termino.includes("libros")
    ) {

        document
            .querySelector(
                '.nav-item[data-section="recomendaciones"]'
            )
            ?.click();

        document
            .querySelector(
                '.tab[data-tab="libros"]'
            )
            ?.click();

        return;

    }

    if (
        termino.includes("curso") ||
        termino.includes("materia")
    ) {

        document
            .querySelector(
                '.nav-item[data-section="horarios"]'
            )
            ?.click();

        return;

    }

    if (
        termino.includes("nota") ||
        termino.includes("calificacion")
    ) {

        document
            .querySelector(
                '.nav-item[data-section="recomendaciones"]'
            )
            ?.click();

        return;

    }

    mostrarToast(
        `Buscando: ${texto}`
    );

}


/* =====================================================
   TOAST
   ===================================================== */

function mostrarToast(mensaje) {

    const toast =
        document.getElementById("toast");

    const mensajeElemento =
        document.getElementById("toastMessage");

    if (!toast) return;

    if (mensajeElemento) {
        mensajeElemento.textContent = mensaje;
    }

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);

}


/* =====================================================
   CIERRE DE MODALES
   ===================================================== */

window.addEventListener(
    "click",
    event => {

        if (
            event.target.classList.contains("modal")
        ) {

            event.target.classList.remove("show");

        }

    }
);


/* =====================================================
   FUNCIONES GLOBALES
   ===================================================== */

window.goToSection = goToSection;

window.abrirModalCurso = abrirModalCurso;
window.cerrarModalCurso = cerrarModalCurso;
window.guardarCurso = guardarCurso;

window.abrirModalNota = abrirModalNota;
window.cerrarModalNota = cerrarModalNota;
window.guardarNota = guardarNota;

window.eliminarCurso = eliminarCurso;

window.generarHorarios = generarHorarios;

window.buscarLibros = buscarLibros;
window.buscarArticulos = buscarArticulos;

window.buscarTemaAcademico = buscarTemaAcademico;
window.seleccionarTema = seleccionarTema;
window.generarResumenCompleto = generarResumenCompleto;

window.buscarLibrosDesdeApoyo = buscarLibrosDesdeApoyo;
window.buscarVideos = buscarVideos;
window.buscarArticulosDesdeApoyo = buscarArticulosDesdeApoyo;

window.guardarPerfil = guardarPerfil;


/* =====================================================
   FUNCIONES DE SESIÓN GLOBALES
   ===================================================== */

window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;


async function buscarArticulos() {
    const input = document.getElementById("articleSearch");
    const contenedor = document.getElementById("articleResults");

    if (!input || !contenedor) return;

    const tema = input.value.trim() || "educación tecnología";

    contenedor.innerHTML = `
        <div class="empty-box">
            🔎
            <strong>Buscando artículos académicos...</strong>
            <span>Priorizando publicaciones recientes de Perú.</span>
        </div>
    `;

    try {
        async function consultarArticulos(filtro) {
            const url = new URL("https://api.openalex.org/works");

            url.searchParams.set("search", tema);
            url.searchParams.set("per-page", "12");
            url.searchParams.set("sort", "relevance_score:desc");
            url.searchParams.set(
                "filter",
                filtro
            );

            const respuesta = await fetch(url);

            if (!respuesta.ok) {
                throw new Error("Error al consultar OpenAlex.");
            }

            const datos = await respuesta.json();
            return datos.results || [];
        }

        // Primera búsqueda: publicaciones recientes de Perú.
        let articulos = await consultarArticulos(
            "from_publication_date:2021-01-01,to_publication_date:2026-12-31,primary_location.source.country_code:PE"
        );

        // Segunda búsqueda: completar con publicaciones recientes
        // de otros países cuyo idioma registrado sea español.
        if (articulos.length < 5) {
            const adicionales = await consultarArticulos(
                "from_publication_date:2021-01-01,to_publication_date:2026-12-31,language:es"
            );

            const vistos = new Set(
                articulos.map(a => a.id)
            );

            for (const articulo of adicionales) {
                if (!vistos.has(articulo.id)) {
                    articulos.push(articulo);
                    vistos.add(articulo.id);
                }

                if (articulos.length >= 12) break;
            }
        }

        if (articulos.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-box">
                    📚
                    <strong>No encontramos artículos</strong>
                    <span>Prueba con otro tema o palabra clave.</span>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = articulos.map(articulo => {
            const titulo = escaparHTML(
                articulo.title || "Artículo sin título"
            );

            const año = articulo.publication_year || "Año no disponible";

            const doi = articulo.doi
                ? articulo.doi.replace(
                    /^https?:\/\/doi\.org\//i,
                    ""
                )
                : "";

            const enlace = doi
                ? `https://doi.org/${doi}`
                : (articulo.id || "https://openalex.org/");

            const pais = articulo.primary_location?.source?.country_code;
            const esPeru = pais === "PE";

            return `
                <article class="resource-card">
                    <h3>${titulo}</h3>
                    <p>📅 Publicación: ${año}</p>
                    <p>🌎 ${esPeru ? "Revista registrada en Perú" : "Publicación internacional"}</p>
                    <a
                        href="${escaparHTML(enlace)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Consultar artículo →
                    </a>
                </article>
            `;
        }).join("");

    } catch (error) {
        console.error("Error al buscar artículos:", error);

        contenedor.innerHTML = `
            <div class="empty-box">
                ⚠️
                <strong>No se pudo completar la búsqueda</strong>
                <span>Comprueba tu conexión e inténtalo de nuevo.</span>
            </div>
        `;
    }
}



function escaparHTML(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caracter => {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entidades[caracter];
    });
}

function configurarNotificaciones() {
    const boton = document.getElementById("notificationButton");

    if (!boton) return;

    boton.addEventListener("click", () => {
        mostrarToast("No tienes notificaciones nuevas.");
    });
}

configurarNotificaciones();


function configurarPestanasRecomendaciones() {
    const botones = document.querySelectorAll("[data-tab]");

    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            const destino = boton.dataset.tab;

            botones.forEach(item => {
                item.classList.remove("active");
            });

            boton.classList.add("active");

            document.querySelectorAll(".tab-content").forEach(contenido => {
                contenido.classList.remove("active");
            });

            const panel = document.getElementById(destino);

            if (panel) {
                panel.classList.add("active");
            }
        });
    });
}

configurarPestanasRecomendaciones();


function buscarMateria() {
    const input = document.getElementById("subjectSearch");
    const contenedor = document.getElementById("subjectRecommendations");

    if (!input || !contenedor) return;

    const termino = input.value.trim().toLowerCase();

    if (!termino) {
        generarRecomendaciones();
        mostrarToast("Escribe una materia o tema para buscar.");
        return;
    }

    const resultados = recomendaciones.filter(item => {
        const texto = [
            item.titulo,
            item.descripcion,
            item.categoria
        ].filter(Boolean).join(" ").toLowerCase();

        return texto.includes(termino);
    });

    if (resultados.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-box">
                <strong>No encontramos materias relacionadas</strong>
                <span>Prueba con otro tema o palabra clave.</span>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = resultados.map(item => `
        <div class="recommendation-card">
            <div class="recommendation-icon">${escaparHTML(item.icono || "📚")}</div>
            <div>
                <h3>${escaparHTML(item.titulo)}</h3>
                <p>${escaparHTML(item.descripcion || "")}</p>
            </div>
            <div class="match">${Number(item.match) || 0}% coincidencia</div>
            <button
                class="arrow-btn"
                type="button"
                onclick="seleccionarRecomendacion('${String(item.titulo).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')"
            >→</button>
        </div>
    `).join("");
}


function cambiarFotoPerfil(event) {
    const archivo = event.target.files[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
        alert("Selecciona un archivo de imagen válido.");
        return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
        alert("La imagen no debe superar los 5 MB.");
        return;
    }

    const lector = new FileReader();

    lector.onload = function () {
        const avatar = document.getElementById("largeAvatar");

        if (!avatar) {
            alert("No se encontró el contenedor del perfil.");
            return;
        }

        let imagen = avatar.querySelector("img");

        if (!imagen) {
            imagen = document.createElement("img");
            imagen.alt = "Foto de perfil";
            imagen.style.width = "100%";
            imagen.style.height = "100%";
            imagen.style.objectFit = "cover";
            imagen.style.borderRadius = "50%";

            avatar.innerHTML = "";
            avatar.appendChild(imagen);
        }

        imagen.src = lector.result;
    };

    lector.readAsDataURL(archivo);
}

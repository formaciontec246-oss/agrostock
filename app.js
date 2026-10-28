
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyAwY4QfyDdaMn1CP3CE8BGfomm4mCcupoU",
  authDomain: "agrostock-jose.firebaseapp.com",
  projectId: "agrostock-jose",
  storageBucket: "agrostock-jose.firebasestorage.app",
  messagingSenderId: "748860791769",
  appId: "1:748860791769:web:939d59841f5e6a363d17c8",
  measurementId: "G-8ECYTZRLYC"
};


const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

const authSection   = document.getElementById("auth-section");
const appSection    = document.getElementById("app-section");
const emailInput    = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authMsg       = document.getElementById("auth-msg");
const userEmailSpan = document.getElementById("user-email");
const formProducto  = document.getElementById("form-producto");
const listaProductos= document.getElementById("lista-productos");
const contador      = document.getElementById("contador");
const filtroSelect  = document.getElementById("filtro-categoria");

let productosCache = [];   


function mostrarMsg(texto, tipo = "error") {
  authMsg.textContent = texto;
  authMsg.className = `msg ${tipo}`;
}

function limpiarMsg() {
  authMsg.textContent = "";
  authMsg.className = "msg";
}



document.getElementById("btn-register").addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass  = passwordInput.value;

  if (!email || !pass) {
    mostrarMsg("Completa correo y contraseña.");
    return;
  }
  if (pass.length < 6) {
    mostrarMsg("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    mostrarMsg("¡Usuario registrado! Ya puedes entrar.", "success");
  } catch (err) {
    mostrarMsg(traducirError(err.code));
  }
});


document.getElementById("btn-login").addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass  = passwordInput.value;

  if (!email || !pass) {
    mostrarMsg("Completa correo y contraseña.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    mostrarMsg(traducirError(err.code));
  }
});


document.getElementById("btn-logout").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.style.display = "none";
    appSection.style.display  = "block";
    userEmailSpan.textContent = user.email;
    limpiarMsg();
    cargarProductos();
  } else {
    authSection.style.display = "flex";
    appSection.style.display  = "none";
    emailInput.value = "";
    passwordInput.value = "";
    listaProductos.innerHTML = "";
    productosCache = [];
  }
});




formProducto.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre    = document.getElementById("nombre").value.trim();
  const cantidad  = Number(document.getElementById("cantidad").value);
  const categoria = document.getElementById("categoria").value;

  if (!nombre || !categoria || cantidad < 0) {
    alert("Completa todos los campos correctamente.");
    return;
  }

  try {
    await addDoc(collection(db, "productos"), {
      nombre,
      cantidad,
      categoria,
      uidAutor: auth.currentUser.uid,
      creadoEn: new Date()
    });
    formProducto.reset();
    await cargarProductos();
  } catch (err) {
    console.error(err);
    alert("Error al agregar: " + err.message);
  }
});


async function cargarProductos() {
  if (!auth.currentUser) return;

  try {
    const q = query(
      collection(db, "productos"),
      where("uidAutor", "==", auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    productosCache = [];
    snap.forEach((d) => {
      productosCache.push({ id: d.id, ...d.data() });
    });
    renderProductos();
  } catch (err) {
    console.error(err);
    alert("Error al cargar productos: " + err.message);
  }
}


function renderProductos() {
  const filtro = filtroSelect.value;
  const filtrados = filtro
    ? productosCache.filter((p) => p.categoria === filtro)
    : productosCache;

  listaProductos.innerHTML = "";

  if (filtrados.length === 0) {
    listaProductos.innerHTML =
      '<p class="vacio">No hay productos. ¡Agrega el primero! </p>';
    contador.textContent = "";
    return;
  }

  filtrados.forEach((p) => {
    const card = document.createElement("div");
    card.className = "producto-card";
    card.innerHTML = `
      <span class="categoria-badge">${p.categoria}</span>
      <h3>${escapeHtml(p.nombre)}</h3>
      <p>Cantidad: <span class="cantidad ${p.cantidad < 5 ? "bajo" : ""}">${p.cantidad}</span></p>
      ${p.cantidad < 5 ? '<p style="color:var(--rojo);font-size:.8rem"> Stock bajo</p>' : ""}
      <div class="acciones">
        <button class="btn-edit" data-id="${p.id}"> Editar</button>
        <button class="btn-del"  data-id="${p.id}"> Eliminar</button>
      </div>
    `;
    listaProductos.appendChild(card);
  });

  const total = filtrados.length;
  const bajoStock = filtrados.filter((p) => p.cantidad < 5).length;
  contador.textContent =
    `Mostrando ${total} producto${total !== 1 ? "s" : ""}` +
    (bajoStock ? ` ·  ${bajoStock} con stock bajo` : "");

  listaProductos.querySelectorAll(".btn-edit").forEach((b) => {
    b.addEventListener("click", () => editarProducto(b.dataset.id));
  });
  listaProductos.querySelectorAll(".btn-del").forEach((b) => {
    b.addEventListener("click", () => eliminarProducto(b.dataset.id));
  });
}


async function editarProducto(id) {
  const prod = productosCache.find((p) => p.id === id);
  if (!prod) return;

  const nuevaCantidad = prompt(
    `Nueva cantidad para "${prod.nombre}":`,
    prod.cantidad
  );
  if (nuevaCantidad === null) return;
  const num = Number(nuevaCantidad);
  if (isNaN(num) || num < 0) {
    alert("Cantidad inválida.");
    return;
  }

  try {
    await updateDoc(doc(db, "productos", id), { cantidad: num });
    await cargarProductos();
  } catch (err) {
    console.error(err);
    alert("Error al actualizar: " + err.message);
  }
}


async function eliminarProducto(id) {
  const prod = productosCache.find((p) => p.id === id);
  if (!prod) return;

  if (!confirm(`¿Eliminar "${prod.nombre}"?`)) return;

  try {
    await deleteDoc(doc(db, "productos", id));
    await cargarProductos();
  } catch (err) {
    console.error(err);
    alert("Error al eliminar: " + err.message);
  }
}


filtroSelect.addEventListener("change", renderProductos);

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function traducirError(code) {
  const mensajes = {
    "auth/email-already-in-use":    "Ese correo ya está registrado.",
    "auth/invalid-email":           "El correo no es válido.",
    "auth/weak-password":           "La contraseña es muy débil (mín. 6 caracteres).",
    "auth/user-not-found":          "No existe una cuenta con ese correo.",
    "auth/wrong-password":          "Contraseña incorrecta.",
    "auth/invalid-credential":      "Correo o contraseña incorrectos.",
    "auth/too-many-requests":       "Demasiados intentos. Espera unos minutos."
  };
  return mensajes[code] || "Ocurrió un error: " + code;
}
window.addEventListener("DOMContentLoaded", () => {

const firebaseConfig = {
  apiKey: "AIzaSyAWxvuxHtqyYES0X23ZTb-CXvNPhOywHEw",
  authDomain: "voa-crm-d7fee.firebaseapp.com",
  projectId: "voa-crm-d7fee",
  storageBucket: "voa-crm-d7fee.firebasestorage.app",
  messagingSenderId: "550057032162",
  appId: "1:550057032162:web:8c1ddd385fafe30fdfe1bb",
  measurementId: "G-D1YBCZNBQM"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

/* DOM */
const authSection = document.getElementById("auth-section");
const appSection  = document.getElementById("app-section");

const loginForm  = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPass  = document.getElementById("login-password");
const authMsg    = document.getElementById("auth-message");

const createUserBtn = document.getElementById("create-user-btn");
const logoutBtn     = document.getElementById("logout-btn");

const tabs = document.querySelectorAll(".tab-btn");

const entityForm = document.getElementById("entity-form");
const entityId   = document.getElementById("entity-id");

const nameInput = document.getElementById("name");
const docInput  = document.getElementById("document");
const contactIn = document.getElementById("contact-person");
const emailIn   = document.getElementById("email");
const phoneIn   = document.getElementById("phone");
const cityIn    = document.getElementById("city");

const formMsg = document.getElementById("form-message");
const tbody   = document.getElementById("entity-tbody");
const listMsg = document.getElementById("list-message");
const search  = document.getElementById("search");
const exportB = document.getElementById("export-btn");
const clearB  = document.getElementById("clear-btn");

let currentTab = "clients";
let data = [];

/* AUTH */
auth.onAuthStateChanged(user => {
  authSection.classList.toggle("hidden", !!user);
  appSection.classList.toggle("hidden", !user);
  if (user) loadData();
});

loginForm.onsubmit = async e => {
  e.preventDefault();
  try {
    await auth.signInWithEmailAndPassword(loginEmail.value, loginPass.value);
  } catch (err) {
    authMsg.textContent = err.message;
  }
};

createUserBtn.onclick = async () => {
  const email = prompt("E-mail:");
  const pass  = prompt("Senha (mín 6):");
  if (!email || !pass) return;
  try {
    await auth.createUserWithEmailAndPassword(email, pass);
    alert("Usuário criado");
  } catch (e) {
    alert(e.message);
  }
};

logoutBtn.onclick = () => auth.signOut();

/* TABS */
tabs.forEach(btn => btn.onclick = () => {
  tabs.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentTab = btn.dataset.tab;
  loadData();
});

/* CRUD */
entityForm.onsubmit = async e => {
  e.preventDefault();
  const obj = {
    name: nameInput.value,
    document: docInput.value,
    contact: contactIn.value,
    email: emailIn.value,
    phone: phoneIn.value,
    city: cityIn.value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (entityId.value)
    await db.collection(currentTab).doc(entityId.value).update(obj);
  else
    await db.collection(currentTab).add(obj);

  entityForm.reset();
  entityId.value = "";
  loadData();
};

clearB.onclick = () => {
  entityForm.reset();
  entityId.value = "";
};

async function loadData() {
  tbody.innerHTML = "";
  data = [];
  const snap = await db.collection(currentTab).orderBy("name").get();
  snap.forEach(d => data.push({ id: d.id, ...d.data() }));
  render(data);
  listMsg.textContent = `${data.length} registro(s)`;
}

function render(rows) {
  tbody.innerHTML = "";
  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${r.document || ""}</td>
      <td>${r.city || ""}</td>
      <td>
        <button onclick="edit('${r.id}')">Editar</button>
        <button onclick="del('${r.id}')">Excluir</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

window.edit = id => {
  const r = data.find(x => x.id === id);
  entityId.value = r.id;
  nameInput.value = r.name;
  docInput.value = r.document;
  contactIn.value = r.contact;
  emailIn.value = r.email;
  phoneIn.value = r.phone;
  cityIn.value = r.city;
};

window.del = async id => {
  if (confirm("Excluir?")) {
    await db.collection(currentTab).doc(id).delete();
    loadData();
  }
};

/* SEARCH */
search.oninput = () => {
  const t = search.value.toLowerCase();
  render(data.filter(d => d.name.toLowerCase().includes(t)));
};

/* CSV */
exportB.onclick = () => {
  let csv = "Nome;Documento;Cidade\n";
  data.forEach(d => {
    csv += `${d.name};${d.document || ""};${d.city || ""}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = currentTab + ".csv";
  a.click();
};

});



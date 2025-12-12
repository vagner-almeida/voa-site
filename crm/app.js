// === CONFIG FIREBASE (voa-crm) ===
const firebaseConfig = {
  apiKey: "AIzaSyAwvxuh4tyYS5EX23ZTb-CXvvNP0ywHEw",
  authDomain: "voa-crm-d7fee.firebaseapp.com",
  projectId: "voa-crm-d7fee",
  storageBucket: "voa-crm-d7fee.appspot.com",
  messagingSenderId: "550857032162",
  appId: "1:550857032162:web:b9de48e67581eebdfe1bb",
  measurementId: "G-G6FCPJRPZX"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

// ---------- DOM ----------
const authSection = document.getElementById("auth-section");
const appSection  = document.getElementById("app-section");

const loginForm  = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPass  = document.getElementById("login-password");
const authMsg    = document.getElementById("auth-message");

const createUserBtn = document.getElementById("create-user-btn");
const logoutBtn     = document.getElementById("logout-btn");
const userEmailSpan = document.getElementById("user-email");

const tabs      = document.querySelectorAll(".tab-btn");
const formTitle = document.getElementById("form-title");
const listTitle = document.getElementById("list-title");

const entityForm = document.getElementById("entity-form");
const entityId   = document.getElementById("entity-id");
const entityType = document.getElementById("entity-type");
const personType = document.getElementById("person-type");

const nameInput = document.getElementById("name");
const docInput  = document.getElementById("document");
const contactIn = document.getElementById("contact-person");
const emailIn   = document.getElementById("email");
const phoneIn   = document.getElementById("phone");
const addressIn = document.getElementById("address");
const cityIn    = document.getElementById("city");
const stateIn   = document.getElementById("state");
const countryIn = document.getElementById("country");
const notesIn   = document.getElementById("notes");

const formMsg  = document.getElementById("form-message");
const clearBtn = document.getElementById("clear-btn");

const searchInput = document.getElementById("search");
const exportBtn   = document.getElementById("export-btn");
const tbody       = document.getElementById("entity-tbody");
const listMsg     = document.getElementById("list-message");

let currentTab = "clients";
let dataList   = [];

// ---------- AUTH ----------
auth.onAuthStateChanged((user) => {
  if (user) {
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    userEmailSpan.textContent = user.email;
    loadData();
  } else {
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    userEmailSpan.textContent = "";
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMsg.textContent = "";
  try {
    await auth.signInWithEmailAndPassword(loginEmail.value, loginPass.value);
  } catch (err) {
    authMsg.textContent = "Erro ao entrar: " + err.message;
  }
});

createUserBtn.addEventListener("click", async () => {
  const mail = prompt("E-mail do novo usuário:");
  const pass = prompt("Senha (mínimo 6 caracteres):");
  if (!mail || !pass) return;
  try {
    await auth.createUserWithEmailAndPassword(mail, pass);
    alert("Usuário criado com sucesso!");
  } catch (err) {
    alert("Erro ao criar usuário: " + err.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
});

// ---------- TABS ----------
tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTab = btn.dataset.tab;

    if (currentTab === "clients") {
      entityType.value = "client";
      formTitle.textContent = "Novo cliente";
      listTitle.textContent = "Clientes cadastrados";
    } else {
      entityType.value = "supplier";
      formTitle.textContent = "Novo fornecedor";
      listTitle.textContent = "Fornecedores cadastrados";
    }

    clearForm();
    loadData();
  });
});

// ---------- FORM / CRUD ----------
entityForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "";

  if (!nameInput.value.trim()) {
    formMsg.textContent = "Nome é obrigatório.";
    return;
  }

  const obj = {
    type: entityType.value,
    personType: personType.value,
    name: nameInput.value.trim(),
    document: docInput.value.trim(),
    contactPerson: contactIn.value.trim(),
    email: emailIn.value.trim(),
    phone: phoneIn.value.trim(),
    address: addressIn.value.trim(),
    city: cityIn.value.trim(),
    state: stateIn.value.trim().toUpperCase(),
    country: countryIn.value.trim(),
    notes: notesIn.value.trim(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const col = db.collection(currentTab);
  try {
    if (entityId.value) {
      await col.doc(entityId.value).update(obj);
      formMsg.textContent = "Registro atualizado.";
    } else {
      obj.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await col.add(obj);
      formMsg.textContent = "Registro criado.";
    }
    clearForm(false);
    loadData();
  } catch (err) {
    formMsg.textContent = "Erro ao salvar: " + err.message;
  }
});

clearBtn.addEventListener("click", () => clearForm(true));

function clearForm(clearMsg = true) {
  entityId.value = "";
  nameInput.value = "";
  docInput.value = "";
  contactIn.value = "";
  emailIn.value = "";
  phoneIn.value = "";
  addressIn.value = "";
  cityIn.value = "";
  stateIn.value = "";
  countryIn.value = "Brasil";
  notesIn.value = "";
  if (clearMsg) formMsg.textContent = "";
}

// ---------- CARREGAR DADOS ----------
async function loadData() {
  listMsg.textContent = "Carregando...";
  tbody.innerHTML = "";
  dataList = [];

  try {
    const col = db.collection(currentTab);
    const snap = await col.orderBy("name").get();
    snap.forEach(doc => dataList.push({ id: doc.id, ...doc.data() }));
    renderTable(dataList);
    listMsg.textContent = `${dataList.length} registro(s).`;
  } catch (err) {
    listMsg.textContent = "Erro ao carregar: " + err.message;
  }
}

function renderTable(rows) {
  tbody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const created = row.createdAt?.toDate
      ? row.createdAt.toDate().toLocaleDateString("pt-BR")
      : "-";

    tr.innerHTML = `
      <td>${row.name || ""}</td>
      <td>${row.document || ""}</td>
      <td>${row.contactPerson || ""}</td>
      <td>${row.city || ""}</td>
      <td>${row.type === "client" ? "Cliente" : "Fornecedor"}</td>
      <td>${created}</td>
      <td>
        <button class="table-btn edit" data-id="${row.id}">Editar</button>
        <button class="table-btn delete" data-id="${row.id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".table-btn.edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = dataList.find(x => x.id === btn.dataset.id);
      if (!item) return;
      fillForm(item);
    });
  });

  document.querySelectorAll(".table-btn.delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Excluir este registro?")) return;
      await db.collection(currentTab).doc(btn.dataset.id).delete();
      loadData();
    });
  });
}

function fillForm(item) {
  entityId.value   = item.id;
  entityType.value = item.type || "client";
  personType.value = item.personType || "juridica";
  nameInput.value  = item.name || "";
  docInput.value   = item.document || "";
  contactIn.value  = item.contactPerson || "";
  emailIn.value    = item.email || "";
  phoneIn.value    = item.phone || "";
  addressIn.value  = item.address || "";
  cityIn.value     = item.city || "";
  stateIn.value    = item.state || "";
  countryIn.value  = item.country || "Brasil";
  notesIn.value    = item.notes || "";
  formTitle.textContent =
    item.type === "client" ? "Editar cliente" : "Editar fornecedor";
}

// ---------- BUSCA ----------
searchInput.addEventListener("input", () => {
  const t = searchInput.value.toLowerCase();
  const filtered = dataList.filter(r =>
    (r.name || "").toLowerCase().includes(t) ||
    (r.document || "").toLowerCase().includes(t) ||
    (r.city || "").toLowerCase().includes(t)
  );
  renderTable(filtered);
});

// ---------- EXPORT CSV ----------
exportBtn.addEventListener("click", () => {
  if (!dataList.length) return alert("Nada para exportar.");

  const header = [
    "Tipo","Pessoa","Nome","Documento","Contato",
    "E-mail","Telefone","Endereço","Cidade",
    "Estado","País","Observações","Criado"
  ];

  const rows = dataList.map(r => {
    const created = r.createdAt?.toDate
      ? r.createdAt.toDate().toLocaleDateString("pt-BR")
      : "";
    return [
      r.type === "client" ? "Cliente" : "Fornecedor",
      r.personType === "fisica" ? "Física" : "Jurídica",
      r.name || "",
      r.document || "",
      r.contactPerson || "",
      r.email || "",
      r.phone || "",
      r.address || "",
      r.city || "",
      r.state || "",
      r.country || "",
      (r.notes || "").replace(/\r?\n/g, " "),
      created
    ];
  });

  const csv = [header, ...

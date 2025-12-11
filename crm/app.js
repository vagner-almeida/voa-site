// === 1. CONFIGURAÇÃO DO FIREBASE ===
// Vá no console do Firebase -> Projeto -> Configurações -> "Configuração do SDK Web"
// e preencha abaixo:

const firebaseConfig = {
  apiKey: "AIzaSyAwvxuh4tyYS5EX23ZTb-CXvvNP0ywHEw",
  authDomain: "voa-crm-d7fee.firebaseapp.com",
  projectId: "voa-crm-d7fee",
  storageBucket: "voa-crm-d7fee.firebasestorage.app",
  messagingSenderId: "550857032162",
  appId: "1:550857032162:web:b9de48e67581eebdfe1bb",
  measurementId: "G-G6FCPJRPZX"
};


// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Referências de DOM
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const createUserBtn = document.getElementById("create-user-btn");
const authMessage = document.getElementById("auth-message");
const logoutBtn = document.getElementById("logout-btn");
const userEmailSpan = document.getElementById("user-email");

const tabs = document.querySelectorAll(".tab-btn");
const entityTypeSelect = document.getElementById("entity-type");
const personTypeSelect = document.getElementById("person-type");
const formTitle = document.getElementById("form-title");
const listTitle = document.getElementById("list-title");
const entityForm = document.getElementById("entity-form");
const entityIdInput = document.getElementById("entity-id");
const nameInput = document.getElementById("name");
const documentInput = document.getElementById("document");
const contactPersonInput = document.getElementById("contact-person");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const addressInput = document.getElementById("address");
const cityInput = document.getElementById("city");
const stateInput = document.getElementById("state");
const countryInput = document.getElementById("country");
const notesInput = document.getElementById("notes");
const formMessage = document.getElementById("form-message");
const clearBtn = document.getElementById("clear-btn");

const searchInput = document.getElementById("search");
const exportBtn = document.getElementById("export-btn");
const entityTbody = document.getElementById("entity-tbody");
const listMessage = document.getElementById("list-message");

// Estado simples
let currentTab = "clients"; // clients | suppliers
let currentData = []; // cache da lista exibida

// === 2. AUTENTICAÇÃO ===

// Observador de estado de login
auth.onAuthStateChanged((user) => {
  if (user) {
    userEmailSpan.textContent = user.email;
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loadEntities();
  } else {
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    userEmailSpan.textContent = "";
  }
});

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMessage.textContent = "";
  try {
    await auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value);
  } catch (err) {
    authMessage.textContent = "Erro ao entrar: " + traduzErroAuth(err);
  }
});

// Criar usuário (usar só para criar seu usuário, depois pode remover o botão)
createUserBtn.addEventListener("click", async () => {
  const email = prompt("E-mail do novo usuário:");
  const senha = prompt("Senha do novo usuário (mínimo 6 caracteres):");
  if (!email || !senha) return;
  try {
    await auth.createUserWithEmailAndPassword(email, senha);
    alert("Usuário criado com sucesso!");
  } catch (err) {
    alert("Erro ao criar usuário: " + traduzErroAuth(err));
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
});

// Tradução simples dos erros de login
function traduzErroAuth(err) {
  if (!err || !err.code) return "Erro desconhecido.";
  switch (err.code) {
    case "auth/user-not-found":
      return "Usuário não encontrado.";
    case "auth/wrong-password":
      return "Senha incorreta.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/email-already-in-use":
      return "E-mail já está em uso.";
    case "auth/weak-password":
      return "Senha fraca. Use pelo menos 6 caracteres.";
    default:
      return err.message || "Erro desconhecido.";
  }
}

// === 3. TROCA DE ABA (CLIENTES / FORNECEDORES) ===

tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentTab = btn.dataset.tab === "clients" ? "clients" : "suppliers";
    // Atualiza textos
    if (currentTab === "clients") {
      entityTypeSelect.value = "client";
      formTitle.textContent = "Novo cliente";
      listTitle.textContent = "Clientes cadastrados";
    } else {
      entityTypeSelect.value = "supplier";
      formTitle.textContent = "Novo fornecedor";
      listTitle.textContent = "Fornecedores cadastrados";
    }
    clearForm();
    loadEntities();
  });
});

// Garantir sincronismo do select com a aba
entityTypeSelect.addEventListener("change", () => {
  if (entityTypeSelect.value === "client") {
    currentTab = "clients";
    tabs[0].click();
  } else {
    currentTab = "suppliers";
    tabs[1].click();
  }
});

// === 4. CRUD (CRIAR / EDITAR / EXCLUIR) ===

// Coleção conforme tipo
function getCollectionName() {
  return currentTab === "clients" ? "clients" : "suppliers";
}

// Submit form
entityForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";

  const data = {
    type: entityTypeSelect.value,
    personType: personTypeSelect.value,
    name: nameInput.value.trim(),
    document: documentInput.value.trim(),
    contactPerson: contactPersonInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    address: addressInput.value.trim(),
    city: cityInput.value.trim(),
    state: stateInput.value.trim().toUpperCase(),
    country: countryInput.value.trim(),
    notes: notesInput.value.trim(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (!data.name) {
    formMessage.textContent = "Nome é obrigatório.";
    return;
  }

  const collection = db.collection(getCollectionName());
  try {
    const id = entityIdInput.value;
    if (id) {
      // update
      await collection.doc(id).update(data);
      formMessage.textContent = "Registro atualizado com sucesso.";
    } else {
      // create
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await collection.add(data);
      formMessage.textContent = "Registro criado com sucesso.";
    }
    clearForm(false);
    loadEntities();
  } catch (err) {
    formMessage.textContent = "Erro ao salvar: " + err.message;
  }
});

// Limpar formulário
clearBtn.addEventListener("click", () => clearForm(true));

function clearForm(clearMessages = true) {
  entityIdInput.value = "";
  nameInput.value = "";
  documentInput.value = "";
  contactPersonInput.value = "";
  emailInput.value = "";
  phoneInput.value = "";
  addressInput.value = "";
  cityInput.value = "";
  stateInput.value = "";
  countryInput.value = "Brasil";
  notesInput.value = "";
  if (clearMessages) {
    formMessage.textContent = "";
  }
}

// Carregar lista
async function loadEntities() {
  const collection = db.collection(getCollectionName());
  listMessage.textContent = "Carregando...";
  entityTbody.innerHTML = "";
  currentData = [];

  try {
    const snapshot = await collection.orderBy("name").get();
    if (snapshot.empty) {
      listMessage.textContent = "Nenhum registro encontrado.";
      return;
    }
    snapshot.forEach((doc) => {
      const data = doc.data();
      currentData.push({
        id: doc.id,
        ...data
      });
    });
    renderTable(currentData);
    listMessage.textContent = currentData.length + " registro(s) encontrado(s).";
  } catch (err) {
    listMessage.textContent = "Erro ao carregar dados: " + err.message;
  }
}

// Renderizar tabela
function renderTable(rows) {
  entityTbody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");

    const createdAt = row.createdAt?.toDate
      ? row.createdAt.toDate()
      : null;
    const createdStr = createdAt
      ? createdAt.toLocaleDateString("pt-BR")
      : "-";

    tr.innerHTML = `
      <td>${escapeHtml(row.name || "")}</td>
      <td>${escapeHtml(row.document || "")}</td>
      <td>${escapeHtml(row.contactPerson || "")}</td>
      <td>${escapeHtml(row.city || "")}</td>
      <td>${row.type === "client" ? "Cliente" : "Fornecedor"}</td>
      <td>${createdStr}</td>
      <td>
        <button class="table-btn edit" data-id="${row.id}">Editar</button>
        <button class="table-btn delete" data-id="${row.id}">Excluir</button>
      </td>
    `;
    entityTbody.appendChild(tr);
  });

  // Ações de editar/excluir
  document.querySelectorAll(".table-btn.edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const item = currentData.find((x) => x.id === id);
      if (!item) return;
      fillFormForEdit(item);
    });
  });

  document.querySelectorAll(".table-btn.delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("Confirma excluir este registro?")) return;
      try {
        await db.collection(getCollectionName()).doc(id).delete();
        loadEntities();
      } catch (err) {
        alert("Erro ao excluir: " + err.message);
      }
    });
  });
}

// Preencher formulário para edição
function fillFormForEdit(item) {
  entityIdInput.value = item.id;
  entityTypeSelect.value = item.type || (currentTab === "clients" ? "client" : "supplier");
  personTypeSelect.value = item.personType || "juridica";
  nameInput.value = item.name || "";
  documentInput.value = item.document || "";
  contactPersonInput.value = item.contactPerson || "";
  emailInput.value = item.email || "";
  phoneInput.value = item.phone || "";
  addressInput.value = item.address || "";
  cityInput.value = item.city || "";
  stateInput.value = item.state || "";
  countryInput.value = item.country || "Brasil";
  notesInput.value = item.notes || "";

  formTitle.textContent = entityTypeSelect.value === "client" ? "Editar cliente" : "Editar fornecedor";
  formMessage.textContent = "";
}

// Escapar HTML
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// === 5. BUSCA E EXPORTAÇÃO ===

// Filtro
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const filtered = currentData.filter((row) => {
    return (
      (row.name || "").toLowerCase().includes(term) ||
      (row.document || "").toLowerCase().includes(term) ||
      (row.city || "").toLowerCase().includes(term)
    );
  });
  renderTable(filtered);
});

// Exportar CSV
exportBtn.addEventListener("click", () => {
  if (!currentData.length) {
    alert("Nenhum dado para exportar.");
    return;
  }

  const header = [
    "Tipo",
    "Pessoa",
    "Nome",
    "Documento",
    "Contato",
    "E-mail",
    "Telefone",
    "Endereço",
    "Cidade",
    "Estado",
    "País",
    "Observações",
    "Criado em"
  ];

  const rows = currentData.map((row) => {
    const createdAt = row.createdAt?.toDate ? row.createdAt.toDate() : null;
    const createdStr = createdAt
      ? createdAt.toLocaleDateString("pt-BR")
      : "";
    return [
      row.type === "client" ? "Cliente" : "Fornecedor",
      row.personType === "fisica" ? "Física" : "Jurídica",
      row.name || "",
      row.document || "",
      row.contactPerson || "",
      row.email || "",
      row.phone || "",
      row.address || "",
      row.city || "",
      row.state || "",
      row.country || "",
      (row.notes || "").replace(/\r?\n/g, " "),
      createdStr
    ];
  });

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  const fileName =
    (currentTab === "clients" ? "clientes" : "fornecedores") +
    "_" +
    new Date().toISOString().slice(0, 10) +
    ".csv";

  link.setAttribute("href", encodedUri);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

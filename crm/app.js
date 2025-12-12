window.addEventListener("DOMContentLoaded", () => {

  // === CONFIG FIREBASE (voa-crm) ===
  const firebaseConfig = {
    apiKey: "AIzaSyAWxvuxHtqyYES0X23ZTb-CXvNPhOywHEw",
    authDomain: "voa-crm-d7fee.firebaseapp.com",
    projectId: "voa-crm-d7fee",
    storageBucket: "voa-crm-d7fee.appspot.com",
    messagingSenderId: "550857032162",
    appId: "1:550857032162:web:8c1ddd385fafe30fdfe1bb",
    measurementId: "G-D1YBCZNBQM"
  };

  firebase.initializeApp(firebaseConfig);

  const auth = firebase.auth();
  const db   = firebase.firestore();
  const storage = firebase.storage();

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

  const tabs = document.querySelectorAll(".tab-btn");

  // entity form
  const entityForm = document.getElementById("entity-form");
  const entityId   = document.getElementById("entity-id");
  const nameInput  = document.getElementById("name");
  const docInput   = document.getElementById("document");
  const contactIn  = document.getElementById("contact-person");
  const emailIn    = document.getElementById("email");
  const phoneIn    = document.getElementById("phone");
  const cityIn     = document.getElementById("city");
  const formMsg    = document.getElementById("form-message");
  const clearB     = document.getElementById("clear-btn");
  const formTitle  = document.getElementById("form-title");

  // equipment form
  const eqForm        = document.getElementById("equipment-form");
  const eqFormTitle   = document.getElementById("equipment-form-title");
  const eqFormMsg     = document.getElementById("equipment-form-message");
  const eqClearBtn    = document.getElementById("equipment-clear-btn");
  const eqId          = document.getElementById("equipment-id");
  const eqTag         = document.getElementById("eq-tag");
  const eqType        = document.getElementById("eq-type");
  const eqModel       = document.getElementById("eq-model");
  const eqSerial      = document.getElementById("eq-serial");
  const eqLastCal     = document.getElementById("eq-last-cal");
  const eqInterval    = document.getElementById("eq-interval");
  const eqAlertDays   = document.getElementById("eq-alert-days");
  const eqLab         = document.getElementById("eq-lab");
  const eqNotes       = document.getElementById("eq-notes");
  const eqCert        = document.getElementById("eq-cert");
  const eqCertCurrent = document.getElementById("eq-cert-current");

  // list / table
  const theadEntity   = document.getElementById("thead-entity");
  const theadEquip    = document.getElementById("thead-equipment");
  const listTitle     = document.getElementById("list-title");
  const listSubtitle  = document.getElementById("list-subtitle");
  const tbody         = document.getElementById("entity-tbody");
  const listMsg       = document.getElementById("list-message");
  const search        = document.getElementById("search");
  const exportB       = document.getElementById("export-btn");
  const eqFilter      = document.getElementById("eq-filter");

  // state
  let currentTab = "clients";
let currentEditingCertUrl = null; // guarda URL do certificado ao editar
 // clients | suppliers | equipment
  let data = [];

  // ---------- AUTH ----------
  auth.onAuthStateChanged(async (user) => {
    const loggedIn = !!user;
    authSection.classList.toggle("hidden", loggedIn);
    appSection.classList.toggle("hidden", !loggedIn);
    logoutBtn.classList.toggle("hidden", !loggedIn);
    userEmailSpan.textContent = user?.email || "";

    if (loggedIn) {
      await loadData();
    } else {
      data = [];
      tbody.innerHTML = "";
      listMsg.textContent = "";
    }
  });

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    authMsg.textContent = "";
    try {
      await auth.signInWithEmailAndPassword(loginEmail.value, loginPass.value);
    } catch (err) {
      authMsg.textContent = err.message;
    }
  };

  createUserBtn.onclick = async () => {
    const email = prompt("E-mail do novo usuário:");
    const pass  = prompt("Senha (mín 6):");
    if (!email || !pass) return;
    try {
      await auth.createUserWithEmailAndPassword(email, pass);
      alert("Usuário criado (e logado).");
    } catch (e) {
      alert(e.message);
    }
  };

  logoutBtn.onclick = () => auth.signOut();

  // ---------- UI helpers ----------
  function showEntityUI() {
    entityForm.classList.remove("hidden");
    eqForm.classList.add("hidden");
    theadEntity.classList.remove("hidden");
    theadEquip.classList.add("hidden");
    eqFilter.classList.add("hidden");
    search.placeholder = "Buscar...";
  }

  function showEquipmentUI() {
    entityForm.classList.add("hidden");
    eqForm.classList.remove("hidden");
    theadEntity.classList.add("hidden");
    theadEquip.classList.remove("hidden");
    eqFilter.classList.remove("hidden");
    search.placeholder = "Buscar por tag, tipo, serial...";
  }

  function setTitles() {
    if (currentTab === "clients") {
      formTitle.textContent = "Novo cliente";
      listTitle.textContent = "Clientes cadastrados";
      listSubtitle.textContent = "";
    } else if (currentTab === "suppliers") {
      formTitle.textContent = "Novo fornecedor";
      listTitle.textContent = "Fornecedores cadastrados";
      listSubtitle.textContent = "";
    } else {
      eqFormTitle.textContent = "Novo equipamento";
      listTitle.textContent = "Equipamentos";
      listSubtitle.textContent = "Controle de calibração (OK / Vence em breve / Vencido)";
    }
  }

  // ---------- TABS ----------
  tabs.forEach(btn => btn.onclick = async () => {
    tabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTab = btn.dataset.tab;

    // reset UI
    search.value = "";
    eqFilter.value = "all";
    listMsg.textContent = "";
    formMsg.textContent = "";
    eqFormMsg.textContent = "";

    if (currentTab === "equipment") showEquipmentUI();
    else showEntityUI();

    setTitles();
    clearForms();
    await loadData();
  });

  function clearForms() {
    // entity
    entityForm.reset();
    entityId.value = "";

    // equipment
    eqForm.reset();
    eqId.value = "";
    if (!eqInterval.value) eqInterval.value = "12";
    if (!eqAlertDays.value) eqAlertDays.value = "30";
    renderCurrentCert(null, null);
  }

  clearB.onclick = () => { entityForm.reset(); entityId.value = ""; formMsg.textContent = ""; };
  eqClearBtn.onclick = () => { eqForm.reset(); eqId.value = ""; eqFormMsg.textContent = ""; eqInterval.value="12"; eqAlertDays.value="30"; };

  // ---------- CRUD: CLIENTS/SUPPLIERS ----------
  entityForm.onsubmit = async (e) => {
    e.preventDefault();
    formMsg.textContent = "";

    try {
      const obj = {
        name: (nameInput.value || "").trim(),
        document: (docInput.value || "").trim(),
        contact: (contactIn.value || "").trim(),
        email: (emailIn.value || "").trim(),
        phone: (phoneIn.value || "").trim(),
        city: (cityIn.value || "").trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: auth.currentUser?.email || ""
      };

      if (!obj.name) {
        formMsg.textContent = "Nome é obrigatório.";
        return;
      }

      const col = db.collection(currentTab);

      if (entityId.value) {
        await col.doc(entityId.value).update(obj);
      } else {
        obj.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        obj.createdBy = auth.currentUser?.email || "";
        await col.add(obj);
      }

      formMsg.textContent = "Salvo com sucesso!";
      entityForm.reset();
      entityId.value = "";
      await loadData();
    } catch (err) {
      console.error(err);
      formMsg.textContent = "Erro ao salvar: " + err.message;
    }
  };

  // ---------- EQUIPMENT helpers ----------
  function toDateOnlyISO(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth()+1).padStart(2,"0");
    const d = String(dateObj.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  }

  function addMonths(dateObj, months) {
    const d = new Date(dateObj.getTime());
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);

    // ajuste se estourar para mês seguinte
    if (d.getDate() < day) d.setDate(0);
    return d;
  }

  function daysBetween(a, b) { // b - a in days
    const ms = 24*60*60*1000;
    const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((ub - ua)/ms);
  }

  function computeEquipmentDerived(eq) {
    // eq.lastCalISO is expected ISO yyyy-mm-dd
    const last = eq.lastCalISO ? new Date(eq.lastCalISO + "T00:00:00") : null;
    const interval = Number(eq.intervalMonths || 12);
    const alertDays = Number(eq.alertDays || 30);
    let nextISO = "";
    let daysLeft = null;
    let status = "ok";

    if (last) {
      const next = addMonths(last, interval);
      nextISO = toDateOnlyISO(next);
      daysLeft = daysBetween(new Date(), next);

      if (daysLeft <= 0) status = "overdue";
      else if (daysLeft <= alertDays) status = "due";
      else status = "ok";
    } else {
      status = "due";
    }

    return { nextCalISO: nextISO, daysLeft, status };
  }

  function statusBadge(status) {
    if (status === "overdue") return `<span class="badge overdue">Vencido</span>`;
    if (status === "due") return `<span class="badge due">Vence em breve</span>`;
    return `<span class="badge ok">OK</span>`;
  }


  async function uploadEquipmentCert(file, equipmentIdOrTempTag, onProgress) {
  if (!file) return null;
  if (file.type !== "application/pdf") throw new Error("Envie um PDF (application/pdf).");
  const max = 20 * 1024 * 1024;
  if (file.size > max) throw new Error("PDF muito grande (máx 20MB).");

  const uid = auth.currentUser?.uid || "anonymous";
  const safeTag = String(equipmentIdOrTempTag || "equip").replace(/[^a-zA-Z0-9_-]/g, "_");
  const ts = Date.now();
  const path = `equipmentCerts/${uid}/${safeTag}/${ts}.pdf`;

  const ref = storage.ref().child(path);
  const uploadTask = ref.put(file);

  const url = await new Promise((resolve, reject) => {
    const timeoutMs = 120000; // 2 min
    const timer = setTimeout(() => reject(new Error("Timeout no upload (verifique internet / regras do Storage).")), timeoutMs);

    uploadTask.on(
      "state_changed",
      (snap) => {
        try {
          if (onProgress && snap.totalBytes) {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            onProgress(pct);
          }
        } catch (_) {}
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
      async () => {
        clearTimeout(timer);
        try {
          const url = await ref.getDownloadURL();
          resolve(url);
        } catch (e) {
          reject(e);
        }
      }
    );
  });

  return { certUrl: url, certPath: path, certName: file.name };
});

// ---- Helpers ----
function addMonthsISO(isoDate, months) {
  // isoDate: YYYY-MM-DD
  const [y, m, d] = isoDate.split("-").map(n => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, (m - 1), d));
  const targetMonth = dt.getUTCMonth() + months;
  dt.setUTCMonth(targetMonth);

  // Ajuste para meses com menos dias (ex: 31 -> 30/28)
  // Se o mês "estourou", volta para o último dia do mês anterior.
  if (dt.getUTCDate() !== d) {
    dt.setUTCDate(0);
  }

  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

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
  let currentTab = "clients"; // clients | suppliers | equipment
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


  async function uploadEquipmentCert(file, equipmentIdOrTempTag) {
    if (!file) return null;
    if (file.type !== "application/pdf") throw new Error("Envie um PDF (application/pdf).");
    const max = 20 * 1024 * 1024;
    if (file.size > max) throw new Error("PDF muito grande (máx 20MB).");

    const uid = auth.currentUser?.uid || "anonymous";
    const safeTag = String(equipmentIdOrTempTag || "equip").replace(/[^a-zA-Z0-9_-]/g, "_");
    const ts = Date.now();
    const path = `equipmentCerts/${uid}/${safeTag}/${ts}.pdf`;

    const ref = storage.ref().child(path);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    return { certUrl: url, certPath: path, certName: file.name };
  }

  function renderCurrentCert(certUrl, certName) {
    if (certUrl) {
      const name = certName ? escapeHtml(certName) : "certificado.pdf";
      eqCertCurrent.innerHTML = `Certificado atual: <a class="link" href="${certUrl}" target="_blank" rel="noopener noreferrer">${name}</a>`;
    } else {
      eqCertCurrent.textContent = "";
    }
  }


  // ---------- CRUD: EQUIPMENT ----------
  eqForm.onsubmit = async (e) => {
    e.preventDefault();
    eqFormMsg.textContent = "";

    try {
      const tag = (eqTag.value || "").trim();
      const type = (eqType.value || "").trim();
      const lastCalISO = eqLastCal.value; // yyyy-mm-dd
      const intervalMonths = Number(eqInterval.value || 12);
      const alertDays = Number(eqAlertDays.value || 30);

      if (!tag || !type || !lastCalISO) {
        eqFormMsg.textContent = "Preencha Tag, Tipo e Última calibração.";
        return;
      }

      const baseObj = {
        tag,
        type,
        model: (eqModel.value || "").trim(),
        serial: (eqSerial.value || "").trim(),
        lastCalISO,
        intervalMonths,
        alertDays,
        lab: (eqLab.value || "").trim(),
        notes: (eqNotes.value || "").trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: auth.currentUser?.email || ""
      };

      const derived = computeEquipmentDerived(baseObj);
      let obj = { ...baseObj, ...derived };

      const col = db.collection("equipment");
      const file = eqCert?.files?.[0] || null;

      if (eqId.value) {
        if (file) {
          eqFormMsg.textContent = "Enviando certificado...";
          const cert = await uploadEquipmentCert(file, eqId.value || tag);
          obj = { ...obj, ...cert };
        }
        await col.doc(eqId.value).update(obj);
      } else {
        const docRef = await col.add({
          ...obj,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: auth.currentUser?.email || ""
        });

        if (file) {
          eqFormMsg.textContent = "Enviando certificado...";
          const cert = await uploadEquipmentCert(file, docRef.id || tag);
          await col.doc(docRef.id).update(cert);
        }
      }

      eqFormMsg.textContent = "Salvo com sucesso!";
      eqForm.reset();
      eqId.value = "";
      eqInterval.value = "12";
      eqAlertDays.value = "30";
      renderCurrentCert(null, null);
      await loadData();
    } catch (err) {
      console.error(err);
      eqFormMsg.textContent = "Erro ao salvar: " + err.message;
    }
  };

  // ---------- LOAD / RENDER ----------
  async function loadData() {
    tbody.innerHTML = "";
    listMsg.textContent = "Carregando...";
    data = [];

    try {
      if (currentTab === "equipment") {
        const snap = await db.collection("equipment").orderBy("tag").get();
        snap.forEach(d => data.push({ id: d.id, ...d.data() }));
        renderEquipment(applyEquipmentFilters(data));
        listMsg.textContent = `${data.length} equipamento(s).`;
      } else {
        const snap = await db.collection(currentTab).orderBy("name").get();
        snap.forEach(d => data.push({ id: d.id, ...d.data() }));
        renderEntities(applySearch(data));
        listMsg.textContent = `${data.length} registro(s).`;
      }
    } catch (err) {
      console.error(err);
      listMsg.textContent = "Erro ao carregar: " + err.message;
    }
  }

  function applySearch(rows) {
    const t = (search.value || "").toLowerCase().trim();
    if (!t) return rows;
    if (currentTab === "equipment") {
      return rows.filter(r =>
        (r.tag || "").toLowerCase().includes(t) ||
        (r.type || "").toLowerCase().includes(t) ||
        (r.serial || "").toLowerCase().includes(t) ||
        (r.model || "").toLowerCase().includes(t)
      );
    }
    return rows.filter(r =>
      (r.name || "").toLowerCase().includes(t) ||
      (r.document || "").toLowerCase().includes(t) ||
      (r.city || "").toLowerCase().includes(t)
    );
  }

  function applyEquipmentFilters(rows) {
    // recalc derived client-side too (in case old docs)
    const normalized = rows.map(r => {
      if (!r.nextCalISO || typeof r.daysLeft !== "number" || !r.status) {
        const derived = computeEquipmentDerived(r);
        return { ...r, ...derived };
      }
      return r;
    });

    const mode = eqFilter.value || "all";
    let filtered = normalized;

    if (mode === "overdue") filtered = normalized.filter(r => r.status === "overdue");
    else if (mode === "due") filtered = normalized.filter(r => r.status === "due");
    else if (mode === "ok") filtered = normalized.filter(r => r.status === "ok");

    // apply search
    const t = (search.value || "").toLowerCase().trim();
    if (!t) return filtered;
    return filtered.filter(r =>
      (r.tag || "").toLowerCase().includes(t) ||
      (r.type || "").toLowerCase().includes(t) ||
      (r.serial || "").toLowerCase().includes(t) ||
      (r.model || "").toLowerCase().includes(t)
    );
  }

  function renderEntities(rows) {
    tbody.innerHTML = "";
    rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(r.name || "")}</td>
        <td>${escapeHtml(r.document || "")}</td>
        <td>${escapeHtml(r.city || "")}</td>
        <td>
          <button class="btn ghost small" data-edit="${r.id}">Editar</button>
          <button class="btn ghost small" data-del="${r.id}">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-edit]").forEach(btn => {
      btn.addEventListener("click", () => editEntity(btn.getAttribute("data-edit")));
    });
    tbody.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => delEntity(btn.getAttribute("data-del")));
    });
  }

  function renderEquipment(rows) {
    tbody.innerHTML = "";
    rows.forEach(r => {
      const days = (typeof r.daysLeft === "number") ? r.daysLeft : "";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(r.tag || "")}</td>
        <td>${escapeHtml(r.type || "")}<div class="small muted">${escapeHtml(r.model || "")}</div></td>
        <td>${escapeHtml(r.serial || "")}${r.certUrl ? `<div class="small"><a class="link" href="${r.certUrl}" target="_blank" rel="noopener noreferrer">PDF</a></div>` : ""}</td>
        <td>${escapeHtml(r.nextCalISO || "")}</td>
        <td>${statusBadge(r.status)}</td>
        <td>${days}</td>
        <td>
          <button class="btn ghost small" data-eq-edit="${r.id}">Editar</button>
          <button class="btn ghost small" data-eq-del="${r.id}">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-eq-edit]").forEach(btn => {
      btn.addEventListener("click", () => editEquipment(btn.getAttribute("data-eq-edit")));
    });
    tbody.querySelectorAll("[data-eq-del]").forEach(btn => {
      btn.addEventListener("click", () => delEquipment(btn.getAttribute("data-eq-del")));
    });
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function editEntity(id) {
    const r = data.find(x => x.id === id);
    if (!r) return;
    entityId.value = r.id;
    nameInput.value = r.name || "";
    docInput.value = r.document || "";
    contactIn.value = r.contact || "";
    emailIn.value = r.email || "";
    phoneIn.value = r.phone || "";
    cityIn.value = r.city || "";
    formMsg.textContent = "Editando...";
    formTitle.textContent = (currentTab === "clients") ? "Editar cliente" : "Editar fornecedor";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function delEntity(id) {
    if (!confirm("Excluir este registro?")) return;
    try {
      await db.collection(currentTab).doc(id).delete();
      await loadData();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  }

  function editEquipment(id) {
    const r = data.find(x => x.id === id);
    if (!r) return;

    eqId.value = r.id;
    eqTag.value = r.tag || "";
    eqType.value = r.type || "";
    eqModel.value = r.model || "";
    eqSerial.value = r.serial || "";
    eqLastCal.value = r.lastCalISO || "";
    eqInterval.value = String(r.intervalMonths || 12);
    eqAlertDays.value = String(r.alertDays || 30);
    eqLab.value = r.lab || "";
    eqNotes.value = r.notes || "";
    if (eqCert) eqCert.value = "";
    renderCurrentCert(r.certUrl || "", r.certName || "");
    eqFormMsg.textContent = "Editando...";
    eqFormTitle.textContent = "Editar equipamento";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function delEquipment(id) {
    if (!confirm("Excluir este equipamento?")) return;
    try {
      await db.collection("equipment").doc(id).delete();
      await loadData();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  }

  // ---------- SEARCH / FILTER ----------
  search.oninput = () => {
    if (currentTab === "equipment") renderEquipment(applyEquipmentFilters(data));
    else renderEntities(applySearch(data));
  };

  eqFilter.onchange = () => {
    if (currentTab === "equipment") renderEquipment(applyEquipmentFilters(data));
  };

  // ---------- EXPORT CSV ----------
  exportB.onclick = () => {
    if (!data.length) return alert("Nada para exportar.");

    if (currentTab === "equipment") {
      exportEquipmentCSV(applyEquipmentFilters(data));
    } else {
      exportEntityCSV(applySearch(data));
    }
  };

  function csvEscape(v) {
    const s = String(v ?? "");
    return `"${s.replaceAll('"','""')}"`;
  }

  function exportEntityCSV(rows) {
    const header = ["Nome","Documento","Contato","Email","Telefone","Cidade"];
    const lines = [header.map(csvEscape).join(";")];

    rows.forEach(r => {
      lines.push([
        r.name, r.document, r.contact, r.email, r.phone, r.city
      ].map(csvEscape).join(";"));
    });

    downloadCSV(lines.join("\n"), (currentTab === "clients") ? "clientes.csv" : "fornecedores.csv");
  }

  function exportEquipmentCSV(rows) {
    const header = ["Tag","Tipo","Modelo","Serial","UltimaCalibracao","IntervaloMeses","AvisarDias","ProximaCalibracao","Status","DiasRestantes","Lab","Notas"];
    const lines = [header.map(csvEscape).join(";")];

    rows.forEach(r => {
      lines.push([
        r.tag, r.type, r.model, r.serial, r.lastCalISO, r.intervalMonths, r.alertDays,
        r.nextCalISO, r.status, r.daysLeft, r.lab, r.notes
      ].map(csvEscape).join(";"));
    });

    downloadCSV(lines.join("\n"), "equipamentos.csv");
  }

  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // init UI
  showEntityUI();
  setTitles();
});

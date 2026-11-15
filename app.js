
"use strict";
/* =========================================================
   UTILIDADES
   ========================================================= */
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const MESES_L = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
function miles(entero){ return String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function eur(n, signo){
  if (n == null) return "sin importe";
  const s = Math.abs(n).toFixed(2).split(".");
  return (n < 0 ? "−" : (signo && n > 0 ? "+" : "")) + miles(s[0]) + "," + s[1] + " €";
}
const eur0 = n => (Math.round(n) < 0 ? "−" : "") + miles(Math.round(Math.abs(n))) + " €";
const eurS = n => n == null ? "¿?" : eur(n);            // saldo que puede faltar
const pct = v => v == null || !isFinite(v) ? "—" : (v < 0 ? "−" : "") + Math.abs(v).toFixed(1).replace(".", ",") + " %";
const tasa = m => !m.completo ? "mes sin cerrar" : m.ingresos ? pct(m.ahorro / m.ingresos * 100) : "—";
const r2 = n => Math.round(n * 100) / 100;
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const plural = (n, uno, varios) => n + " " + (n === 1 ? uno : varios);
const leer = t => { const [y,m,d] = t.split("-").map(Number); return new Date(y, m - 1, d || 1); };
const iso = d => d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
const ym = d => iso(d).slice(0, 7);
const sumar = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const corta = d => String(d.getDate()).padStart(2,"0") + "/" + String(d.getMonth()+1).padStart(2,"0");
const larga = d => DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES_L[d.getMonth()];
const nombreMes = k => { const [y, m] = k.split("-").map(Number); return MESES_L[m-1] + " " + y; };
const mesCorto = k => cap(MESES_L[+k.slice(5) - 1]);
const entre = (a, b) => Math.round((b - a) / 86400000);
const laborable = d => { const r = new Date(d); while (r.getDay() === 0 || r.getDay() === 6) r.setDate(r.getDate() + 1); return r; };
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $ = id => document.getElementById(id);
const ETQ = {exacto: "Exacto", ultimo_real: "Último real", por_confirmar: "Por confirmar", sin_importe: "Sin importe", aviso: "Aviso", hipotesis: "Hipótesis"};
// Iconos de trazo (24×24)
const ICO = {
  inicio: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  pasado: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 3"/>',
  futuro: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h3v3H8z"/>',
  herramientas: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  comprar: '<path d="M5 7h14l-1.5 11a2 2 0 0 1-2 1.7h-7A2 2 0 0 1 6.5 18z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',
  inversiones: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  financiacion: '<path d="M3 10l9-6 9 6"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/>',
  banco: '<path d="M3 9.5l9-5.5 9 5.5"/><path d="M5 10v8M9.7 10v8M14.3 10v8M19 10v8"/><path d="M3 20h18"/>',
  escudo: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>',
  liquidez: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const icono = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k] || ""}</svg>`;
const cert = c => `<span class="cert ${c}">${ETQ[c] || c}</span>`;

/* =========================================================
   MODELO
   ========================================================= */
const D = window.DATOS;
const C = D ? D.config : null;
const HOY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

// --- Cuentas: cada banco con su color, su extracto y su saldo. Admite también un datos.js antiguo (una sola cuenta).
// Saldo de una cuenta: el del último apunte de su extracto; si no hay extracto, el dado a mano (con su fecha y su fuente)
// (saldo + a_fecha + fuente); si tampoco, no se sabe y no se suma.
const CUENTAS = (() => {
  if (!D || !C) return [];
  const l = (C.cuentas || []).filter(c => c.activa !== false).map(c => ({...c}));
  if (!l.some(c => c.principal)){
    const v = C.cuenta_principal || {};
    l.unshift({id: "cra", nombre: String(v.nombre || "Cuenta").replace(/^Cuenta /, ""), color: "verde", principal: true});
  }
  const pri = l.find(c => c.principal), por = {};
  for (const c of l){
    c.movs = []; por[c.id] = c;
    c.cls = "b-" + (["verde", "azul"].includes(c.color) ? c.color : "gris");
    c.col = c.cls === "b-verde" ? "var(--verde)" : c.cls === "b-azul" ? "var(--azul)" : "var(--gris-b)";
    c.suave = c.cls === "b-verde" ? "var(--verde-suave)" : c.cls === "b-azul" ? "var(--azul-suave)" : "var(--raya-2)";
  }
  for (const m of D.movimientos || []){ const x = {...m, f: leer(m.fecha)}; x.cuenta = por[m.cuenta] ? m.cuenta : pri.id; por[x.cuenta].movs.push(x); }
  for (const c of l){
    if (c.movs.length){ c.saldo = c.movs[c.movs.length - 1].saldo; c.base = c.movs.reduce((a, m) => m.f > a ? m.f : a, c.movs[0].f); c.origen = "extracto"; }
    else if (c.saldo != null && c.a_fecha){ c.base = leer(c.a_fecha); c.origen = "dato"; }
    else { c.saldo = null; c.base = null; c.origen = null; }
  }
  return l;
})();
const PRI = CUENTAS.find(c => c.principal) || null;
const MULTI = CUENTAS.length > 1;
const CON_SALDO = CUENTAS.filter(c => c.saldo != null);
const MOVS = CUENTAS.flatMap(c => c.movs).sort((a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0);
// BASE: la fecha del dato más reciente (de ahí arranca el conjunto). DATO_VIEJO: la del más antiguo (frescura).
const BASE = CON_SALDO.length ? new Date(Math.max(...CON_SALDO.map(c => +c.base))) : new Date(HOY);
const DATO_VIEJO = CON_SALDO.length ? new Date(Math.min(...CON_SALDO.map(c => +c.base))) : BASE;
const cuentaDe = id => CUENTAS.find(c => c.id === id) || PRI;
const idCuenta = x => x && x.cuenta && CUENTAS.some(c => c.id === x.cuenta) ? x.cuenta : PRI.id;   // sin «cuenta» = la principal
const selCuentas = sel => sel === "todas" ? CUENTAS : CUENTAS.filter(c => c.id === sel);
const movsDe = sel => sel === "todas" ? MOVS : cuentaDe(sel).movs;
const enSel = (x, sel) => sel === "todas" || idCuenta(x) === sel;
const baseMovs = sel => { const l = selCuentas(sel).filter(c => c.movs.length); return l.length ? new Date(Math.min(...l.map(c => +c.base))) : BASE; };
const origenTxt = c => c.origen === "extracto" ? "Extracto al " + corta(c.base) : c.origen === "dato" ? "Dato del " + corta(c.base) + (c.fuente ? " · " + c.fuente : "") : "Falta el saldo";
const punto = c => `<span class="pb ${c.cls}"></span>`;
const banco = c => `<span class="banco ${c.cls}"><span class="pb"></span>${esc(c.nombre)}</span>`;

// --- Categorías: primero la que fija el CSV; si no, la primera cuyo patrón encaja
const CATS = C ? C.categorias.map(c => ({...c, re: c.patron ? new RegExp(c.patron, "i") : null})) : [];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
CAT.sin_categoria = {id: "sin_categoria", nombre: "Sin categoría", tipo: "gasto"};
function categorizar(m){
  let pat = null;
  for (const c of CATS) if (c.re && c.re.test(m.concepto)){ pat = c.id; break; }
  if (m.categoria === "neutro") return (pat && ["interno","compra_piso"].includes(CAT[pat].tipo)) ? pat : "interno";
  if (m.categoria && CAT[m.categoria]) return m.categoria;
  return pat || "sin_categoria";
}
for (const m of MOVS){
  m.cat = categorizar(m);
  m.tipo = m.cat === "sin_categoria" ? (m.importe > 0 ? "ingreso" : "gasto") : CAT[m.cat].tipo;
}

// --- Resumen por mes: ingresos y gastos corrientes (sin movimientos entre cuentas propias ni la compra del piso).
// sel = "todas" o el id de una cuenta. porCta guarda lo mismo separado por banco.
function resumenMeses(sel = "todas"){
  const r = {}, base = baseMovs(sel);
  for (const m of movsDe(sel)){
    const k = m.fecha.slice(0, 7);
    const x = r[k] || (r[k] = {k, ingresos: 0, gastos: 0, porCat: {}, porIng: {}, porCta: {}, interno: 0, compra: 0, hasta: m.f, n: 0});
    const b = x.porCta[m.cuenta] || (x.porCta[m.cuenta] = {ingresos: 0, gastos: 0, porCat: {}, n: 0});
    x.n++; b.n++; if (m.f > x.hasta) x.hasta = m.f;
    if (m.tipo === "ingreso"){ x.ingresos += m.importe; b.ingresos += m.importe; x.porIng[m.cat] = (x.porIng[m.cat] || 0) + m.importe; }
    else if (m.tipo === "gasto"){ x.gastos -= m.importe; b.gastos -= m.importe; x.porCat[m.cat] = (x.porCat[m.cat] || 0) - m.importe; b.porCat[m.cat] = (b.porCat[m.cat] || 0) - m.importe; }
    else if (m.tipo === "interno") x.interno += m.importe;
    else x.compra += m.importe;
  }
  return Object.values(r).sort((a, b) => a.k < b.k ? -1 : 1).map(x => {
    const finMes = new Date(+x.k.slice(0,4), +x.k.slice(5,7), 0);
    for (const c in x.porCat) x.porCat[c] = r2(x.porCat[c]);
    for (const c in x.porIng) x.porIng[c] = r2(x.porIng[c]);
    for (const b of Object.values(x.porCta)){ b.ingresos = r2(b.ingresos); b.gastos = r2(b.gastos); for (const c in b.porCat) b.porCat[c] = r2(b.porCat[c]); }
    return {...x, ingresos: r2(x.ingresos), gastos: r2(x.gastos), ahorro: r2(x.ingresos - x.gastos), interno: r2(x.interno), compra: r2(x.compra), completo: base >= finMes, finMes};
  });
}

// --- Ocurrencias de un cargo mensual (día fijo; sábado y domingo pasan al lunes)
function ocurrencias(dia, meses, desde, hasta){
  const r = []; let y = desde.getFullYear(), m = desde.getMonth() - 1;
  if (m < 0){ m = 11; y--; }
  while (new Date(y, m, 1) <= hasta){
    if (!meses || meses.includes(m + 1)){
      const d = laborable(new Date(y, m, Math.min(dia, new Date(y, m + 1, 0).getDate())));
      if (d > desde && d <= hasta) r.push(d);
    }
    m++; if (m > 11){ m = 0; y++; }
  }
  return r;
}

// --- Deudas con cuadro de amortización: cuota del mes y capital pendiente tras la última cuota pasada.
// La «última cuota pasada» se mira con la fecha del dato de la cuenta que la paga.
const deudaDe = id => C.deudas.find(d => d.id === id);
function cuotaEn(f, d){
  if (!f.cuadro) return f.importe;
  const deu = deudaDe(f.cuadro), x = deu && deu.cuadro && deu.cuadro.find(x => x.fecha.slice(0, 7) === ym(d));
  return x ? x.cuota : f.importe;
}
function filaCuadro(deu, d){ let r = null; for (const x of deu.cuadro || []) if (leer(x.fecha) <= d) r = x; return r; }
const baseDeuda = deu => { const f = C.fijos.find(f => f.cuadro === deu.id); return (f && cuentaDe(idCuenta(f)).base) || BASE; };
const pendienteDe = deu => { const x = deu.cuadro ? filaCuadro(deu, baseDeuda(deu)) : null; return x ? x.pendiente : deu.pendiente; };

// --- La previsión: solo resta lo que tiene importe real; lo demás se cuenta como «sin importe».
// Cada cuenta se prevé desde la fecha de su último dato. Un traspaso entre cuentas propias resta en una y suma en la otra.
function yaEnExtracto(f, d, c){
  if (!f.patron) return false;
  const re = new RegExp(f.patron, "i"), mes = ym(d), signo = f.tipo === "ingreso" ? 1 : -1;
  return c.movs.some(m => m.fecha.slice(0, 7) === mes && Math.sign(m.importe) === signo && re.test(m.concepto));
}
function eventosDe(c, fin){
  const desde = c.base || BASE, es = x => idCuenta(x) === c.id, ev = [];
  for (const f of C.fijos){
    if (f.activo === false || !es(f)) continue;
    for (const d of ocurrencias(f.dia, f.meses, desde, fin)){
      // Si ese mes ya está cobrado o cargado en el extracto (p. ej. el día 1 cae en domingo y entra antes), no se vuelve a contar
      if (yaEnExtracto(f, d, c)) continue;
      const imp = cuotaEn(f, d), nota = f.nota || "";
      if (imp == null) ev.push({fecha: d, concepto: f.nombre, importe: null, certeza: "sin_importe", clase: f.tipo, nota, origen: "fijo", id: f.id});
      else ev.push({fecha: d, concepto: f.nombre, importe: f.tipo === "ingreso" ? imp : -imp, certeza: f.certeza, clase: f.tipo, nota, origen: "fijo", id: f.id});
    }
  }
  const T = C.tarjetas;
  if (T && T.dia_cargo && es(T)) for (const d of ocurrencias(T.dia_cargo, null, desde, fin)){
    const liq = (T.liquidaciones || []).find(l => l.cargo && l.cargo.slice(0, 7) === ym(d));
    if (liq && liq.importe != null) ev.push({fecha: d, concepto: T.nombre, importe: -liq.importe, certeza: "exacto", clase: "gasto", nota: "Liquidación: " + (liq.fuente || ""), origen: "tarjeta"});
    else ev.push({fecha: d, concepto: T.nombre, importe: null, certeza: "sin_importe", clase: "gasto", nota: T.nota, origen: "tarjeta"});
  }
  for (const p of C.pendientes){
    if (!p.fecha || !es(p)) continue;
    let d = laborable(leer(p.fecha)), nota = p.nota || "";
    if (d <= desde){ d = sumar(desde, 1); nota = nota || "Vencido y sin cargar: se reserva desde el primer día"; }
    if (d > fin) continue;
    const imp = p.importe == null ? null : (p.clase === "cobro" ? p.importe : -p.importe);
    ev.push({fecha: d, concepto: p.nombre, importe: imp, certeza: imp == null ? "sin_importe" : (p.certeza || "exacto"), clase: p.clase === "cobro" ? "ingreso" : "gasto", nota, origen: "pendiente", id: p.id});
  }
  for (const v of C.vencimientos){
    if (!v.fecha || !es(v)) continue;
    const d = leer(v.fecha);
    // Recordatorio para revisarlo antes del vencimiento (aviso_dias)
    if (v.aviso_dias){ const r = laborable(sumar(d, -v.aviso_dias)); if (r > desde && r <= fin) ev.push({fecha: r, concepto: "Revisar: " + v.nombre.replace(/^Renovación del /, "").replace(/^seguro/, "Seguro"), importe: null, certeza: "aviso", clase: "aviso", nota: `Vence el ${corta(d)}${v.entidad ? " · " + v.entidad : ""}. Compara precios antes de que renueve solo`, origen: "revision"}); }
    if (d <= desde || d > fin) continue;
    if (v.es_cargo) ev.push({fecha: d, concepto: v.nombre, importe: v.importe == null ? null : -v.importe, certeza: v.importe == null ? "sin_importe" : (v.certeza || "exacto"), clase: "gasto", nota: v.nota, origen: "vencimiento"});
    else ev.push({fecha: d, concepto: v.nombre, importe: null, certeza: "aviso", clase: "aviso", nota: v.nota, origen: "vencimiento"});
  }
  for (const t of C.traspasos || []){
    if (t.activo === false || (t.de !== c.id && t.a !== c.id)) continue;
    const sale = t.de === c.id, otra = cuentaDe(sale ? t.a : t.de);
    for (const d of t.fecha ? [laborable(leer(t.fecha))] : ocurrencias(t.dia, t.meses, desde, fin)){
      if (!(d > desde && d <= fin) || yaEnExtracto({patron: t.patron, tipo: sale ? "gasto" : "ingreso"}, d, c)) continue;
      ev.push({fecha: d, concepto: (sale ? "Traspaso a " : "Traspaso desde ") + otra.nombre, importe: sale ? -t.importe : t.importe, certeza: t.certeza || "exacto", clase: "traspaso", sale, tr: t.id, de: t.de, a: t.a, nota: t.nota || t.nombre || "", origen: "traspaso"});
    }
  }
  for (const e of ev) e.cuenta = c.id;
  return ev;
}
// En el conjunto, las dos patas de un traspaso se anulan: queda una fila informativa que no cambia el total.
// Si solo una pata cae dentro de lo que falta por ver de su cuenta (la otra ya está en su extracto), esa sí cuenta.
function fusionarTraspasos(ev){
  const r = [], pares = {};
  for (const e of ev){ if (e.clase !== "traspaso") r.push(e); else (pares[e.tr + "|" + iso(e.fecha)] ||= []).push(e); }
  for (const l of Object.values(pares)){
    if (l.length < 2){ r.push(...l); continue; }
    const s = l.find(e => e.sale) || l[0];
    r.push({...s, concepto: "Traspaso " + cuentaDe(s.de).nombre + " → " + cuentaDe(s.a).nombre, importe: 0, mueve: Math.abs(s.importe), neutro: true, cuenta: null});
  }
  return r;
}
// Orden prudente dentro del día: gastos conocidos, sin importe, avisos y, al final, lo que entra
const ordenEv = e => e.clase === "ingreso" || (e.clase === "traspaso" && !e.sale && !e.neutro) ? 3 : e.certeza === "aviso" ? 2 : e.importe == null ? 1 : 0;
const _prev = {};
// sel: "todas" (el conjunto) o el id de una cuenta. extra: movimientos hipotéticos (validador de compras); nunca vienen de datos/.
function prevision(dias, extra, sel = "todas"){
  const clave = dias + "|" + sel;
  if (!extra && _prev[clave]) return _prev[clave];
  const todas = sel === "todas", cs = selCuentas(sel), fin = sumar(BASE, dias);
  let ev = cs.flatMap(c => eventosDe(c, fin));
  if (todas) ev = fusionarTraspasos(ev);
  for (const x of extra || []) if (x.fecha > BASE && x.fecha <= fin) ev.push({...x, certeza: "hipotesis", origen: "hipotesis"});
  ev.sort((a, b) => a.fecha - b.fecha || ordenEv(a) - ordenEv(b) || (a.importe || 0) - (b.importe || 0));
  const conS = cs.filter(c => c.saldo != null), s0 = conS.length ? r2(conS.reduce((a, c) => a + c.saldo, 0)) : null;
  const ini = todas ? BASE : (cs[0].base || BASE);
  let s = s0, min = s0 == null ? null : {saldo: s0, fecha: ini}, sinAntes = 0;
  for (const e of ev){
    if (e.importe != null){ if (s != null) s = r2(s + e.importe); }
    else if (e.certeza === "sin_importe") sinAntes++;
    e.saldo = s;
    if (min && e.importe != null && s < min.saldo) min = {saldo: s, fecha: e.fecha, previos: sinAntes};
  }
  // Tope de cada cargo sin importe: lo máximo que puede ser sin que el saldo baje de 0 dentro del horizonte
  if (s0 != null) for (let k = 0; k < ev.length; k++){
    const e = ev[k]; if (e.certeza !== "sin_importe") continue;
    let t = e.saldo, tf = e.fecha;
    for (let j = k + 1; j < ev.length; j++) if (ev[j].importe != null && ev[j].saldo < t){ t = ev[j].saldo; tf = ev[j].fecha; }
    e.tope = t; e.topeFecha = tf;
  }
  // Día a día, desde el dato más antiguo de las cuentas elegidas
  const d0 = new Date(Math.min(+ini, ...cs.map(c => +(c.base || BASE))));
  const porDia = []; let i = 0, sd = s0;
  for (let d = new Date(d0); d <= fin; d = sumar(d, 1)){
    const del = [];
    while (i < ev.length && ev[i].fecha <= d){ del.push(ev[i]); sd = ev[i].saldo; i++; }
    porDia.push({fecha: new Date(d), saldo: sd, ev: del});
  }
  const con = ev.filter(e => e.importe != null && e.clase !== "traspaso");
  const p = {
    dias, sel, todas, ini, fin, ev, porDia, min, final: s, s0,
    sinSaldo: cs.filter(c => c.saldo == null),
    sin: ev.filter(e => e.certeza === "sin_importe"),
    porConfirmar: ev.filter(e => e.certeza === "por_confirmar"),
    ingresos: r2(con.filter(e => e.importe > 0).reduce((a, e) => a + e.importe, 0)),
    gastos: r2(-con.filter(e => e.importe < 0).reduce((a, e) => a + e.importe, 0)),
  };
  if (!extra) _prev[clave] = p;
  return p;
}

// --- Saldo real al cerrar cada día (del extracto de una cuenta), desde su primer apunte hasta el último
function diasDe(c){
  if (c._dias) return c._dias;
  const r = []; if (!c.movs.length) return (c._dias = r);
  const ini = c.movs.reduce((a, m) => m.f < a ? m.f : a, c.movs[0].f);
  let j = 0, s = r2(c.movs[0].saldo - c.movs[0].importe);
  for (let d = new Date(ini); d <= c.base; d = sumar(d, 1)){
    const k = iso(d), mov = [];
    while (j < c.movs.length && c.movs[j].fecha <= k){ if (c.movs[j].fecha === k) mov.push(c.movs[j]); s = c.movs[j].saldo; j++; }
    r.push({fecha: new Date(d), k, saldo: s, mov});
  }
  return (c._dias = r);
}
// Historia del saldo real de las cuentas elegidas. Con varias: una línea por cuenta y el total.
// Total: antes del primer apunte de una cuenta cuenta su saldo de apertura; después del dato más antiguo ya no se suma.
function historia(sel){
  const cs = selCuentas(sel).filter(c => c.movs.length);
  if (!cs.length) return null;
  const porC = cs.map(c => { const d = diasDe(c); return {c, d, mapa: Object.fromEntries(d.map(q => [q.k, q])), apertura: r2(c.movs[0].saldo - c.movs[0].importe)}; });
  const ini = new Date(Math.min(...porC.map(x => +x.d[0].fecha))), fin = new Date(Math.max(...cs.map(c => +c.base))), comun = new Date(Math.min(...cs.map(c => +c.base)));
  const dias = [], mov = [], total = [], series = porC.map(x => ({c: x.c, v: []}));
  for (let d = new Date(ini); d <= fin; d = sumar(d, 1)){
    const k = iso(d), ms = []; let t = 0;
    porC.forEach((x, i) => {
      const q = x.mapa[k];
      series[i].v.push(q ? q.saldo : null);
      if (q){ t += q.saldo; ms.push(...q.mov); } else if (d < x.d[0].fecha) t += x.apertura;
    });
    dias.push(new Date(d)); mov.push(ms); total.push(d <= comun ? r2(t) : null);
  }
  return {dias, mov, total: cs.length > 1 ? total : null, series, comun, distintas: porC.some(x => +x.d[0].fecha !== +ini)};
}

// --- Indicadores
function fijosMensuales(sel = "todas"){
  let ing = 0, gas = 0, deuda = 0, n = 0;
  for (const f of C.fijos){
    if (f.activo === false || f.importe == null || f.meses || !enSel(f, sel)) continue;
    if (f.tipo === "ingreso") ing += f.importe; else { gas += f.importe; n++; }
    if (f.deuda) deuda += f.importe;
  }
  return {ing: r2(ing), gas: r2(gas), deuda: r2(deuda), n};
}
const COLCHON_BASE = () => r2(C.reglas.gastos_fijos_mensuales_colchon * (C.reglas.colchon_meses_estable || 3));
// Sin nómina fija activa (cambio de empleo): los ratios sobre ingresos no se calculan, en vez de dar una cifra absurda
const hayNomina = () => C.fijos.some(f => f.activo !== false && f.tipo === "ingreso" && f.importe != null && /n[oó]mina/i.test(f.id + " " + f.nombre));
const SIN_NOMINA = "Sin nómina fija activa: se calcula cuando entre la nueva";

// --- Lo que falta para que todo sea exacto (discreto: botón de la cabecera).
// Las tarjetas y lo marcado con no_preguntar no se preguntan: se esperan al extracto.
function datosQueFaltan(){
  const items = [];
  for (const c of CUENTAS.filter(c => c.saldo == null)) items.push({t: "Saldo de " + c.nombre, q: "Falta: saldo y fecha del dato (o su extracto)", i: "Mientras falte, " + c.nombre + " no entra en el total ni en la previsión", c});
  for (const x of C.pendientes.filter(x => x.importe == null && !x.no_preguntar))
    items.push({t: x.nombre, q: "Falta: importe" + (x.fecha ? "" : " y fecha"), i: x.nota || "", c: MULTI ? cuentaDe(idCuenta(x)) : null});
  for (const v of C.vencimientos){
    const falta = [];
    if (!v.fecha) falta.push(v.mes ? "día exacto" : "fecha");
    if (v.es_cargo && v.importe == null) falta.push("importe");
    if (falta.length) items.push({t: v.nombre, q: "Falta: " + falta.join(" e "), i: v.nota || ""});
  }
  for (const b of C.bienes.filter(b => b.valor == null)) items.push({t: b.nombre, q: "Falta: valor actual", i: b.nota || ""});
  for (const q of C.preguntas || []) items.push({t: q.texto, q: "", i: q.por_que || ""});
  return items;
}

// --- Posición líquida: las cuentas + todo lo que es medianamente líquido (efectivo, capital social, fondos, acciones). El piso no.
function posicionLiquida(){
  const partes = CUENTAS.map(c => ({id: c.id, n: c.nombre, v: c.saldo, d: origenTxt(c), ic: "banco", c}));
  for (const b of C.bienes) if (b.liquido) partes.push({id: b.id, n: b.nombre, v: b.valor, d: b.nota || "", ic: b.id === "efectivo" ? "liquidez" : "escudo"});
  const inv = C.inversiones || [];
  if (inv.length) for (const i of inv) partes.push({id: i.id, n: i.nombre, v: i.valor, d: i.nota || "", ic: "inversiones"});
  else partes.push({id: "inv", n: "Fondos y acciones", v: 0, d: "Aún no tienes", ic: "inversiones"});
  const enCuentas = r2(CON_SALDO.reduce((a, c) => a + c.saldo, 0));
  const total = r2(partes.filter(x => x.v != null).reduce((a, x) => a + x.v, 0));
  const comprometido = r2(C.pendientes.filter(x => x.importe != null && x.clase !== "cobro").reduce((a, x) => a + x.importe, 0));
  return {partes, enCuentas, total, comprometido, libre: r2(total - comprometido)};
}
function patrimonio(){
  const liq = posicionLiquida(), inm = C.bienes.filter(b => !b.liquido && b.valor != null);
  const deudas = C.deudas.map(d => ({...d, viva: pendienteDe(d)}));
  const activos = r2(liq.total + inm.reduce((a, b) => a + b.valor, 0));
  const pasivos = r2(deudas.reduce((a, d) => a + d.viva, 0) + liq.comprometido);
  return {liq, inm, deudas, activos, pasivos, neto: r2(activos - pasivos)};
}

// --- Segundo camino: generar_datos.py calcula por su cuenta la previsión y los meses (comprobaciones.modelo).
// La app los recalcula aquí y, si alguna cifra no coincide, lo dice en «Contraste de datos».
let _contraste = null;
function contrasteModelo(){
  if (_contraste) return _contraste;
  const M = D.comprobaciones && D.comprobaciones.modelo, av = []; let hechas = 0;
  if (!M) return (_contraste = {hechas, av});
  const igual = (a, b) => (a == null && b == null) || (a != null && b != null && Math.abs(a - b) < 0.011), e = v => v == null ? "sin dato" : eur(v);
  const comparar = (nombre, m, p) => {
    hechas++;
    const pm = p.min ? p.min.saldo : null, pf = p.min ? iso(p.min.fecha) : null;
    if (!igual(m.saldo, p.s0)) av.push(`${nombre}: el saldo de partida no coincide (la app ve ${e(p.s0)} y el generador ${e(m.saldo)})`);
    else if (!igual(m.min, pm) || !igual(m.final, p.final) || (m.min != null && m.min_fecha !== pf))
      av.push(`${nombre}: la previsión de la app (mínimo ${e(pm)}, final ${e(p.final)}) no coincide con la del generador (mínimo ${e(m.min)}, final ${e(m.final)})`);
    if (m.sin != null && m.sin !== p.sin.length) av.push(`${nombre}: la app ve ${p.sin.length} cargos sin importe y el generador ${m.sin}`);
  };
  if (M.base && M.base !== iso(BASE)) av.push(`La fecha de los datos no coincide: la app usa el ${corta(BASE)} y el generador el ${corta(leer(M.base))}`);
  else {
    for (const c of CUENTAS) if (M.cuentas && M.cuentas[c.id]) comparar(c.nombre, M.cuentas[c.id], prevision(M.dias, null, c.id));
    if (M.total) comparar(MULTI ? "Conjunto de cuentas" : "Previsión", M.total, prevision(M.dias, null, "todas"));
  }
  for (const [sel, meses] of Object.entries(M.meses || {})){
    if (sel !== "todas" && !CUENTAS.some(c => c.id === sel)) continue;
    hechas++;
    const mios = Object.fromEntries(resumenMeses(sel).map(x => [x.k, x])), claves = new Set([...Object.keys(meses), ...Object.keys(mios)]);
    for (const k of claves){
      const g = meses[k] || [0, 0], a = mios[k] || {ingresos: 0, gastos: 0};
      if (!igual(g[0], a.ingresos) || !igual(g[1], a.gastos)){ av.push(`${cap(nombreMes(k))}${sel === "todas" ? "" : " en " + cuentaDe(sel).nombre}: la app suma ${eur(a.ingresos)} de ingresos y ${eur(a.gastos)} de gastos; el generador, ${eur(g[0])} y ${eur(g[1])}. Alguna categoría no se lee igual`); break; }
    }
  }
  return (_contraste = {hechas, av});
}
const avisosDatos = () => ((D.comprobaciones && D.comprobaciones.avisos) || []).concat(contrasteModelo().av);

/* =========================================================
   GRÁFICOS (SVG a mano, sin librerías)
   Reglas: el color es del banco (o tinta para el total); línea continua = real, discontinua = previsto;
   el texto nunca va en el color de la serie; una sola ventanita con todas las series del día.
   ========================================================= */
function tooltipEn(contenedor){
  let tip = contenedor.querySelector(".tooltip");
  if (!tip){ tip = document.createElement("div"); tip.className = "tooltip"; tip.setAttribute("role", "status"); contenedor.appendChild(tip); }
  return {
    mostrar(html, x, y){
      tip.innerHTML = html; const w = tip.offsetWidth || 200;
      let l = x + 14; if (l + w > contenedor.clientWidth) l = x - w - 14;
      tip.style.left = Math.max(0, l) + "px"; tip.style.top = Math.max(0, y - 30) + "px"; tip.classList.add("visible");
    },
    ocultar(){ tip.classList.remove("visible"); }
  };
}
function pasoNice(rango){ for (const p of [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000]) if (rango / p <= 6) return p; return 100000; }

// Líneas en escalón sobre días. cfg = {dias, series: [{nombre, color, v, corte, puntos, ancho, relleno}], umbral, marcas, etiquetas, tip, aria, alto}
// La primera serie es la principal (más gruesa, con relleno y encima de las demás). corte = índice del último dato real:
// hasta ahí la línea es continua y desde ahí discontinua (0 = todo previsto; sin corte = todo real).
function lineas(hueco, cfg){
  const n = cfg.dias.length;
  if (n < 2){ hueco.innerHTML = `<p class="vacio-b">Aún no hay días suficientes para dibujarlo.</p>`; return; }
  const W = Math.max(300, hueco.clientWidth || 900), estrecho = W < 560, H = (cfg.alto || 230) + (estrecho ? 0 : 60);
  const M = {t: 24, r: estrecho ? 14 : 24, b: 30, l: estrecho ? 52 : 64};
  const vals = [0]; for (const q of cfg.series) for (const v of q.v) if (v != null) vals.push(v);
  if (cfg.umbral) vals.push(cfg.umbral.v);
  const vmin0 = Math.min(...vals), vmax0 = Math.max(...vals), paso = pasoNice(vmax0 - vmin0);
  const vmin = Math.floor(vmin0 / paso) * paso, vmax = Math.max(vmin + paso, Math.ceil(vmax0 * 1.06 / paso) * paso);
  const x = i => +(M.l + (W - M.l - M.r) * (i / (n - 1))).toFixed(1), y = v => +(M.t + (H - M.t - M.b) * (1 - (v - vmin) / (vmax - vmin))).toFixed(1);
  const pri = cfg.series[0], y0 = y(Math.max(vmin, 0)), ancho = W - M.l - M.r;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" tabindex="0" style="touch-action:pan-y" aria-label="${esc(cfg.aria || "")}">`;
  if (cfg.umbral && cfg.umbral.v > 0) s += `<rect x="${M.l}" y="${y(cfg.umbral.v)}" width="${ancho}" height="${Math.max(0, y0 - y(cfg.umbral.v))}" fill="var(--aviso-suave)" opacity=".55"/>`;
  if (vmin < 0) s += `<rect x="${M.l}" y="${y(0)}" width="${ancho}" height="${y(vmin) - y(0)}" fill="var(--critico-suave)"/>`;
  for (let v = vmin; v <= vmax + 1e-6; v += paso)
    s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "var(--tinta-2)" : "var(--raya-2)"}" stroke-width="1"/><text x="${M.l - 8}" y="${y(v) + 4}" text-anchor="end" class="num">${eur0(v)}</text>`;
  const quincena = n <= 130 && !estrecho; let marcasX = 0;
  cfg.dias.forEach((d, i) => { const dd = d.getDate();
    if (dd === 1 || (dd === 15 && quincena)){ marcasX++; s += `<text x="${x(i)}" y="${H - M.b + 18}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}">${dd} ${MESES[d.getMonth()]}</text><line x1="${x(i)}" x2="${x(i)}" y1="${H - M.b}" y2="${H - M.b + 4}" stroke="var(--raya)"/>`; } });
  if (marcasX < 2 && cfg.dias[n - 1].getDate() > 3) s += `<text x="${x(n - 1)}" y="${H - M.b + 18}" text-anchor="end">${cfg.dias[n - 1].getDate()} ${MESES[cfg.dias[n - 1].getMonth()]}</text>`;
  if (cfg.umbral){ const yc = y(cfg.umbral.v);
    s += `<line x1="${M.l}" x2="${W - M.r}" y1="${yc}" y2="${yc}" stroke="var(--aviso)" stroke-width="1.5" stroke-dasharray="2 3"/><text x="${W - M.r - 4}" y="${yc - 5}" text-anchor="end" font-size="11" paint-order="stroke" stroke="var(--hoja)" stroke-width="3" stroke-linejoin="round">${esc(cfg.umbral.texto)} ${eur0(cfg.umbral.v)}</text>`; }
  const camino = (v, a, b) => { let d = "", ab = false; for (let i = a; i <= b; i++){ if (v[i] == null){ ab = false; continue; } d += ab ? ` H ${x(i)} V ${y(v[i])}` : `M ${x(i)} ${y(v[i])}`; ab = true; } return d; };
  const trazo = (q, esPri) => {
    const c = q.corte == null ? n - 1 : q.corte, w = q.ancho || (esPri ? 2 : 1.5), fijo = q.puntos ? ` stroke-dasharray="${q.puntos}" stroke-linecap="round"` : "";
    return (c > 0 ? `<path d="${camino(q.v, 0, c)}" fill="none" stroke="${q.color}" stroke-width="${w}" stroke-linejoin="round"${fijo}/>` : "")
      + (c < n - 1 ? `<path d="${camino(q.v, c, n - 1)}" fill="none" stroke="${q.color}" stroke-width="${w}" stroke-linejoin="round"${fijo || ` stroke-dasharray="${esPri ? "6 4" : "4 3"}"`}/>` : "");
  };
  // Relleno bajo la serie principal (tramo sin huecos)
  const con = pri.v.map((v, i) => v == null ? -1 : i).filter(i => i >= 0);
  if (pri.relleno && con.length > 1) s += `<path d="${camino(pri.v, con[0], con[con.length - 1])} V ${y0} H ${x(con[0])} Z" fill="${pri.relleno}"/>`;
  for (const q of cfg.series.slice(1)) s += trazo(q, false);
  s += trazo(pri, true);
  for (const m of cfg.marcas || []){ const px = x(m.i), py = y(m.v);
    s += m.tipo === "sin" ? `<circle cx="${px}" cy="${py}" r="8" fill="var(--hoja)" stroke="var(--critico)" stroke-width="2"/><text x="${px}" y="${py + 4}" text-anchor="middle" style="fill:var(--critico);font-weight:800" font-size="11">?</text>`
      : `<rect x="${px - 6}" y="${py - 6}" width="12" height="12" rx="3" fill="var(--morado)" stroke="var(--hoja)" stroke-width="2"/>`; }
  // Etiquetas directas: solo las que caben sin pisarse
  const cajas = [];
  for (const e of cfg.etiquetas || []){
    const px = x(e.i), py = y(e.v), izq = px > W * (estrecho ? .5 : .66), texto = estrecho && e.corto ? e.corto : e.texto, largo = (texto || "").length * 7.3;
    s += `<circle cx="${px}" cy="${py}" r="${e.critico ? 6 : 4.5}" fill="${e.critico ? "var(--critico)" : pri.color}" stroke="var(--hoja)" stroke-width="2"/>`;
    if (!texto) continue;
    for (const arriba of (e.arriba || py > H - M.b - 36 ? [true, false] : [false, true])){
      const ty = arriba ? py - 10 : py + 19, caja = {x1: izq ? px - 9 - largo : px + 9, x2: izq ? px - 9 : px + 9 + largo, y1: ty - 12, y2: ty + 4};
      if (caja.y1 < 0 || caja.y2 > H - M.b + 2 || cajas.some(b => caja.x1 < b.x2 && caja.x2 > b.x1 && caja.y1 < b.y2 && caja.y2 > b.y1)) continue;
      cajas.push(caja);
      s += `<text x="${px + (izq ? -9 : 9)}" y="${ty}" text-anchor="${izq ? "end" : "start"}" paint-order="stroke" stroke="var(--hoja)" stroke-width="4" stroke-linejoin="round" style="fill:var(--tinta);font-weight:700" class="num">${esc(texto)}</text>`;
      break;
    }
  }
  s += `<line class="cur" x1="0" x2="0" y1="${M.t}" y2="${H - M.b}" stroke="var(--tinta-2)" visibility="hidden"/><rect class="zona" x="${M.l}" y="${M.t}" width="${ancho}" height="${H - M.t - M.b}" fill="transparent"/></svg>`;
  hueco.innerHTML = s;
  const svg = hueco.querySelector("svg"), cur = svg.querySelector(".cur"), zona = svg.querySelector(".zona"), fig = hueco.closest("figure") || hueco.parentElement, tt = tooltipEn(fig);
  let act = cfg.inicio != null ? cfg.inicio : n - 1, reloj = null;
  const ver = i => {
    clearTimeout(reloj);
    act = Math.max(0, Math.min(n - 1, i)); const cx = x(act);
    const fr = fig.getBoundingClientRect(), sr = svg.getBoundingClientRect(), k = sr.width / W;
    cur.setAttribute("x1", cx); cur.setAttribute("x2", cx); cur.setAttribute("visibility", "visible");
    const q = cfg.series.find(q => q.v[act] != null);
    tt.mostrar(cfg.tip(act), sr.left - fr.left + cx * k, sr.top - fr.top + y(q ? q.v[act] : 0) * k);
  };
  const oc = () => { tt.ocultar(); cur.setAttribute("visibility", "hidden"); };
  const idx = ev => { const r = svg.getBoundingClientRect(); return Math.round(((ev.clientX - r.left) * W / r.width - M.l) / ancho * (n - 1)); };
  zona.addEventListener("pointermove", ev => ver(idx(ev)));
  zona.addEventListener("pointerdown", ev => ver(idx(ev)));
  zona.addEventListener("pointerleave", ev => { if (ev.pointerType === "mouse") oc(); else { clearTimeout(reloj); reloj = setTimeout(oc, 3000); } });
  svg.addEventListener("focus", () => ver(act)); svg.addEventListener("blur", oc);
  svg.addEventListener("keydown", e => { if (e.key === "ArrowRight"){ e.preventDefault(); ver(act + 1); } if (e.key === "ArrowLeft"){ e.preventDefault(); ver(act - 1); } if (e.key === "Escape") oc(); });
}

// Saldo previsto de p (una previsión). opc.color y opc.relleno: los del banco elegido (sin ellos, tinta: es el conjunto);
// opc.otras = [{c, p}]: la previsión de cada cuenta, en su color, debajo del total; opc.comparar: la previsión sin la compra;
// opc.colchon: marca el colchón base (solo tiene sentido con todo el dinero junto).
function graficoSaldo(hueco, p, opc){
  opc = opc || {};
  if (p.s0 == null){ hueco.innerHTML = `<p class="vacio-b"><b>Falta el saldo</b>Sin saldo de partida no se puede dibujar la previsión.</p>`; return; }
  const dias = p.porDia.map(q => q.fecha), n = dias.length, pos = Object.fromEntries(dias.map((d, i) => [iso(d), i]));
  const alinear = pd => { const w = new Array(n).fill(null); for (const q of pd){ const i = pos[iso(q.fecha)]; if (i != null) w[i] = q.saldo; } return w; };
  const series = [{nombre: opc.otras ? "Total previsto" : "Saldo previsto", color: opc.color || "var(--tinta)", v: p.porDia.map(q => q.saldo), corte: 0, relleno: opc.relleno || "var(--raya-2)"}];
  for (const o of opc.otras || []) series.push({nombre: o.c.nombre, color: o.c.col, v: alinear(o.p.porDia), corte: 0});
  if (opc.comparar) series.push({nombre: "Sin la compra", color: "var(--tinta-3)", v: alinear(opc.comparar.porDia), corte: 0, puntos: "1 4", ancho: 2});
  const marcas = [];
  p.porDia.forEach((q, i) => { if (q.ev.some(e => e.certeza === "sin_importe")) marcas.push({i, v: q.saldo, tipo: "sin"}); if (q.ev.some(e => e.certeza === "hipotesis")) marcas.push({i, v: q.saldo, tipo: "hip"}); });
  const etiquetas = [], iMin = pos[iso(p.min.fecha)];
  if (iMin != null && p.min.saldo < p.s0) etiquetas.push({i: iMin, v: p.min.saldo, critico: p.min.saldo < 0, texto: `Día más justo ${corta(p.min.fecha)}: ${eur(p.min.saldo)}`, corto: `${corta(p.min.fecha)}: ${eur0(p.min.saldo)}`});
  etiquetas.push({i: n - 1, v: p.final, texto: eur(p.final), corto: eur0(p.final)});
  lineas(hueco, {dias, series, marcas, etiquetas, inicio: iMin != null ? iMin : n - 1,
    umbral: opc.colchon ? {v: COLCHON_BASE(), texto: "Colchón base"} : null,
    aria: `Saldo previsto hasta el ${corta(p.fin)}. Día más justo: ${eur(p.min.saldo)} el ${corta(p.min.fecha)}.`,
    tip: i => { const q = p.porDia[i];
      let h = `<b>${esc(cap(larga(q.fecha)))}</b><div class="fila"><span>${i === 0 ? "Saldo real" : series[0].nombre}</span><b class="num">${eur(q.saldo)}</b></div>`;
      for (const o of series.slice(1)) if (o.v[i] != null) h += `<div class="fila"><span><i class="clave" style="background:${o.color}"></i>${esc(o.nombre)}</span><span class="num">${eur(o.v[i])}</span></div>`;
      for (const e of q.ev) h += `<div class="fila"><span>${esc(e.concepto)}</span><span class="num">${e.neutro ? "↔ " + eur0(e.mueve) : e.importe == null ? (e.certeza === "aviso" ? "aviso" : "¿?") : eur(e.importe, true)}</span></div>`;
      return h; }});
}
const leyendaSaldo = o => `<div class="leyenda"><span><i class="discontinua" style="border-top-color:${o.color || "var(--tinta)"}"></i>${o.otras ? "Total previsto" : "Saldo previsto"}</span>`
  + (o.otras || []).map(x => `<span><i class="discontinua" style="border-top-color:${x.c.col}"></i>${esc(x.c.nombre)}</span>`).join("")
  + (o.comparar ? `<span><i class="discontinua" style="border-top-style:dotted;border-top-color:var(--tinta-3)"></i>Sin la compra</span><span><i style="background:var(--morado)"></i>La compra (Hipótesis)</span>` : "")
  + (o.colchon ? `<span><i style="background:var(--aviso-suave);border:1px dashed var(--aviso)"></i>Por debajo del colchón</span>` : "")
  + `<span><b class="mal">?</b> cargo sin importe</span></div>`;

// Saldo real día a día (Pasado). h = historia(sel); k = mes "AAAA-MM" o null para todo
function graficoHistoria(hueco, h, k){
  const idx = []; if (h) h.dias.forEach((d, i) => { if (!k || ym(d) === k) idx.push(i); });
  if (idx.length < 2){ hueco.innerHTML = `<p class="vacio-b">${h ? "Aún no hay días suficientes para dibujarlo." : "Sin extracto todavía."}</p>`; return; }
  const a = idx[0], b = idx[idx.length - 1], tramo = v => v.slice(a, b + 1), dias = tramo(h.dias), mov = tramo(h.mov);
  const total = h.total ? tramo(h.total) : null, varias = total && total.some(v => v != null);
  const series = h.series.map(q => ({nombre: q.c.nombre, color: q.c.col, v: tramo(q.v), relleno: varias ? null : q.c.suave})).filter(q => q.v.some(v => v != null));
  if (varias) series.unshift({nombre: "Total", color: "var(--tinta)", v: total, relleno: "var(--raya-2)"});
  if (!series.length){ hueco.innerHTML = `<p class="vacio-b">Sin movimientos en este periodo.</p>`; return; }
  const pv = series[0].v, con = pv.map((v, i) => v == null ? -1 : i).filter(i => i >= 0), etiquetas = [];
  if (con.length){ let mx = con[0], mn = con[0]; for (const i of con){ if (pv[i] > pv[mx]) mx = i; if (pv[i] <= pv[mn]) mn = i; }
    etiquetas.push({i: mx, v: pv[mx], arriba: true, texto: `Máx. ${eur0(pv[mx])} · ${corta(dias[mx])}`, corto: `Máx. ${eur0(pv[mx])}`});
    if (mn !== mx) etiquetas.push({i: mn, v: pv[mn], texto: `Mín. ${eur0(pv[mn])} · ${corta(dias[mn])}`, corto: `Mín. ${eur0(pv[mn])}`}); }
  lineas(hueco, {dias, series, etiquetas, alto: 210,
    aria: `Saldo real del ${corta(dias[0])} al ${corta(dias[dias.length - 1])}`,
    tip: i => { let t = `<b>${esc(cap(larga(dias[i])))}</b>`;
      for (const q of series) if (q.v[i] != null) t += `<div class="fila"><span>${series.length > 1 ? `<i class="clave" style="background:${q.color}"></i>` : ""}${series.length > 1 ? esc(q.nombre) : "Saldo"}</span><b class="num">${eur(q.v[i])}</b></div>`;
      if (mov[i].length) t += `<div class="fila"><span>${plural(mov[i].length, "movimiento", "movimientos")}</span><span class="num">${eur(r2(mov[i].reduce((s, m) => s + m.importe, 0)), true)}</span></div>`;
      return t; }});
}
const leyendaHistoria = h => h && h.total ? `<div class="leyenda"><span><i class="linea" style="background:var(--tinta)"></i>Total</span>${h.series.map(q => `<span><i class="linea" style="background:${q.c.col}"></i>${esc(q.c.nombre)}</span>`).join("")}</div>` : "";

/* =========================================================
   PIEZAS
   ========================================================= */
const ESTADO = {cuenta: "todas", verTodos: false, horizonte: 60, futuro: "lista", mesCal: ym(HOY > BASE ? HOY : BASE), diaSel: null, mesPasado: null, filtro: {cat: "", q: "", tipo: ""},
  compra: {que: "", importe: "", fecha: iso(sumar(HOY > BASE ? HOY : BASE, 1)), forma: "cuenta", tipo: "consumo", cuota: "", plazo: "", entrada: "", reventa: "", ingreso: ""}, evaluada: false};
try { const g = JSON.parse(localStorage.getItem("estado-finanzas") || "{}"); if ([30, 60, 90, 180].includes(g.horizonte)) ESTADO.horizonte = g.horizonte; if (["lista", "calendario"].includes(g.futuro)) ESTADO.futuro = g.futuro; } catch(e) {}
const guardar = () => { try { localStorage.setItem("estado-finanzas", JSON.stringify({horizonte: ESTADO.horizonte, futuro: ESTADO.futuro})); } catch(e) {} };

const selectorHorizonte = () => `<span class="segmentos" role="group" aria-label="Horizonte">${[30, 60, 90, 180].map(d => `<button type="button" data-horizonte="${d}" aria-pressed="${ESTADO.horizonte === d}">${d} d</button>`).join("")}</span>`;
const seg = (k, obj, sel) => `<span class="segmentos" role="group">${Object.entries(obj).map(([v, n]) => `<button type="button" data-${k}="${v}" aria-pressed="${sel === v}">${Array.isArray(n) ? n[0] : n}</button>`).join("")}</span>`;
function anillo(frac, color, texto){
  const r = 22, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  return `<svg class="anillo" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="${r}" fill="none" stroke="var(--raya-2)" stroke-width="7"/><circle cx="28" cy="28" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 28 28)"/><text x="28" y="32" text-anchor="middle" font-size="12" font-weight="800" style="fill:var(--tinta)">${texto ?? Math.round(f * 100) + "%"}</text></svg>`;
}
const vacio = (t, x) => `<div class="bloque"><p class="vacio-b"><b>${t}</b>${x}</p></div>`;

// Fila de un movimiento previsto. conBanco: enseña de qué cuenta es (punto de color + nombre)
function filaMov(e, conSaldo, conBanco){
  const tipo = e.clase === "traspaso" ? "tra" : e.certeza === "sin_importe" ? "sin" : e.certeza === "aviso" ? "ven" : e.certeza === "hipotesis" ? "hip" : e.importe > 0 ? "ing" : "gas";
  const ic = {sin: "?", ven: "!", hip: "◆", ing: "↑", gas: "↓", tra: "↔"}[tipo];
  const sub = tipo === "tra" ? (e.neutro ? "Entre tus cuentas · no cambia el total" : "Entre tus cuentas")
    : e.certeza === "sin_importe" ? (e.origen === "tarjeta" ? "Sin restar hasta ver la liquidación" : "Sin importe · no se resta")
    : e.certeza === "aviso" ? (e.origen === "revision" ? "Recordatorio" : "Aviso") : ETQ[e.certeza];
  const c = conBanco && e.cuenta ? cuentaDe(e.cuenta) : null;
  return `<li class="mov ${tipo}"><span class="fd"><b>${e.fecha.getDate()}</b>${MESES[e.fecha.getMonth()]}</span><span class="mi" aria-hidden="true">${ic}</span>
    <span class="mc"><span class="mn">${esc(cap(e.concepto))}</span><span class="ms">${c ? punto(c) + esc(c.nombre) + " · " : ""}${esc(sub)}</span></span>
    <span class="mv"><b class="num ${e.importe > 0 ? "positivo" : tipo === "sin" ? "mal" : ""}">${e.neutro ? eur(e.mueve) : e.importe == null ? (tipo === "sin" ? "¿?" : "") : eur(e.importe, true)}</b>${conSaldo && e.importe != null && e.saldo != null ? `<span class="num ${e.saldo < 0 ? "mal" : ""}">${eur0(e.saldo)}</span>` : ""}</span></li>`;
}
const listaAlertas = l => `<ul class="alertas">${l.map(a => `<li class="${a.nivel}"><span class="ico" aria-hidden="true">${a.nivel === "info" ? "i" : "!"}</span><span>${esc(a.texto)}</span></li>`).join("")}</ul>`;
// Próxima nómina con importe (la de cualquier banco)
const proxNomina = p => p.ev.find(e => e.clase === "ingreso" && e.importe != null && /n[oó]mina/i.test((e.id || "") + " " + e.concepto));

// --- Cargos que no se pueden cubrir en una previsión: el primero, cuánto falta, para qué día y qué pasa si se devuelve
const anteriorLaborable = d => { const r = sumar(d, -1); while (r.getDay() === 0 || r.getDay() === 6) r.setDate(r.getDate() - 1); return r; };
function siDevuelve(e){
  const x = e.origen === "tarjeta" ? C.tarjetas : e.origen === "pendiente" ? C.pendientes.find(q => q.id === e.id) : C.fijos.find(f => f.id === e.id);
  return (x && x.si_no_hay_saldo) || C.reglas.si_no_hay_saldo_general || {gravedad: "media", texto: "Recibo domiciliado: si no hay saldo, se devuelve."};
}
function sinCubrir(p){
  if (!p.min) return null;
  const malos = p.ev.filter(e => e.importe != null && e.importe < 0 && e.saldo < 0);
  if (!malos.length) return null;
  const primero = malos[0], idx = p.ev.indexOf(primero);
  // Tramo en negativo: desde el primer cargo sin saldo hasta que una entrada lo devuelve a positivo
  let peor = 0, vuelve = null;
  for (const e of p.ev.slice(idx)){ if (e.importe == null) continue; if (e.saldo < peor) peor = e.saldo; if (e.saldo >= 0 && e.importe > 0){ vuelve = e; break; } }
  const iVuelve = vuelve ? p.ev.indexOf(vuelve) : Infinity, tramo = malos.filter(e => p.ev.indexOf(e) < iVuelve);
  const mismoDia = p.ev.filter(e => e.importe != null && e.importe < 0 && iso(e.fecha) === iso(primero.fecha));
  // falta: lo justo para el primer tramo en negativo. total: lo que hace falta para no bajar de 0 ningún día del periodo
  return {primero, falta: r2(-peor), total: r2(Math.max(-peor, -p.min.saldo)), peorFecha: p.min.fecha, faltaPrimerDia: r2(-Math.min(...mismoDia.map(e => e.saldo))), limite: anteriorLaborable(primero.fecha), cargos: tramo.map(e => ({...e, si: siDevuelve(e)})), mismoDia, vuelve};
}
// --- Tensiones: qué cuentas se quedan en negativo y si otra cuenta tuya puede cubrirlo con un traspaso.
// Margen de la otra cuenta = lo que puede soltar el día límite sin quedarse ella en negativo después.
// «Cubierto» = con ese margen se tapa todo el periodo, no solo el primer cargo.
// Es un cálculo que se enseña como tal: nunca se apunta en datos/. El traspaso de verdad lo decides tú.
function tensiones(dias, sel = "todas"){
  const r = [];
  for (const c of CON_SALDO){
    if (sel !== "todas" && c.id !== sel) continue;
    const p = prevision(dias, null, c.id), s = sinCubrir(p);
    if (!s) continue;
    const ayudas = CUENTAS.filter(o => o.id !== c.id).map(o => {
      if (o.saldo == null) return {c: o, margen: null, cubre: false, cubrePrimero: false};
      let m = Infinity; for (const q of prevision(dias, null, o.id).porDia) if (q.fecha >= s.limite && q.saldo < m) m = q.saldo;
      if (m === Infinity) m = o.saldo;
      return {c: o, min: m, margen: r2(Math.max(0, m)), cubre: m >= s.total, cubrePrimero: m >= s.falta};
    });
    r.push({c, p, s, ayudas, cubierto: r2(ayudas.reduce((a, x) => a + (x.margen || 0), 0)) >= s.total});
  }
  return r;
}
// ¿Llegas? Con varias cuentas no basta con que el total sea positivo: cada recibo se carga en su banco.
function veredicto(p, T){
  const colchon = COLCHON_BASE(), m = p.min, una = MULTI && !p.todas ? cuentaDe(p.sel) : null;
  if (!m) return {clase: "neutro", t: "Falta el saldo", h: una ? `Sin el saldo de ${una.nombre} no se puede saber si llega` : "Sin saldo no se puede saber si llegas"};
  const mal = T.filter(t => !t.cubierto), mov = T.filter(t => t.cubierto);
  if (mal.length) return {clase: "malo", t: una ? "No llega" : "No llegas", h: `${MULTI ? mal[0].c.nombre + " se queda" : "Te quedas"} en negativo el ${corta(mal[0].s.primero.fecha)}`};
  // Un banco solo puede quedar en negativo y aun así llegar si otro tuyo lo cubre (mov); el total, no
  if (m.saldo < 0 && !(una && mov.length)) return {clase: "malo", t: una ? "No llega" : "No llegas", h: una ? `${una.nombre} queda en negativo el ${corta(m.fecha)}` : `El ${corta(m.fecha)} el total queda en negativo`};
  if (mov.length) return {clase: "justo", t: una ? "Llega con un traspaso" : "Llegas moviendo dinero", h: `Pasa ${eur(mov[0].s.total)} a ${mov[0].c.nombre} ${plazo(mov[0].s)}`};
  if (una) return {clase: "bueno", t: "Llega", h: `No baja de 0 hasta el ${corta(p.fin)}`};
  if (m.saldo < colchon) return {clase: "justo", t: "Llegas, sin colchón", h: `El ${corta(m.fecha)} bajas de tu colchón`};
  return {clase: "bueno", t: "Llegas con colchón", h: `El saldo no baja del colchón hasta el ${corta(p.fin)}`};
}
// Plazo para tener el dinero: el día hábil anterior al cargo; si ya ha pasado, «cuanto antes»
const plazo = (s, largo) => s.limite <= HOY ? "cuanto antes" : "antes del " + (largo ? larga(s.limite) : corta(s.limite));
const GRAV = {alta: ["rojo", "Grave"], media: ["oro", "Media"], baja: ["", "Leve"]};
function textoAyuda(t){
  return t.ayudas.map(a => {
    const n = esc(a.c.nombre);
    if (a.margen == null) return `En <b>${n}</b> no sé cuánto tienes: dile el saldo al agente y te digo si lo cubre.`;
    if (a.cubre) return `<b>Puedes pasarlo desde ${n}</b>: con ${eur(t.s.total)} queda cubierto todo el periodo y a ${n} le quedarían <b class="num">${eur(r2(a.min - t.s.total))}</b> en su día más justo.`;
    if (a.cubrePrimero) return `<b>${n}</b> cubre el primer cargo, pero no todo el periodo: puede dejarte <b class="num">${eur(a.margen)}</b> sin quedarse corta y hacen falta ${eur(t.s.total)}.`;
    if (a.margen > 0) return `<b>${n}</b> solo puede dejarte <b class="num">${eur(a.margen)}</b> sin quedarse corta: seguirían faltando <b class="num">${eur(r2(t.s.total - a.margen))}</b>.`;
    return `<b>${n}</b> no tiene margen para cubrirlo.`;
  }).join(" ");
}
// compacto = solo la cifra y qué hacer (Inicio); completo = además, cargo a cargo (Futuro)
function bloqueSinCubrir(T, compacto){
  return T.map(t => {
    const s = t.s, varios = s.mismoDia.length > 1, tarde = s.limite <= HOY, ayuda = textoAyuda(t);
    const todo = s.total > s.falta + 0.005 ? `<p class="sub">Eso es lo justo para el primer cargo. Para no bajar de 0 ningún día hasta el ${corta(t.p.fin)} hacen falta <b class="num">${eur(s.total)}</b> en total: el peor día es el ${corta(s.peorFecha)}.</p>` : "";
    return `<section class="bloque sincubrir">
    <h3>Para no quedarte en negativo${MULTI ? " " + banco(t.c) : ""}</h3>
    <p class="sc-cifra">Ten <b class="num">${eur(s.falta)}</b> más en ${MULTI ? esc(t.c.nombre) : "la cuenta"} ${tarde ? `cuanto antes: el cargo es el <b>${larga(s.primero.fecha)}</b>` : `antes del <b>${larga(s.limite)}</b>`}</p>
    ${todo}${ayuda ? `<p class="sub">${ayuda}</p>` : ""}
    ${compacto ? `<p class="sub" style="margin-bottom:0">Primer cargo sin saldo: <b>${esc(s.primero.concepto)}</b>, el ${corta(s.primero.fecha)}. <button class="enlace" type="button" data-ir="futuro">Ver el detalle</button></p>` : `
    <p class="sub">Primer cargo sin saldo: <b>${esc(s.primero.concepto)}</b>, el ${corta(s.primero.fecha)}${varios ? `. Ese día hay ${s.mismoDia.length} cargos y no se sabe cuál pasa antes: cuenta con tenerlos todos (${eur(s.faltaPrimerDia)})` : ""}.${s.vuelve ? ` Vuelve a positivo el ${corta(s.vuelve.fecha)} con «${esc(s.vuelve.concepto)}».` : ""}</p>
    <ul class="sc-lista">${s.cargos.map(e => { const g = GRAV[e.si.gravedad] || GRAV.media; return `<li><div class="sc-cab"><span class="fd"><b>${e.fecha.getDate()}</b>${MESES[e.fecha.getMonth()]}</span><span class="mn">${esc(e.concepto)}</span><b class="num">${eur(e.importe, true)}</b></div>
      <div class="sc-det"><span class="chip ${g[0]}">${g[1]}</span><span>Faltan <b class="num">${eur(-e.saldo)}</b> · ${esc(e.si.texto)}</span></div></li>`; }).join("")}</ul>
    <p class="nota">Sin contar el día a día ni cargos sin importe. Entre bancos distintos, una transferencia normal tarda un día hábil. Lo que pasa si se devuelve es la regla general: confírmalo con la entidad.</p>`}
  </section>`; }).join("");
}
// Alertas, de más a menos grave. Las tarjetas salen siempre en rojo pero no se restan.
function avisos(p, sel, T){
  const l = [], colchon = COLCHON_BASE(), en = c => MULTI ? " en " + c.nombre : "";
  for (const t of T){
    const mas = t.s.total > t.s.falta + 0.005 ? `, y ${eur(t.s.total)} en total hasta el ${corta(t.s.peorFecha)}` : "";
    if (t.cubierto) l.push({nivel: "aviso", texto: `Pasa ${eur(t.s.total)} a ${t.c.nombre} ${plazo(t.s, true)}: sola no cubre ${t.s.primero.concepto} (${corta(t.s.primero.fecha)})`});
    else l.push({nivel: "grave", texto: `Faltan ${eur(t.s.falta)}${en(t.c)} ${plazo(t.s, true)} para ${t.s.primero.concepto} (${corta(t.s.primero.fecha)})${mas}`});
  }
  if (!T.length && p.min && (p.todas || !MULTI) && p.min.saldo < colchon) l.push({nivel: "grave", texto: p.min.saldo < 0 ? `Negativo el ${corta(p.min.fecha)}: ${eur(p.min.saldo)}` : `Sin colchón el ${corta(p.min.fecha)}: faltan ${eur(r2(colchon - p.min.saldo))}`});
  const tj = p.sin.find(e => e.origen === "tarjeta");
  if (tj) l.push({nivel: "grave", texto: `Tarjetas del ${corta(tj.fecha)}: sin restar hasta ver la liquidación${tj.tope >= 0 ? ` (margen ${eur0(tj.tope)})` : ""}`});
  for (const c of selCuentas(sel)) if (c.saldo == null) l.push({nivel: "aviso", texto: `Falta el saldo de ${c.nombre}: no entra en el total ni en la previsión`});
  for (const x of C.pendientes) if (enSel(x, sel) && x.importe != null && x.fecha && leer(x.fecha) <= (cuentaDe(idCuenta(x)).base || BASE)) l.push({nivel: "info", texto: `${x.nombre.replace(/^Honorarios compra: /, "Honorarios: ")} aún sin ${x.clase === "cobro" ? "cobrar" : "cargar"} · ${eur(x.importe)} ${x.clase === "cobro" ? "esperados" : "reservados"}`});
  for (const e of p.ev.filter(e => e.origen === "revision")) l.push({nivel: "aviso", texto: `${e.concepto} desde el ${corta(e.fecha)}`});
  const cerrado = resumenMeses(sel).filter(m => m.completo).pop();
  if (cerrado && cerrado.ahorro < 0) l.push({nivel: "aviso", texto: `${mesCorto(cerrado.k)} cerró en ${eur(cerrado.ahorro)}`});
  for (const c of selCuentas(sel)) if (c.base && entre(c.base, HOY) > 7) l.push({nivel: "aviso", texto: `${MULTI ? c.nombre + ": datos" : "Datos"} de hace ${entre(c.base, HOY)} días. Pásale ${c.origen === "dato" ? "el saldo de hoy o el extracto" : "un extracto"} al agente`});
  if (p.todas) for (const n of C.notas || []) l.push({nivel: n.nivel === "aviso" ? "aviso" : "info", texto: n.texto});
  return l;
}
// Lo que se cobra y se paga cada mes en las cuentas elegidas (fijos, tarjetas y traspasos periódicos)
function listaFijos(sel, largo){
  const conBanco = MULTI && sel === "todas", sub = (x, t) => (conBanco ? punto(cuentaDe(idCuenta(x))) + esc(cuentaDe(idCuenta(x)).nombre) + " · " : "") + t;
  const prox = f => { const e = largo.ev.find(e => f(e)); return e ? corta(e.fecha) : "—"; };
  const anual = f => f.importe == null ? null : f.cuadro ? r2(Math.abs(largo.ev.filter(e => e.id === f.id && e.origen === "fijo" && e.fecha < sumar(BASE, 365)).reduce((a, e) => a + (e.importe || 0), 0))) : r2(f.importe * (f.meses ? f.meses.length : 12));
  let h = C.fijos.filter(f => f.activo !== false && enSel(f, sel)).map(f => {
    const ing = f.tipo === "ingreso", s = largo.ev.find(e => e.id === f.id && e.origen === "fijo"), imp = s && s.importe != null ? Math.abs(s.importe) : f.importe;
    const cambio = f.cuadro && deudaDe(f.cuadro) && deudaDe(f.cuadro).cuadro ? deudaDe(f.cuadro).cuadro.find(x => leer(x.fecha) > BASE && x.cuota !== imp) : null;
    return `<li class="mov ${ing ? "ing" : "gas"}"><span class="mi" aria-hidden="true">${ing ? "↑" : "↓"}</span><span class="mc"><span class="mn">${esc(f.nombre)}</span><span class="ms">${sub(f, (f.meses ? "Día " + f.dia + " de " + f.meses.map(x => MESES[x - 1]).join(", ") : "Día " + f.dia) + " · próximo " + prox(e => e.id === f.id && e.origen === "fijo") + (cambio ? ` · ${eur(cambio.cuota)} desde ${MESES[leer(cambio.fecha).getMonth()]}` : ""))}</span></span>
      <span class="mv"><b class="num ${ing ? "positivo" : ""}">${imp == null ? "¿?" : eur(ing ? imp : -imp, true)}</b><span class="num">${anual(f) == null ? "" : eur0(anual(f)) + "/año"}</span></span></li>`; }).join("");
  const T = C.tarjetas;
  if (T && T.dia_cargo && enSel(T, sel)) h += `<li class="mov sin"><span class="mi" aria-hidden="true">?</span><span class="mc"><span class="mn">${esc(T.nombre)}</span><span class="ms">${sub(T, "Día " + T.dia_cargo + " · próximo " + prox(e => e.origen === "tarjeta") + " · se resta al ver la liquidación")}</span></span><span class="mv"><b class="mal">¿?</b></span></li>`;
  for (const t of (C.traspasos || []).filter(t => t.activo !== false && t.dia && (sel === "todas" || t.de === sel || t.a === sel))){
    const sale = sel === "todas" ? null : t.de === sel;
    h += `<li class="mov tra"><span class="mi" aria-hidden="true">↔</span><span class="mc"><span class="mn">${esc(t.nombre || "Traspaso")}</span><span class="ms">${punto(cuentaDe(t.de))}${esc(cuentaDe(t.de).nombre)} → ${punto(cuentaDe(t.a))}${esc(cuentaDe(t.a).nombre)} · día ${t.dia}</span></span><span class="mv"><b class="num ${sale === false ? "positivo" : ""}">${sale == null ? eur(t.importe) : eur(sale ? -t.importe : t.importe, true)}</b><span>${sale == null ? "no cambia el total" : ""}</span></span></li>`;
  }
  return h;
}

/* =========================================================
   PESTAÑAS
   Arriba se elige «Todas» o un banco (SEL). Lo que es del dinero en cuentas (saldo, movimientos, previsión, resultado
   del mes) cambia con esa elección. Lo que es de todo tu dinero (patrimonio, deudas, colchón, endeudamiento) solo sale en «Todas».
   ========================================================= */
// INICIO: la foto de hoy. Cuánto hay y dónde, si llegas, el mes, lo próximo y las alertas.
function vistaInicio(el){
  const sel = SEL(), todas = sel === "todas", c = todas ? null : cuentaDe(sel), H = ESTADO.horizonte;
  const p = prevision(H, null, sel), T = tensiones(H, sel), v = veredicto(p, T), avs = avisos(p, sel, T);
  const nom = proxNomina(p), dN = nom ? Math.max(1, entre(BASE, nom.fecha)) : H, pN = nom ? prevision(dN, null, sel) : p, vN = nom ? veredicto(pN, tensiones(dN, sel)) : v, mn = pN.min;
  const meses = resumenMeses(sel), mes = meses[meses.length - 1];
  const proximos = p.ev.filter(e => e.certeza !== "aviso").slice(0, 5);
  const sinFecha = C.pendientes.filter(x => !x.fecha && enSel(x, sel)).map(x => x.nombre.replace(/ \(.*\)$/, ""));
  const notaSinFecha = sinFecha.length ? `<p class="nota">Sin fecha todavía (no ${sinFecha.length === 1 ? "entra" : "entran"} en la previsión): ${esc(sinFecha.join(" · "))}.</p>` : "";
  const tLlegas = `<button class="tile ${vN.clase === "malo" ? "alerta" : ""}" type="button" data-ir="futuro"><div class="n">${nom ? "Hasta la nómina del " + corta(nom.fecha) : "Próximos " + H + " días"}</div>
      <div class="v ${vN.clase === "malo" ? "mal" : ""}">${mn ? vN.t : "¿?"}</div><div class="d">${mn ? "Día más justo: " + eur0(mn.saldo) + " el " + corta(mn.fecha) : "Falta el saldo"}</div></button>`;
  const tMes = mes ? `<button class="tile" type="button" data-ir="pasado"><div class="n">${mesCorto(mes.k)}${mes.completo ? "" : " hasta el " + mes.hasta.getDate()}</div>
      <div class="v num ${mes.ahorro < 0 ? "mal" : "bien"}">${eur(mes.ahorro, true)}</div><div class="d">Ingresos ${eur0(mes.ingresos)} · gastos ${eur0(mes.gastos)}</div></button>`
    : `<div class="tile"><div class="n">Este mes</div><div class="v tenue">—</div><div class="d">Sin movimientos todavía</div></div>`;
  let h = "";
  if (todas){
    const P = patrimonio(), colchon = COLCHON_BASE(), fm = fijosMensuales(), objetivo = C.reglas.colchon_meses_estable || 3;
    const colMeses = Math.max(0, p.min.saldo) / C.reglas.gastos_fijos_mensuales_colchon;
    const end = fm.ing && hayNomina() ? fm.deuda / fm.ing * 100 : null, lim = C.reglas.tasa_esfuerzo_max_pct;
    const faltan = CUENTAS.filter(q => q.saldo == null).map(q => q.nombre);
    const aCero = P.liq.partes.filter(x => !x.c && x.v === 0).map(x => x.n);   // lo que está a cero no ocupa una fila
    const tarjeta = q => { const t = T.find(t => t.c.id === q.id), e = q.saldo == null ? ["neutro", "Sin datos"] : t ? (t.cubierto ? ["justo", "Con traspaso"] : ["malo", "Corta el " + corta(t.s.primero.fecha)]) : ["", "Llega"];
      return `<button class="cta ${q.cls}" type="button" data-cuenta="${esc(q.id)}" aria-label="Ver solo ${esc(q.nombre)}"><span class="cta-n"><span class="pb"></span>${esc(q.nombre)}</span><span class="cta-v num">${eurS(q.saldo)}</span><span class="cta-d">${esc(origenTxt(q))}</span><span class="cta-e ${e[0]}"><i></i>${e[1]}</span></button>`; };
    h += `<div class="heroe b-neutro ${MULTI ? "con-cuentas" : ""}">
      <div><div class="h-top"><div class="n">${MULTI ? "Disponible en tus cuentas" : "Saldo en " + esc(PRI.nombre)}</div><span class="estado ${v.clase}"><i></i>${v.t}</span></div>
        <div class="grande num">${eur(P.liq.enCuentas)}</div>
        <div class="h-sub">${esc(v.h)}${faltan.length ? " · sin contar " + esc(faltan.join(" ni ")) + " (falta el saldo)" : ""}</div></div>
      ${MULTI ? `<div class="h-cuentas">${CUENTAS.map(tarjeta).join("")}</div>` : ""}
      <div class="pills"><span class="pill">Patrimonio neto <b class="num">${eur0(P.neto)}</b></span><span class="pill">Líquido total <b class="num">${eur0(P.liq.total)}</b></span>${P.liq.comprometido ? `<span class="pill">Comprometido <b class="num">${eur0(P.liq.comprometido)}</b></span>` : ""}</div>
    </div>
    <div class="cifras">${tLlegas}${tMes}
      <div class="tile ${colMeses < objetivo ? "alerta" : ""} con-anillo">${anillo(colMeses / objetivo, colMeses >= objetivo ? "var(--bien)" : colMeses >= objetivo / 2 ? "var(--aviso)" : "var(--critico)")}
        <div><div class="n">Colchón en meses</div><div class="v num">${colMeses.toFixed(1).replace(".", ",")} <span class="tenue" style="font-size:14px">de ${objetivo}</span></div><div class="d">Objetivo ${eur0(colchon)}</div></div></div>
      <button class="tile ${end > lim ? "alerta" : ""}" type="button" data-ir="financiacion"><div class="n">Endeudamiento</div>
        <div class="v num ${end > lim ? "mal" : end > lim * .85 ? "ojo" : ""}">${pct(end)}</div><div class="d">${end == null ? SIN_NOMINA : `Cuotas ÷ ingresos fijos · límite ${lim} %`}</div></button>
    </div>
    ${bloqueSinCubrir(T, true)}
    <div class="dos">
      <div class="bloque"><h3>Lo próximo <button class="enlace" type="button" data-ir="futuro">Ver todo</button></h3>${proximos.length ? `<ul class="movs">${proximos.map(e => filaMov(e, false, MULTI)).join("")}</ul>` : `<p class="sub">Nada previsto en ${H} días.</p>`}${notaSinFecha}</div>
      <div class="bloque"><h3>Alertas <span class="chip ${avs.some(a => a.nivel === "grave") ? "rojo" : ""}">${avs.length}</span></h3>${avs.length ? listaAlertas(avs.slice(0, 4)) + (avs.length > 4 ? `<details class="mas"><summary>Ver ${avs.length - 4} más</summary>${listaAlertas(avs.slice(4))}</details>` : "") : `<p class="sub">Nada que vigilar.</p>`}</div>
    </div>
    <div class="mitades">
      <div class="bloque"><h3>Lo que tienes <span class="total num">${eur(P.activos)}</span></h3><ul class="movs">
        ${P.liq.partes.filter(x => x.c || x.v !== 0).map(x => `<li class="mov ${x.c ? "cta-f " + x.c.cls : "ing"}"><span class="mi">${icono(x.ic)}</span><span class="mc"><span class="mn">${esc(x.n)}</span><span class="ms">${esc(x.d)}</span></span><span class="mv"><b class="num">${eurS(x.v)}</b><span>Líquido</span></span></li>`).join("")}
        ${P.inm.map(b => `<li class="mov oro"><span class="mi">${icono("financiacion")}</span><span class="mc"><span class="mn">${esc(b.nombre)}</span><span class="ms">${esc(b.nota || "")}</span></span><span class="mv"><b class="num">${eur(b.valor)}</b><span>No líquido</span></span></li>`).join("")}
      </ul>${aCero.length ? `<p class="nota">A cero ahora: ${esc(aCero.join(" · "))}.</p>` : ""}</div>
      <div class="bloque"><h3>Lo que debes <span class="total num">${eur(-P.pasivos)}</span></h3><ul class="movs">
        ${P.deudas.map(d => { const b = baseDeuda(d), f = d.cuadro ? filaCuadro(d, b) : null, sig = d.cuadro ? d.cuadro.find(x => leer(x.fecha) > b) : null;
          return `<li class="mov deu"><span class="mi">${icono(d.id === "hipoteca" ? "financiacion" : "escudo")}</span><span class="mc"><span class="mn">${esc(d.nombre)}</span><span class="ms">${sig ? `Próxima cuota ${eur(sig.cuota)} el ${corta(leer(sig.fecha))} · ${eur0(sig.intereses)} de intereses` : esc(d.nota || "")}</span></span><span class="mv"><b class="num">${eur(-d.viva)}</b><span>${f ? "a " + corta(leer(f.fecha)) : "Sin cuota"}</span></span></li>`; }).join("")}
        ${C.pendientes.filter(x => x.importe != null && x.clase !== "cobro").map(x => `<li class="mov ven"><span class="mi" aria-hidden="true">!</span><span class="mc"><span class="mn">${esc(x.nombre)}</span><span class="ms">${!x.fecha ? "Sin fecha" : leer(x.fecha) <= BASE ? "Vencido, sin cargar · reservado" : "Vence el " + corta(leer(x.fecha))}</span></span><span class="mv"><b class="num">${eur(-x.importe)}</b><span>Comprometido</span></span></li>`).join("")}
      </ul></div>
    </div>`;
  } else {
    const fm = fijosMensuales(sel), enCuentas = r2(CON_SALDO.reduce((a, q) => a + q.saldo, 0)), largo = prevision(400, null, sel), fijos = listaFijos(sel, largo);
    h += `<div class="heroe ${c.cls}">
      <div><div class="h-top"><div class="n">${esc(c.entidad || c.nombre)}</div><span class="estado ${v.clase}"><i></i>${v.t}</span></div>
        <div class="grande num">${eurS(c.saldo)}</div>
        <div class="h-sub">${c.saldo == null ? "Dile al agente cuánto hay y a qué fecha, o pásale el extracto, y aquí verás si llega." : esc(origenTxt(c)) + " · " + esc(v.h)}</div></div>
      ${c.saldo == null ? "" : `<div class="pills"><span class="pill">Día más justo <b class="num">${eur0(p.min.saldo)}</b> ${corta(p.min.fecha)}</span><span class="pill">Saldo el ${corta(p.fin)} <b class="num">${eur0(p.final)}</b></span>${enCuentas > 0 && CON_SALDO.length > 1 ? `<span class="pill">De tu dinero en cuentas <b class="num">${pct(c.saldo / enCuentas * 100)}</b></span>` : ""}</div>`}
    </div>
    <div class="cifras">${tLlegas}${tMes}
      <div class="tile"><div class="n">Entra fijo al mes</div><div class="v num ${fm.ing ? "bien" : "tenue"}">${fm.ing ? eur(fm.ing, true) : "—"}</div><div class="d">${fm.ing ? "Lo que se cobra aquí cada mes" : "Nada fijo se cobra aquí"}</div></div>
      <div class="tile"><div class="n">Sale fijo al mes</div><div class="v num ${fm.gas ? "" : "tenue"}">${fm.gas ? eur(-fm.gas) : "—"}</div><div class="d">${fm.n ? plural(fm.n, "recibo fijo", "recibos fijos") + " · sin tarjetas" : "Ningún recibo domiciliado aquí"}</div></div>
    </div>
    ${bloqueSinCubrir(T, true)}
    <div class="dos">
      <div class="bloque"><h3>Lo próximo en ${esc(c.nombre)} <button class="enlace" type="button" data-ir="futuro">Ver todo</button></h3>${proximos.length ? `<ul class="movs">${proximos.map(e => filaMov(e, c.saldo != null, false)).join("")}</ul>` : `<p class="sub">Nada previsto en ${H} días.</p>`}${notaSinFecha}</div>
      <div class="bloque"><h3>Alertas <span class="chip ${avs.some(a => a.nivel === "grave") ? "rojo" : ""}">${avs.length}</span></h3>${avs.length ? listaAlertas(avs) : `<p class="sub">Nada que vigilar.</p>`}</div>
    </div>
    <div class="bloque"><h3>Qué se cobra y se paga aquí</h3>${fijos ? `<ul class="movs">${fijos}</ul>` : `<p class="sub">Todavía no hay nada fijo en ${esc(c.nombre)}. Cuando domicilies algo o cobres aquí la nómina, díselo al agente.</p>`}${c.nota ? `<p class="nota">${esc(c.nota)}</p>` : ""}</div>`;
  }
  el.innerHTML = h;
}

// PASADO: lo que ya pasó. Resultado del mes, por banco, saldo real, en qué se gasta y todos los movimientos.
function vistaPasado(el){
  const sel = SEL(), todas = sel === "todas", c = todas ? null : cuentaDe(sel), meses = resumenMeses(sel), movs = movsDe(sel), conBanco = MULTI && todas;
  if (!meses.length){ el.innerHTML = vacio(`Sin movimientos de ${esc(c ? c.nombre : "tus cuentas")} todavía`, "Cuando le pases el extracto al agente, aquí verás el saldo día a día, en qué se va el dinero y cada movimiento."); return; }
  if (!ESTADO.mesPasado || (ESTADO.mesPasado !== "todo" && !meses.some(x => x.k === ESTADO.mesPasado))) ESTADO.mesPasado = meses[meses.length - 1].k;
  const todo = ESTADO.mesPasado === "todo", m = todo ? null : meses.find(x => x.k === ESTADO.mesPasado), periodo = todo ? meses : [m];
  const ing = r2(periodo.reduce((a, x) => a + x.ingresos, 0)), gas = r2(periodo.reduce((a, x) => a + x.gastos, 0)), res = r2(ing - gas);
  const porCat = {}; for (const x of periodo) for (const [k, v] of Object.entries(x.porCat)) porCat[k] = r2((porCat[k] || 0) + v);
  const cats = Object.entries(porCat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  // Lo mismo, separado por banco
  const deBanco = q => { const r = {ingresos: 0, gastos: 0, n: 0, porCat: {}}; for (const x of periodo){ const b = x.porCta[q.id]; if (!b) continue; r.ingresos += b.ingresos; r.gastos += b.gastos; r.n += b.n; for (const [k, v] of Object.entries(b.porCat)) r.porCat[k] = (r.porCat[k] || 0) + v; } r.ingresos = r2(r.ingresos); r.gastos = r2(r.gastos); return r; };
  const bancos = (todas ? CUENTAS : [c]).map(q => ({q, ...deBanco(q)}));
  const diaAdia = new Set((C.variables.find(v => v.id === "dia-a-dia") || {}).categorias || []);
  const totalDia = r2(cats.filter(([k]) => diaAdia.has(k)).reduce((a, [, v]) => a + v, 0));
  const primera = movs.reduce((a, x) => x.f < a ? x.f : a, movs[0].f), ultima = baseMovs(sel);
  const nDias = todo ? entre(primera, ultima) + 1 : (m.completo ? m.finMes.getDate() : m.hasta.getDate());
  const delPeriodo = movs.filter(x => todo || x.fecha.startsWith(m.k));
  const comercios = {};
  for (const x of delPeriodo.filter(x => x.tipo === "gasto" && x.importe < 0)){ const k = x.concepto.replace(/\d{3,}/g, "").replace(/\s+/g, " ").trim(); comercios[k] = r2((comercios[k] || 0) - x.importe); }
  const top = Object.entries(comercios).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const F = ESTADO.filtro;
  const lista = delPeriodo.filter(x => (!F.cat || x.cat === F.cat) && (!F.tipo || x.tipo === F.tipo) && (!F.q || x.concepto.toLowerCase().includes(F.q.toLowerCase()))).slice().reverse();
  let filas = "", diaAnt = "";
  const filtrando = F.cat || F.tipo || F.q, corte = ESTADO.verTodos || filtrando ? lista.length : 15;
  for (const x of lista.slice(0, corte)){
    if (x.fecha !== diaAnt){ filas += `<li class="dia-sep"><span>${esc(larga(x.f))}</span>${conBanco ? "" : `<span class="num">Saldo ${eur(x.saldo)}</span>`}</li>`; diaAnt = x.fecha; }
    const t = x.tipo === "ingreso" ? "ing" : x.tipo === "gasto" ? "gas" : "ven", q = cuentaDe(x.cuenta);
    filas += `<li class="mov ${t}"><span class="mi" aria-hidden="true">${t === "ing" ? "↑" : t === "gas" ? "↓" : "↔"}</span><span class="mc"><span class="mn">${esc(cap(x.concepto))}</span><span class="ms">${conBanco ? punto(q) + esc(q.nombre) + " · " : ""}${esc(CAT[x.cat].nombre)}</span></span><span class="mv"><b class="num ${x.importe > 0 ? "positivo" : ""}">${eur(x.importe, true)}</b></span></li>`;
  }
  const hist = historia(sel), conGastos = bancos.filter(b => b.gastos > 0), maxCat = cats.length ? cats[0][1] : 1;
  const barra = ([k, v]) => { const segs = bancos.map(b => ({q: b.q, v: r2(b.porCat[k] || 0)})).filter(s => s.v > 0);
    return `<div><div class="bt"><span>${esc(CAT[k].nombre)}</span><b class="num">${eur0(v)}</b></div><div class="hb" style="width:${Math.max(2, v / maxCat * 100).toFixed(1)}%">${segs.map(s => `<i class="${s.q.cls}" style="flex:${s.v}" title="${esc(s.q.nombre)}: ${eur(s.v)}"></i>`).join("")}</div></div>`; };
  const A_LA_VISTA = 6, resto = cats.length > A_LA_VISTA + 1 ? cats.slice(A_LA_VISTA) : [];
  const barras = cats.slice(0, resto.length ? A_LA_VISTA : cats.length).map(barra).join("")
    + (resto.length ? `<details class="mas"><summary>${resto.length} categorías más · ${eur0(resto.reduce((a, [, v]) => a + v, 0))}</summary><div class="barras">${resto.map(barra).join("")}</div></details>` : "");
  const nombrePeriodo = todo ? "todo el periodo" : mesCorto(m.k).toLowerCase();
  el.innerHTML = `
    <div class="controles">${seg("mespas", Object.fromEntries([...meses.map(x => [x.k, mesCorto(x.k) + (x.completo ? "" : "*")]), ["todo", "Todo"]]), ESTADO.mesPasado)}
      <span class="tenue" style="font-size:13px">${todo ? "Del " + corta(primera) + " al " + corta(ultima) : m.completo ? "Mes completo" : "* Hasta el " + corta(m.hasta)}</span></div>
    <div class="cifras">
      <div class="tile"><div class="n">Ingresos</div><div class="v num positivo">${eur(ing, true)}</div><div class="d">Nómina, alquileres y otros</div></div>
      <div class="tile"><div class="n">Gastos</div><div class="v num">${eur(-gas)}</div><div class="d">Sin compra del piso ni traspasos</div></div>
      <div class="tile ${res < 0 ? "alerta" : ""}"><div class="n">Resultado</div><div class="v num ${res < 0 ? "mal" : "bien"}">${eur(res, true)}</div><div class="d">${res < 0 ? "Salió más de lo que entró" : ing ? "Ahorro " + pct(res / ing * 100) : "—"}</div></div>
      <div class="tile"><div class="n">Día a día</div><div class="v num">${eur0(totalDia)}</div><div class="d">${eur(r2(totalDia / Math.max(1, nDias)))} de media al día</div></div>
    </div>
    ${conBanco ? `<div class="bloque"><h3>Por banco <span class="chip">Gastos de ${nombrePeriodo}</span></h3>
      ${conGastos.length ? `<div class="reparto" role="img" aria-label="Reparto de los gastos: ${esc(conGastos.map(b => b.q.nombre + " " + pct(b.gastos / gas * 100)).join(", "))}">${conGastos.map(b => `<i class="${b.q.cls}" style="flex:${b.gastos}"></i>`).join("")}</div>` : ""}
      <ul class="bancos">${bancos.map(b => `<li><button type="button" data-cuenta="${esc(b.q.id)}" aria-label="Ver solo ${esc(b.q.nombre)}"><span class="bn ${b.q.cls}"><span class="pb"></span>${esc(b.q.nombre)}</span>${b.n
        ? `<span class="bk"><small>Ingresos</small><b class="num">${eur(b.ingresos, true)}</b></span><span class="bk"><small>Gastos${gas ? " · " + pct(b.gastos / gas * 100) : ""}</small><b class="num">${eur(-b.gastos)}</b></span><span class="bk"><small>Resultado</small><b class="num ${b.ingresos - b.gastos < 0 ? "mal" : "bien"}">${eur(r2(b.ingresos - b.gastos), true)}</b></span>`
        : `<span class="bvacio">${b.q.movs.length ? "Sin movimientos en este periodo" : "Sin extracto todavía"}</span>`}</button></li>`).join("")}</ul>
      <p class="nota">Lo que pasa de una cuenta tuya a otra no cuenta como ingreso ni como gasto.</p></div>` : ""}
    <figure class="grafico"><div class="tit">Saldo real ${hist && !hist.total ? "en " + esc(hist.series[0].c.nombre) : "en tus cuentas"}</div>${leyendaHistoria(hist)}<div class="hueco"></div>${hist && hist.total && hist.distintas ? `<p class="nota" style="padding:0 8px">El total cuenta cada cuenta desde su saldo de apertura y llega hasta el ${corta(hist.comun)}, último día con datos de todas.</p>` : ""}</figure>
    <div class="mitades">
      <div class="bloque"><h3>En qué se va${conBanco ? ` <span class="leyenda" style="padding:0;font-weight:600">${bancos.filter(b => b.gastos > 0).map(b => `<span><i class="${b.q.cls}" style="background:var(--b)"></i>${esc(b.q.nombre)}</span>`).join("")}</span>` : ""}</h3>${cats.length ? `<div class="barras">${barras}</div>` : `<p class="sub">Sin gastos.</p>`}<p class="nota">Las tarjetas de crédito salen como un solo cargo el día ${C.tarjetas.dia_cargo}.</p></div>
      <div class="bloque"><h3>Dónde más</h3><ul class="lista">${top.map(([k, v]) => `<li><span class="nom" style="font-weight:600">${esc(k)}</span><span class="val num">${eur(-v)}</span></li>`).join("") || `<li><span class="det">Nada.</span></li>`}</ul></div>
    </div>
    <div class="bloque"><h3>Movimientos <span class="chip">${lista.length}</span></h3>
      <div class="controles" style="margin:6px 0 2px">
        <label>Categoría <select id="f-cat"><option value="">Todas</option>${Object.values(CAT).filter(k => delPeriodo.some(x => x.cat === k.id)).map(k => `<option value="${k.id}" ${F.cat === k.id ? "selected" : ""}>${esc(k.nombre)}</option>`).join("")}</select></label>
        <label>Tipo <select id="f-tipo"><option value="">Todos</option>${[["ingreso","Ingresos"],["gasto","Gastos"],["interno","Entre cuentas"],["compra_piso","Compra del piso"]].map(([k, n]) => `<option value="${k}" ${F.tipo === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <label style="flex:1 1 180px">Buscar <input type="search" id="f-q" value="${esc(F.q)}" placeholder="Concepto" style="flex:1"></label>
      </div>
      <ul class="movs">${filas || `<li class="sub">Ningún movimiento con ese filtro.</li>`}</ul>${lista.length > corte ? `<button class="enlace" type="button" data-vertodos style="margin-top:10px">Ver los ${lista.length} movimientos</button>` : ""}</div>
    <details class="metodo"><summary>Mes a mes por categoría</summary><div class="envuelve" style="margin-top:10px"><table><thead><tr><th>Categoría</th>${meses.map(x => `<th class="der">${mesCorto(x.k)}${x.completo ? "" : "*"}</th>`).join("")}</tr></thead><tbody>
      ${[...new Set(meses.flatMap(x => Object.keys(x.porCat)))].map(k => `<tr><td>${esc(CAT[k].nombre)}</td>${meses.map(x => `<td class="der num">${x.porCat[k] ? eur(-x.porCat[k]) : "—"}</td>`).join("")}</tr>`).join("")}
      <tr class="total"><td>Gastos</td>${meses.map(x => `<td class="der num">${eur(-x.gastos)}</td>`).join("")}</tr>
      <tr><td>Ingresos</td>${meses.map(x => `<td class="der num positivo">${eur(x.ingresos, true)}</td>`).join("")}</tr>
      <tr><td><b>Resultado</b></td>${meses.map(x => `<td class="der num ${x.ahorro < 0 ? "mal" : "bien"}"><b>${eur(x.ahorro, true)}</b></td>`).join("")}</tr>
      <tr><td class="tenue">Entre cuentas tuyas</td>${meses.map(x => `<td class="der num tenue">${x.interno ? eur(x.interno, true) : "—"}</td>`).join("")}</tr>
      <tr><td class="tenue">Compra del piso</td>${meses.map(x => `<td class="der num tenue">${x.compra ? eur(x.compra, true) : "—"}</td>`).join("")}</tr>
    </tbody></table></div></details>`;
  graficoHistoria(el.querySelector(".hueco"), hist, todo ? null : m.k);
  const set = (k, v) => { ESTADO.filtro[k] = v; pintar(); };
  $("f-cat").onchange = e => set("cat", e.target.value); $("f-tipo").onchange = e => set("tipo", e.target.value);
  let t; $("f-q").oninput = e => { clearTimeout(t); t = setTimeout(() => { set("q", e.target.value); const i = $("f-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
}

// Calendario del mes (Futuro): días pasados con lo real, futuros con lo previsto y el saldo al cerrar el día
function htmlCalendario(sel){
  const [yy, mm] = ESTADO.mesCal.split("-").map(Number), primero = new Date(yy, mm - 1, 1), ultimo = new Date(yy, mm, 0);
  const todas = sel === "todas", conBanco = MULTI && todas, desde = todas ? DATO_VIEJO : (cuentaDe(sel).base || BASE);
  const p = prevision(Math.max(30, entre(BASE, ultimo) + 1), null, sel), limite = todas || !MULTI ? COLCHON_BASE() : 0, porDia = {};
  for (const m of movsDe(sel)) (porDia[m.fecha] ||= {real: [], prev: []}).real.push(m);
  for (const e of p.ev) (porDia[iso(e.fecha)] ||= {real: [], prev: []}).prev.push(e);
  let h = `<div class="cal-cab"><button type="button" data-cal="-1" aria-label="Mes anterior">‹</button><h3>${nombreMes(ESTADO.mesCal)}</h3><button type="button" data-cal="1" aria-label="Mes siguiente">›</button><button type="button" data-cal="hoy">Hoy</button></div>`;
  h += `<div class="cal">` + ["lun","mar","mié","jue","vie","sáb","dom"].map(d => `<div class="dsem">${d}</div>`).join("");
  const desfase = (primero.getDay() + 6) % 7;
  for (let i = 0; i < desfase; i++) h += `<div class="dia fuera" aria-hidden="true"></div>`;
  for (let d = 1; d <= ultimo.getDate(); d++){
    const f = new Date(yy, mm - 1, d), k = iso(f), x = porDia[k] || {real: [], prev: []};
    const pasado = f <= desde, cls = ["dia"]; if (pasado) cls.push("pasado"); if (k === iso(HOY)) cls.push("hoy"); if (ESTADO.diaSel === k) cls.push("sel");
    const conImp = x.prev.filter(e => e.importe != null && e.saldo != null), saldoDia = conImp.length ? conImp[conImp.length - 1].saldo : null;
    if (!pasado && saldoDia != null && saldoDia < limite && conImp.some(e => e.importe < 0)) cls.push("critico");
    let items = "";
    if (pasado){
      const corr = x.real.filter(m => m.tipo === "ingreso" || m.tipo === "gasto");
      const ent = r2(corr.filter(m => m.importe > 0).reduce((a, m) => a + m.importe, 0)), sal = r2(-corr.filter(m => m.importe < 0).reduce((a, m) => a + m.importe, 0));
      if (ent) items += `<span class="it ing num">+${eur0(ent)}</span>`;
      if (sal) items += `<span class="it real num">−${eur0(sal)}</span>`;
    } else {
      for (const e of x.prev.slice(0, 3)) items += `<span class="it ${e.certeza === "sin_importe" ? "sin" : e.certeza === "aviso" ? "ven" : e.importe > 0 ? "ing" : ""}" title="${esc(e.concepto)}">${e.neutro ? "↔ " : e.importe == null ? (e.certeza === "aviso" ? "◇ " : "? ") : (e.importe > 0 ? "+" : "−") + eur0(Math.abs(e.importe)) + " "}${esc(e.concepto)}</span>`;
      if (x.prev.length > 3) items += `<span class="it mas">+${x.prev.length - 3} más</span>`;
    }
    const pt = col => `<span class="punto" style="background:var(--${col})"></span>`;
    const puntos = pasado ? (x.real.some(m => m.tipo === "ingreso") ? pt("bien") : "") + (x.real.some(m => m.tipo === "gasto") ? pt("tinta-3") : "")
      : x.prev.map(e => pt(e.certeza === "sin_importe" ? "critico" : e.certeza === "aviso" ? "aviso" : e.neutro ? "oro" : e.importe > 0 ? "bien" : "tinta-3")).join("");
    h += `<button type="button" class="${cls.join(" ")}" data-dia="${k}" aria-label="${esc(larga(f))}"><span class="nd num">${d}</span>${items}<span>${puntos}</span>${!pasado && saldoDia != null ? `<span class="neto num ${saldoDia < 0 ? "mal" : ""}">${eur0(saldoDia)}</span>` : ""}</button>`;
  }
  for (let i = (desfase + ultimo.getDate()) % 7; i && i < 7; i++) h += `<div class="dia fuera" aria-hidden="true"></div>`;
  h += `</div><div class="leyenda-cal"><span><i class="punto" style="background:var(--bien)"></i>entra</span><span><i class="punto" style="background:var(--tinta-3)"></i>sale</span><span><i class="punto" style="background:var(--critico)"></i>sin importe</span><span><i class="punto" style="background:var(--aviso)"></i>aviso</span><span><span class="muestra"></span>${limite ? "bajo el colchón" : "en negativo"}</span><span>Cifra de abajo: saldo al cerrar el día</span></div>`;
  let det = `<p class="sub">Toca un día para ver el detalle.</p>`;
  if (ESTADO.diaSel){
    const f = leer(ESTADO.diaSel), x = porDia[ESTADO.diaSel] || {real: [], prev: []}, de = q => conBanco && q ? punto(cuentaDe(q)) + esc(cuentaDe(q).nombre) + " · " : "";
    const filas = x.real.map(m => `<li><span class="nom">${esc(m.concepto)}</span><span class="val num ${m.importe > 0 ? "positivo" : ""}">${eur(m.importe, true)}</span><span class="det">${de(m.cuenta)}Real · ${esc(CAT[m.cat].nombre)}</span></li>`).join("")
      + x.prev.map(e => `<li><span class="nom">${esc(e.concepto)}</span><span class="val num ${e.certeza === "sin_importe" ? "mal" : ""}">${e.neutro ? eur(e.mueve) : e.importe == null ? (e.certeza === "aviso" ? "—" : "¿?") : eur(e.importe, true)}</span><span class="det">${de(e.cuenta)}${e.clase === "traspaso" ? "Entre tus cuentas" : cert(e.certeza)} ${esc(e.nota || "")}</span></li>`).join("");
    det = `<p class="sub"><b>${cap(larga(f))}</b></p><ul class="lista">${filas || `<li><span class="det">Sin movimientos.</span></li>`}</ul>`;
  }
  return `<div class="dos"><div class="bloque">${h}</div><div class="bloque"><h3>Detalle del día</h3>${det}</div></div>`;
}

// FUTURO: ¿llego?, la previsión, el calendario y todo lo que se repite o vence.
function vistaFuturo(el){
  const sel = SEL(), todas = sel === "todas", c = todas ? null : cuentaDe(sel), H = ESTADO.horizonte, conBanco = MULTI && todas;
  const p = prevision(H, null, sel), T = tensiones(H, sel), v = veredicto(p, T), fm = fijosMensuales(sel);
  const nom = proxNomina(p), tj = p.sin.find(e => e.origen === "tarjeta"), largo = prevision(400, null, sel);
  // En el conjunto, debajo del total va la línea de cada cuenta con saldo
  const otras = todas && CON_SALDO.length > 1 ? CON_SALDO.map(q => ({c: q, p: prevision(H, null, q.id)})) : null;
  const colchon = todas || !MULTI, opc = {color: c ? c.col : null, relleno: c ? c.suave : null, otras, colchon};
  let lista = "", mesAnt = "";
  for (const e of p.ev){ const k = ym(e.fecha); if (k !== mesAnt){ lista += `<li class="mes-sep">${nombreMes(k)}</li>`; mesAnt = k; } lista += filaMov(e, true, conBanco); }
  const pend = C.pendientes.filter(x => enSel(x, sel)), venc = C.vencimientos.filter(x => enSel(x, sel)), fijos = listaFijos(sel, largo);
  const bancoDe = x => conBanco ? punto(cuentaDe(idCuenta(x))) + esc(cuentaDe(idCuenta(x)).nombre) + " · " : "";
  el.innerHTML = `
    <div class="heroe ${c ? c.cls : "b-neutro"}">
      <div><div class="h-top"><div class="n">${p.min ? "Día más justo · " + corta(p.min.fecha) : esc(c ? c.nombre : "Previsión")}${c && p.min ? " · " + esc(c.nombre) : ""}</div><span class="estado ${v.clase}"><i></i>${v.t}</span></div>
        <div class="grande num">${p.min ? eur(p.min.saldo) : "¿?"}</div>
        <div class="h-sub">${esc(v.h)}${todas && p.sinSaldo.length ? " · sin contar " + esc(p.sinSaldo.map(q => q.nombre).join(" ni ")) : ""}</div></div>
      ${p.min ? `<div class="pills">${nom ? `<span class="pill">Nómina <b class="num">${eur(nom.importe, true)}</b> ${corta(nom.fecha)}</span>` : ""}<span class="pill">Saldo el ${corta(p.fin)} <b class="num">${eur0(p.final)}</b></span>${tj ? `<span class="pill rojo">Tarjetas ${corta(tj.fecha)} <b>sin restar</b></span>` : ""}</div>` : ""}
      <div class="h-hor"><span class="n">Hasta dónde mirar</span>${selectorHorizonte()}</div>
    </div>
    ${bloqueSinCubrir(T, false)}
    ${p.min ? `<figure class="grafico"><div class="tit">Saldo previsto${c ? " en " + esc(c.nombre) : ""}</div>${leyendaSaldo(opc)}<div class="hueco"></div></figure>` : vacio(`Falta el saldo de ${esc(c ? c.nombre : "la cuenta")}`, "Dile al agente cuánto hay y a qué fecha, o pásale el extracto, y aquí saldrá la previsión.")}
    <div class="fila-tit"><span style="font-weight:800;font-size:18px">Lo que viene</span>${seg("modo", {lista: "Lista", calendario: "Calendario"}, ESTADO.futuro)}</div>
    ${ESTADO.futuro === "calendario" ? htmlCalendario(sel) : `<div class="bloque"><ul class="movs">${lista || `<li class="sub">Nada previsto en ${H} días.</li>`}</ul>
      <p class="nota">Solo resta importes reales. Lo que no tiene cifra sale con «¿?» y no se resta. Si un día cae en fin de semana, pasa al lunes.${conBanco ? " La cifra pequeña es el total de tus cuentas después de cada movimiento." : ""}</p></div>`}
    <div class="dos">
      <div class="bloque"><h3>Cada mes <span class="chip">Margen ${eur0(r2(fm.ing - fm.gas))}/mes</span></h3>${fijos ? `<ul class="movs">${fijos}</ul>` : `<p class="sub">Nada fijo todavía.</p>`}<p class="nota">Ingresos fijos ${eur(fm.ing)}/mes · gastos fijos ${eur(fm.gas)}/mes. Sin tarjetas ni día a día.</p></div>
      <div class="pila">
        <div class="bloque"><h3>Pagos y cobros pendientes</h3>${pend.length ? `<ul class="movs">
          ${pend.map(x => { const cobro = x.clase === "cobro", base = cuentaDe(idCuenta(x)).base || BASE;
            return `<li class="mov ${x.importe == null ? "sin" : cobro ? "ing" : "ven"}"><span class="mi" aria-hidden="true">${x.importe == null ? "?" : cobro ? "↑" : "!"}</span><span class="mc"><span class="mn">${esc(x.nombre)}</span><span class="ms">${bancoDe(x)}${x.fecha ? (leer(x.fecha) <= base ? "Venció el " + corta(leer(x.fecha)) + (cobro ? "" : " · reservado ya") : (cobro ? "Se espera el " : "Vence el ") + corta(leer(x.fecha))) : "Sin fecha"}${x.importe == null ? (cobro ? " · no se suma" : " · no se resta") : ""}</span></span><span class="mv"><b class="num ${x.importe == null ? "mal" : cobro ? "positivo" : ""}">${x.importe == null ? "¿?" : eur(cobro ? x.importe : -x.importe, cobro)}</b></span></li>`; }).join("")}
        </ul>` : `<p class="sub">Nada pendiente${c ? " en " + esc(c.nombre) : ""}.</p>`}</div>
        <div class="bloque"><h3>Vencimientos y renovaciones</h3>${venc.length ? `<ul class="movs">
          ${venc.slice().sort((a, b) => (a.fecha || "9") < (b.fecha || "9") ? -1 : 1).map(x => { const d = x.fecha ? leer(x.fecha) : null, rev = d && x.aviso_dias ? sumar(d, -x.aviso_dias) : null;
            return `<li class="mov ${x.es_cargo ? "gas" : "ven"}"><span class="fd">${d ? `<b>${d.getDate()}</b>${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : "—"}</span><span class="mi" aria-hidden="true">${x.es_cargo ? "↓" : "◇"}</span><span class="mc"><span class="mn">${esc(x.nombre.replace(/^Renovación del /, "Renovación "))}</span><span class="ms">${rev ? "Revisar desde el " + corta(rev) + "/" + String(rev.getFullYear()).slice(2) : ""}${x.entidad ? (rev ? " · " : "") + esc(x.entidad) : ""}${x.es_cargo && x.certeza ? ETQ[x.certeza] : ""}</span></span><span class="mv"><b class="num">${x.importe != null ? eur(-x.importe) : x.es_cargo ? "¿?" : ""}</b></span></li>`; }).join("")}
        </ul>` : `<p class="sub">Ninguno${c ? " en " + esc(c.nombre) : ""}.</p>`}</div>
      </div>
    </div>`;
  if (p.min) graficoSaldo(el.querySelector(".hueco"), p, opc);
}

/* =========================================================
   HERRAMIENTAS
   ========================================================= */
const enDesarrollo = (t, x) => `<div class="desarrollo"><span class="ic">${icono("herramientas")}</span><div><b>${t}</b><p>${x}</p></div></div>`;
const proximo = (t, x) => `<div class="proximo"><span class="chip oro">En desarrollo</span><b>${t}</b><p>${x}</p></div>`;

function vistaInversiones(el){
  const p = prevision(ESTADO.horizonte), fm = fijosMensuales(), meses = resumenMeses(), esc6 = escaleraExcedente(p);
  const inv = C.inversiones || [], tot = r2(inv.reduce((a, i) => a + (i.valor || 0), 0));
  el.innerHTML = `
    ${enDesarrollo("Inversiones · en desarrollo", "Aquí irán tus fondos y acciones, el reparto de lo que ahorras cada mes y un scoring según la volatilidad que quieras asumir. Por ahora, lo que ya se puede calcular con tus datos reales.")}
    <div class="cifras">
      <div class="tile"><div class="n">Tu cartera</div><div class="v num">${eur(tot)}</div><div class="d">${inv.length ? plural(inv.length, "producto", "productos") : "Sin fondos ni acciones"}</div></div>
      <div class="tile"><div class="n">Margen fijo al mes</div><div class="v num">${eur0(r2(fm.ing - fm.gas))}</div><div class="d">Antes de tarjetas y día a día</div></div>
      ${meses.slice(-2).map(x => `<div class="tile"><div class="n">Ahorro real · ${MESES[+x.k.slice(5) - 1]}${x.completo ? "" : "*"}</div><div class="v num ${x.ahorro < 0 ? "mal" : "bien"}">${eur(x.ahorro, true)}</div><div class="d">Tasa ${tasa(x)}</div></div>`).join("")}
    </div>
    <div class="dos">
      <div class="bloque"><h3>Qué hacer con lo que sobra <span class="chip">Por orden</span></h3>${esc6.html}</div>
      <div class="pila">
        ${proximo("Perfil de riesgo", "Cuánta volatilidad aceptas y cuánto quieres destinar cada mes.")}
        ${proximo("Reparto del ahorro", "Qué parte del ahorro mensual va a colchón, casa e inversión.")}
        ${proximo("Scoring de inversión", "Una nota para cada fondo o acción según tu perfil.")}
      </div>
    </div>`;
}

function vistaFinanciacion(el){
  const fm = fijosMensuales(), lim = C.reglas.tasa_esfuerzo_max_pct, hip = deudaDe("hipoteca"), piso = C.bienes.find(b => b.id === "piso");
  const nom = hayNomina(), end = fm.ing && nom ? fm.deuda / fm.ing * 100 : null, libre = nom ? r2(fm.ing * lim / 100 - fm.deuda) : null;
  const bh = hip ? baseDeuda(hip) : BASE, f = hip && hip.cuadro ? filaCuadro(hip, bh) : null, viva = hip ? pendienteDe(hip) : 0;
  const sig = hip && hip.cuadro ? hip.cuadro.filter(x => leer(x.fecha) > bh).slice(0, 12) : [];
  const intAnio = r2(sig.reduce((a, x) => a + x.intereses, 0)), capAnio = r2(sig.reduce((a, x) => a + x.amortizacion, 0));
  const viv = C.fijos.filter(x => ["hipoteca", "comunidad"].includes(x.id) && x.importe != null).reduce((a, x) => a + x.importe, 0);
  const ratios = [
    {n: "Tasa de esfuerzo", v: end, lim, f: "Cuotas de deuda ÷ ingresos fijos"},
    {n: "Vivienda sobre ingresos", v: fm.ing && nom ? viv / fm.ing * 100 : null, lim, f: "Hipoteca + comunidad ÷ ingresos fijos"},
    {n: "LTV del piso", v: hip && piso ? viva / piso.valor * 100 : null, lim: 80, f: "Hipoteca pendiente ÷ precio de compra"},
  ];
  if (!hip){ el.innerHTML = enDesarrollo("Financiación · en desarrollo", "Aquí irán tus ratios y la hipoteca.") + vacio("Sin hipoteca en los datos", "Cuando haya una deuda con cuadro de amortización, aquí verás las cuotas."); return; }
  el.innerHTML = `
    ${enDesarrollo("Financiación · en desarrollo", "Aquí calcularemos cuándo puedes volver a financiar una casa o un piso, con un scoring como el de los bancos y tu tasa de esfuerzo. Por ahora, tus ratios reales y la hipoteca.")}
    <div class="cifras">
      <div class="tile ${end > lim ? "alerta" : ""}"><div class="n">Tasa de esfuerzo</div><div class="v num ${end > lim ? "mal" : ""}">${pct(end)}</div><div class="d">${nom ? `Límite ${lim} %` : SIN_NOMINA}</div></div>
      <div class="tile"><div class="n">Cuota libre hasta el ${lim} %</div><div class="v num ${libre < 0 ? "mal" : ""}">${libre == null ? "—" : eur0(libre) + `<span class="tenue" style="font-size:14px">/mes</span>`}</div><div class="d">${nom ? "Con tus ingresos fijos de hoy" : SIN_NOMINA}</div></div>
      <div class="tile"><div class="n">Hipoteca pendiente</div><div class="v num">${eur0(viva)}</div><div class="d">${f ? "Tras la cuota del " + corta(leer(f.fecha)) : ""}</div></div>
      <div class="tile"><div class="n">Próximos 12 meses</div><div class="v num">${eur0(intAnio)}</div><div class="d">de intereses · ${eur0(capAnio)} de capital</div></div>
    </div>
    <div class="dos">
      <div class="bloque"><h3>Hipoteca: próximas cuotas <span class="chip">TAE ${String(hip.tae_pct).replace(".", ",")} %</span></h3>
        <div class="envuelve"><table><thead><tr><th>Fecha</th><th class="der">Cuota</th><th class="der">Capital</th><th class="der">Intereses</th><th class="der">Pendiente</th></tr></thead><tbody>
        ${sig.map(x => `<tr><td class="num">${corta(leer(x.fecha))}/${x.fecha.slice(2, 4)}</td><td class="der num"><b>${eur(x.cuota)}</b></td><td class="der num">${eur(x.amortizacion)}</td><td class="der num tenue">${eur(x.intereses)}</td><td class="der num">${eur0(x.pendiente)}</td></tr>`).join("")}
        </tbody></table></div><p class="nota">${esc(hip.fuente || "")}</p></div>
      <div class="pila">
        <div class="bloque"><h3>Tus ratios</h3>${ratios.map(medidorRatio).join("")}</div>
        ${proximo("¿Cuándo puedo volver a financiar?", "Fecha estimada según tu ahorro, la entrada necesaria y tu tasa de esfuerzo.")}
        ${proximo("Scoring bancario", "Cómo te vería un banco: estabilidad, endeudamiento, ahorro y colchón.")}
      </div>
    </div>`;
}

/* ---------- ¿Puedo comprarlo? (validador de compras) ----------
   Tres respuestas con las reglas de contexto/05: ¿puedo pagarlo?, ¿es buena decisión? y ¿qué pasa con mi patrimonio?
   La compra es siempre una Hipótesis: solo existe en esta pestaña y nunca entra en datos/. */
const REGLAS_COMPRA = {margen_min_tras_cuota: 300, dias_compromisos: 90, dias_horizonte: 90}; // provisionales [DECIDIR] (contexto/05: F4 y F6)
const aNum = s => { s = String(s ?? "").trim().replace(/\s|€/g, ""); if (!s) return null; if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const v = parseFloat(s); return isFinite(v) ? v : null; };
const FORMAS = {cuenta: "Cuenta", tarjeta: "Tarjeta", financiado: "Financiado"};
const TIPOS = {consumo: ["Consumo", "ropa, viaje, móvil"], valor: ["Conserva valor", "oro, reloj, arte"], renta: ["Da ingresos", "alquiler, negocio"]};
// Compras miradas: en Claude se guardan en tu cuenta (window.claude); en el iPhone, en el propio teléfono
let COMPRAS = (() => { try { return JSON.parse(localStorage.getItem("compras-evaluadas") || "[]"); } catch(e) { return []; } })(), NUBE = null;
const leerCompras = () => COMPRAS;
function anadirCompra(x){
  x = {...x, ts: Date.now()};
  if (NUBE){ NUBE.doc(String(x.ts)).set(x).catch(() => {}); return; }
  COMPRAS = [x, ...COMPRAS].slice(0, 30); try { localStorage.setItem("compras-evaluadas", JSON.stringify(COMPRAS)); } catch(e) {}
}
function quitarCompra(i){
  const x = COMPRAS[i]; if (!x) return;
  if (NUBE && x._id){ NUBE.doc(x._id).delete().catch(() => {}); return; }
  COMPRAS = COMPRAS.filter((_, k) => k !== i); try { localStorage.setItem("compras-evaluadas", JSON.stringify(COMPRAS)); } catch(e) {}
}
(async () => {
  if (!window.claude || !window.claude.use) return;
  try {
    const db = await window.claude.use("db"), user = await window.claude.use("user");
    const uid = user ? await user.id() : null; if (!db || !uid) return;
    NUBE = db.collection("data/users/" + uid + "/compras");
    NUBE.orderBy("ts", "desc").limit(50).onSnapshot(s => {
      COMPRAS = s.docs.map(d => ({...d.data(), _id: d.id}));
      if (ACTUAL === "comprar" && !(document.activeElement && document.activeElement.matches("input"))) pintar();
    }, () => { NUBE = null; });
  } catch(e) { NUBE = null; }
})();

function eventosCompra(c, d){
  const nombre = c.que || "Compra", imp = aNum(c.importe) || 0, ev = [];
  if (c.forma === "tarjeta"){
    const cargo = laborable(new Date(d.getFullYear(), d.getMonth() + 1, C.tarjetas.dia_cargo));
    ev.push({fecha: cargo, concepto: nombre + " (tarjeta)", importe: -imp, clase: "gasto"});
  } else if (c.forma === "financiado"){
    const ent = aNum(c.entrada) || 0, cuota = aNum(c.cuota) || 0, n = Math.max(0, Math.round(aNum(c.plazo) || 0));
    if (ent) ev.push({fecha: d, concepto: nombre + " (entrada)", importe: -ent, clase: "gasto"});
    for (let k = 1; k <= n; k++) ev.push({fecha: laborable(new Date(d.getFullYear(), d.getMonth() + k, Math.min(d.getDate(), 28))), concepto: nombre + ` (cuota ${k}/${n})`, importe: -cuota, clase: "gasto"});
  } else ev.push({fecha: d, concepto: nombre, importe: -imp, clase: "gasto"});
  // Si da ingresos: entran cada mes desde el mes siguiente (Hipótesis del usuario)
  const ing = c.tipo === "renta" ? aNum(c.ingreso) : null;
  if (ing) for (let k = 1; k <= 24; k++) ev.push({fecha: laborable(new Date(d.getFullYear(), d.getMonth() + k, Math.min(d.getDate(), 28))), concepto: nombre + " (ingreso)", importe: ing, clase: "ingreso"});
  return ev;
}

function evaluarCompra(c, fechaForzada){
  let d = fechaForzada || (c.fecha ? leer(c.fecha) : sumar(BASE, 1));
  if (d <= BASE) d = sumar(BASE, 1);
  const ev = eventosCompra(c, d), fm = fijosMensuales(), colchon = COLCHON_BASE();
  const gastos = ev.filter(e => e.importe < 0), finEv = gastos.reduce((a, e) => e.fecha > a ? e.fecha : a, d);
  const dias = Math.min(400, Math.max(entre(BASE, sumar(d, REGLAS_COMPRA.dias_horizonte)), entre(BASE, finEv) + 1, ESTADO.horizonte));
  const sin = prevision(dias), con = prevision(dias, ev);
  const imp = aNum(c.importe) || 0, fin = c.forma === "financiado";
  const cuota = fin ? (aNum(c.cuota) || 0) : 0, plazo = Math.round(aNum(c.plazo) || 0), entrada = aNum(c.entrada) || 0;
  const ingreso = c.tipo === "renta" ? (aNum(c.ingreso) || 0) : 0, inversion = c.tipo !== "consumo";
  const reventa = inversion ? aNum(c.reventa) : 0;
  // 1 · ¿Puedo pagarlo?
  const tj = con.sin.find(e => e.origen === "tarjeta" && e.fecha >= d) || con.sin[0];
  const r1 = {ok: con.min.saldo >= 0, cifra: con.min.saldo, fecha: con.min.fecha, antes: sin.min.saldo, tope: tj ? tj.tope : null, tjFecha: tj ? tj.fecha : null};
  // 2 · ¿Es buena decisión?
  const r2_ = [];
  r2_.push({n: "Colchón intacto", ok: con.min.saldo >= colchon, c: eur0(con.min.saldo) + " / " + eur0(colchon), yaFallaba: sin.min.saldo < colchon});
  const limC = sumar(d, REGLAS_COMPRA.dias_compromisos);
  const comp = C.pendientes.filter(x => x.clase !== "cobro" && x.importe != null && x.fecha && leer(x.fecha) <= limC);
  r2_.push({n: "Sin pagos grandes en 3 meses", ok: !comp.length, c: comp.length ? eur0(comp.reduce((a, x) => a + x.importe, 0)) + " pendientes" : "Ninguno", yaFallaba: !!comp.length});
  const cerr = resumenMeses().filter(m => m.completo).pop();
  if (cerr) r2_.push({n: "Último mes en positivo", ok: cerr.ahorro > 0, c: cap(MESES[+cerr.k.slice(5) - 1]) + " " + eur0(cerr.ahorro), yaFallaba: cerr.ahorro <= 0});
  if (fin){
    const end = fm.ing ? (fm.deuda + cuota) / fm.ing * 100 : null, lim = C.reglas.tasa_esfuerzo_max_pct;
    r2_.push({n: "Endeudamiento ≤ " + lim + " %", ok: end != null && end <= lim, c: pct(end)});
    const mg = r2(fm.ing + ingreso - fm.gas - cuota);
    r2_.push({n: "Margen tras la cuota ≥ " + eur0(REGLAS_COMPRA.margen_min_tras_cuota), ok: mg >= REGLAS_COMPRA.margen_min_tras_cuota, c: eur0(mg) + "/mes"});
  }
  if (inversion){
    const pasoActual = escaleraExcedente(sin).actual; // índice del primer paso sin completar (contexto/05)
    r2_.push({n: "Invertir con los pasos 1–4 hechos", ok: pasoActual >= 4, c: pasoActual >= 4 ? "Sí" : "Toca el paso " + (pasoActual + 1), yaFallaba: pasoActual < 4});
  }
  const fallan = r2_.filter(x => !x.ok);
  const v2 = !r1.ok ? {cls: "no", t: "No", sub: "Te deja en negativo"}
    : !fallan.length ? {cls: "si", t: "Sí", sub: "Encaja en tus reglas"}
    : fallan.every(x => x.yaFallaba) ? {cls: "medio", t: "Ahora no", sub: "Ya ibas justo sin la compra: es cuestión de momento"}
    : {cls: "no", t: "No", sub: "Rompe tus reglas"};
  // 3 · Patrimonio
  const coste = fin ? r2(entrada + cuota * plazo) : imp;
  const conservas = c.tipo === "consumo" ? 0 : reventa;
  const efecto = conservas == null ? null : r2(conservas - coste);
  const p3 = {coste, conservas, efecto, extraFin: fin && imp ? r2(coste - imp) : null, ingreso, recuperas: ingreso > 0 ? Math.ceil((coste - (conservas || 0)) / ingreso) : null, perdidaVenta: inversion && reventa != null ? r2(imp - reventa) : null, resultadoMes: r2(ingreso - cuota)};
  return {d, ev, sin, con, r1, r2: r2_, v2, p3, dias};
}

// Primer día (hasta 180) en que la compra deja el colchón entero; si no, el primero en que no quedas en negativo
function mejorFecha(c){
  let sinNeg = null;
  for (let k = 1; k <= 180; k++){
    const d = sumar(BASE, k), r = evaluarCompra(c, d);
    if (r.con.min.saldo >= COLCHON_BASE()) return {d, sinNeg};
    if (!sinNeg && r.con.min.saldo >= 0) sinNeg = d;
  }
  return {d: null, sinNeg};
}

function vistaComprar(el){
  const c = ESTADO.compra, lista = leerCompras();
  const valido = aNum(c.importe) > 0 && (c.forma !== "financiado" || (aNum(c.cuota) > 0 && aNum(c.plazo) > 0));
  const r = ESTADO.evaluada && valido ? evaluarCompra(c) : null;
  const mf = r ? mejorFecha(c) : null;
  const segC = (k, obj, sel) => `<span class="segmentos" role="group">${Object.entries(obj).map(([v, n]) => `<button type="button" data-${k}="${v}" aria-pressed="${sel === v}">${Array.isArray(n) ? n[0] : n}</button>`).join("")}</span>`;
  const p3 = r && r.p3;
  el.innerHTML = `<p class="sub" style="margin:0">Tus datos reales y tus reglas. La compra es una ${cert("hipotesis")}: no cambia tus datos.${MULTI ? " Se mira con el dinero de todas tus cuentas juntas." : ""}</p>
    <div class="bloque">
      <div class="form-compra">
        <label class="ancho">Qué<input type="text" id="c-que" value="${esc(c.que)}" placeholder="Ruedas, reloj, viaje…"></label>
        <label>Precio (€)<input type="text" inputmode="decimal" id="c-importe" value="${esc(c.importe)}" placeholder="0,00"></label>
        <label>Cuándo<input type="date" id="c-fecha" value="${esc(c.fecha)}" min="${iso(sumar(BASE, 1))}"></label>
        <div class="campo ancho"><span>Qué tipo de compra es <span class="tenue" style="font-weight:500">· ${TIPOS[c.tipo][1]}</span></span>${segC("tipo", TIPOS, c.tipo)}</div>
        <div class="campo ancho"><span>Cómo la pagas</span>${segC("forma", FORMAS, c.forma)}</div>
        ${c.tipo !== "consumo" ? `<label>Valor si lo vendieras (€)<input type="text" inputmode="decimal" id="c-reventa" value="${esc(c.reventa)}" placeholder="Lo que te darían"></label>` : ""}
        ${c.tipo === "renta" ? `<label>Ingreso al mes (€)<input type="text" inputmode="decimal" id="c-ingreso" value="${esc(c.ingreso)}" placeholder="0,00"></label>` : ""}
        ${c.forma === "financiado" ? `<label>Cuota / mes (€)<input type="text" inputmode="decimal" id="c-cuota" value="${esc(c.cuota)}" placeholder="0,00"></label>
          <label>Nº cuotas<input type="number" min="1" id="c-plazo" value="${esc(c.plazo)}" placeholder="12"></label>
          <label>Entrada (€)<input type="text" inputmode="decimal" id="c-entrada" value="${esc(c.entrada)}" placeholder="0"></label>` : ""}
        <div class="botones"><button class="boton" type="button" data-evaluar>Evaluar</button>${r ? `<button class="boton sec" type="button" data-guardar>Guardar</button>` : ""}</div>
      </div>
      ${ESTADO.evaluada && !valido ? `<p class="sub mal" style="margin-top:12px">Falta el precio${c.forma === "financiado" ? ", la cuota o el nº de cuotas" : ""}.</p>` : ""}
    </div>
    ${r ? `
    <div class="tres">
      <div class="resp ${r.r1.ok ? "si" : "no"}"><div class="preg">¿Puedo pagarlo?</div><div class="ans">${r.r1.ok ? "Sí" : "No"}</div>
        <div class="kv"><span>Día más justo</span><b class="num ${r.r1.cifra < 0 ? "mal" : ""}">${eur0(r.r1.cifra)}</b></div>
        <div class="kv"><span>Sin la compra</span><b class="num tenue">${eur0(r.r1.antes)}</b></div>
        ${r.r1.tjFecha ? `<div class="kv"><span>Tope tarjetas ${corta(r.r1.tjFecha)}</span><b class="num ${r.r1.tope < 0 ? "mal" : "ojo"}">${r.r1.tope < 0 ? "Sin margen" : eur0(r.r1.tope)}</b></div>` : ""}</div>
      <div class="resp ${r.v2.cls}"><div class="preg">¿Es buena decisión?</div><div class="ans">${r.v2.t}</div><p class="sub" style="margin:0 0 4px">${r.v2.sub}</p>
        <ul class="checks">${r.r2.map(x => `<li class="${x.ok ? "" : "f"}"><span class="m" aria-hidden="true">${x.ok ? "✓" : "✕"}</span><span>${esc(x.n)}</span><span class="c num ${x.ok ? "bien" : "mal"}">${esc(x.c)}</span></li>`).join("")}</ul></div>
      <div class="resp ${p3.efecto == null ? "" : p3.efecto >= 0 ? "si" : c.tipo === "consumo" ? "" : "no"}"><div class="preg">¿Y tu patrimonio?</div>
        <div class="ans num ${p3.efecto == null ? "tenue" : p3.efecto >= 0 ? "bien" : "mal"}">${p3.efecto == null ? "¿?" : eur0(p3.efecto)}</div>
        <p class="sub" style="margin:0 0 4px">${c.tipo === "consumo" ? "Es gasto: el dinero no vuelve" : p3.conservas == null ? "Pon el valor de reventa" : p3.efecto >= 0 ? "Conservas el valor" : "Pierdes valor al comprar"}</p>
        <div class="kv"><span>Te cuesta</span><b class="num">${eur0(p3.coste)}</b></div>
        ${c.tipo !== "consumo" ? `<div class="kv"><span>Valor que conservas</span><b class="num">${p3.conservas == null ? "—" : eur0(p3.conservas)}</b></div>` : ""}
        ${p3.extraFin ? `<div class="kv"><span>Intereses / extra</span><b class="num mal">${eur0(p3.extraFin)}</b></div>` : ""}
        ${p3.ingreso ? `<div class="kv"><span>Ingreso al mes</span><b class="num bien">${eur(p3.ingreso, true)}</b></div><div class="kv"><span>Lo recuperas en</span><b class="num">${p3.recuperas > 0 ? plural(p3.recuperas, "mes", "meses") : "—"}</b></div>` : ""}
        ${c.tipo !== "consumo" ? `<p class="nota">Aunque sea inversión, el dinero sale de la cuenta: cuenta igual para el colchón.</p>` : ""}</div>
    </div>
    <div class="dos">
      <figure class="grafico"><div class="tit">Tu saldo con y sin la compra</div>${leyendaSaldo({comparar: true, colchon: true})}<div class="hueco"></div></figure>
      <div class="bloque"><h3>Mejor momento</h3>
        ${mf.d ? `<p class="gran bien">${corta(mf.d)}</p><p class="sub">Primer día con el colchón intacto.</p>`
        : mf.sinNeg ? `<p class="gran ojo">${corta(mf.sinNeg)}</p><p class="sub">Primer día sin quedar en negativo. Con colchón intacto: ninguno en 180 días.</p>`
        : `<p class="gran mal">Ninguno</p><p class="sub">En 180 días te deja en negativo siempre.</p>`}
        <p class="nota">Sin tarjetas ni día a día.</p></div>
    </div>` : ""}
    <div class="bloque"><h3>Compras miradas <span class="tenue" style="font-size:13px;font-weight:600">${NUBE ? "guardadas en tu cuenta" : "en este navegador"}</span></h3>${lista.length ? `<ul class="movs">
      ${lista.map((x, i) => `<li class="mov ${x.r1 ? "ing" : "sin"}"><span class="mi" aria-hidden="true">${x.r1 ? "✓" : "✕"}</span><span class="mc"><span class="mn">${esc(x.que || "Compra")}</span><span class="ms">${TIPOS[x.tipo || "consumo"][0]} · ${FORMAS[x.forma] || ""} · ${esc(x.r2)}</span></span><span class="mv"><b class="num">${eur(aNum(x.importe))}</b><span><button class="enlace" type="button" data-cargar="${i}">Ver</button> · <button class="enlace" type="button" data-quitar="${i}" style="color:var(--critico)">Quitar</button></span></span></li>`).join("")}
      </ul>` : `<p class="sub">Ninguna todavía.</p>`}</div>
    <details class="metodo"><summary>Cómo decide</summary><ul>
      <li><b>¿Puedo pagarlo?</b> El saldo previsto no baja de 0 (hasta ${REGLAS_COMPRA.dias_horizonte} días después o la última cuota).</li>
      <li><b>¿Es buena decisión?</b> Tus reglas: colchón base (${eur(COLCHON_BASE())}) intacto, sin pagos comprometidos en ${REGLAS_COMPRA.dias_compromisos} días y último mes en positivo. Financiado: endeudamiento ≤ ${C.reglas.tasa_esfuerzo_max_pct} % y margen ≥ ${eur(REGLAS_COMPRA.margen_min_tras_cuota)} (provisional). Inversión: solo con los pasos 1–4 del excedente hechos.</li>
      <li><b>Patrimonio:</b> valor que conservas − lo que te cuesta. El valor de reventa y el ingreso los pones tú (Hipótesis). Si da ingresos, se suman en la previsión desde el mes siguiente.</li>
      <li>«Ahora no»: lo que falla ya fallaba sin la compra. Tarjeta: se carga entera el día ${C.tarjetas.dia_cargo} del mes siguiente.</li></ul></details>`;
  if (r) graficoSaldo(el.querySelector(".hueco"), r.con, {comparar: r.sin, colchon: true});
  const campo = (id, k) => { const i = $(id); if (i) i.oninput = e => { ESTADO.compra[k] = e.target.value; }; };
  [["c-que", "que"], ["c-importe", "importe"], ["c-fecha", "fecha"], ["c-cuota", "cuota"], ["c-plazo", "plazo"], ["c-entrada", "entrada"], ["c-reventa", "reventa"], ["c-ingreso", "ingreso"]].forEach(([i, k]) => campo(i, k));
  el.onclick = e => {
    const f = e.target.closest("[data-forma]"); if (f){ ESTADO.compra.forma = f.dataset.forma; pintar(); return; }
    const ti = e.target.closest("[data-tipo]"); if (ti){ ESTADO.compra.tipo = ti.dataset.tipo; pintar(); return; }
    if (e.target.closest("[data-evaluar]")){ ESTADO.evaluada = true; pintar(); return; }
    if (e.target.closest("[data-guardar]") && r){
      anadirCompra({...c, cuando: corta(HOY), r1: r.r1.ok, r2: r.v2.t}); pintar(); return; }
    const q = e.target.closest("[data-quitar]"); if (q){ quitarCompra(+q.dataset.quitar); pintar(); return; }
    const g = e.target.closest("[data-cargar]"); if (g){ const x = leerCompras()[+g.dataset.cargar]; if (x){ const {cuando, r1, r2, ts, _id, ...resto} = x; ESTADO.compra = {...ESTADO.compra, tipo: "consumo", ...resto}; if (!ESTADO.compra.fecha || leer(ESTADO.compra.fecha) <= BASE) ESTADO.compra.fecha = iso(sumar(BASE, 1)); ESTADO.evaluada = true; pintar(); window.scrollTo(0, 0); } }
  };
  el.onkeydown = e => { if (e.key === "Enter" && e.target.matches("input")){ ESTADO.evaluada = true; pintar(); } };
}

// Escalera del excedente (contexto/05, «Orden de uso del excedente mensual»). Solo usa datos reales o de config.
function escaleraExcedente(p){
  const colchon = COLCHON_BASE(), fam = C.deudas.filter(d => ["madre", "abuela"].includes(d.id));
  const famTotal = r2(fam.reduce((a, d) => a + d.pendiente, 0));
  const compromisos = C.pendientes.filter(x => x.importe != null && x.clase !== "cobro");
  const sinImp = C.pendientes.filter(x => x.importe == null);
  const paso1 = p.min.saldo >= 0;
  const paso2 = p.min.saldo >= colchon;
  const pasos = [
    {t: "Pagos comprometidos", e: paso1 ? "Cubierto" : "No cubierto", c: paso1 ? "hecho" : "curso",
     x: `${eur(r2(compromisos.reduce((a, x) => a + x.importe, 0)))} en honorarios`},
    {t: "Colchón base", e: paso2 ? "Completo" : eur(Math.max(0, p.min.saldo)) + " de " + eur(colchon), c: paso2 ? "hecho" : paso1 ? "curso" : "bloq", prog: Math.max(0, Math.min(1, p.min.saldo / colchon)),
     x: `${C.reglas.colchon_meses_estable || 3} meses de gastos fijos`},
    {t: "Devolución a la familia", e: eur(famTotal) + " pendientes", c: paso2 ? "curso" : "bloq",
     x: `${fam.map(d => cap(d.nombre.replace("Devolución a mi ", "")) + " " + eur0(d.pendiente)).join(" · ")} · cuota sin decidir`},
    {t: "Colchón específico del piso", e: "Sin decidir", c: "bloq", x: "Vacíos y reparaciones"},
    {t: "Ahorro para la siguiente operación", e: "—", c: "bloq", x: "Por ejemplo, la casa propia"},
    {t: "Inversión financiera", e: "Bloqueada", c: "bloq", x: "Solo con 1–4 completos"},
  ];
  const actual = pasos.findIndex(s => s.c !== "hecho");
  return {actual, html: `<ol class="escalera">${pasos.map((s, i) => `<li class="${s.c}"><span class="t">${esc(s.t)}${i === actual ? ` <span class="chip" style="background:var(--aviso-suave);color:var(--aviso)">Ahora toca</span>` : ""}</span><span class="e ${s.c === "hecho" ? "bien" : s.c === "curso" ? "ojo" : "tenue"}">${esc(s.e)}</span><span class="x">${esc(s.x)}</span>${s.prog != null && s.c !== "hecho" ? `<div class="medidor ${s.prog > .5 ? "medio" : ""}" style="height:8px"><i style="width:${s.prog * 100}%"></i></div>` : ""}</li>`).join("")}</ol>`};
}

function medidorRatio(r){
  if (r.v == null) return `<div class="ratio"><div class="cab"><span>${esc(r.n)}</span><span class="v">—</span></div><div class="f">${esc(r.f)}</div></div>`;
  const tope = Math.max(100, r.v * 1.1), malo = r.lim != null && r.v > r.lim, cerca = r.lim != null && !malo && r.v > r.lim * .85;
  return `<div class="ratio"><div class="cab"><span>${esc(r.n)}</span><span class="v num ${malo ? "mal" : cerca ? "ojo" : ""}">${pct(r.v)}</span></div>
    <div class="medidor ${malo ? "" : cerca ? "medio" : "ok"}" role="img" aria-label="${esc(r.n)} ${pct(r.v)}${r.lim != null ? ", límite " + r.lim + " %" : ""}"><i style="width:${r.v / tope * 100}%;${r.lim == null ? "background:var(--tinta-2)" : ""}"></i>${r.lim != null ? `<b style="left:${r.lim / tope * 100}%" title="Límite ${r.lim} %"></b>` : ""}</div>
    <div class="f">${esc(r.f)}${r.lim != null ? ` · Límite ${r.lim} %${malo ? " · <b class='mal'>por encima</b>" : cerca ? " · cerca del límite" : ""}` : " · Informativo"}</div></div>`;
}

/* =========================================================
   MARCO Y ARRANQUE
   ========================================================= */
const PRINCIPALES = [["inicio", "Inicio"], ["pasado", "Pasado"], ["futuro", "Futuro"]];
const HERRAMIENTAS = [["comprar", "¿Puedo comprarlo?", "Evalúa una compra", false], ["inversiones", "Inversiones", "Cartera y reparto del ahorro", true], ["financiacion", "Financiación", "Tasa de esfuerzo y vivienda", true]];
const TITULOS = Object.fromEntries([...PRINCIPALES, ...HERRAMIENTAS].map(([k, n]) => [k, n]));
const VISTAS = {inicio: vistaInicio, pasado: vistaPasado, futuro: vistaFuturo, comprar: vistaComprar, inversiones: vistaInversiones, financiacion: vistaFinanciacion};
// Direcciones de versiones anteriores, por si hay enlaces guardados
const ANTIGUAS = {calendario: "futuro", prevision: "futuro", recurrentes: "futuro", movimientos: "pasado", gastos: "pasado", global: "inicio", faltan: "inicio"};
let ACTUAL = "inicio";
// La cuenta elegida arriba solo cuenta en Inicio, Pasado y Futuro; las herramientas miran todo el dinero junto
const SEL = () => MULTI && PRINCIPALES.some(([k]) => k === ACTUAL) ? ESTADO.cuenta : "todas";

function abrirHoja(titulo, html){
  $("hoja-cont").innerHTML = `<div class="hoja-cab"><h2>${titulo}</h2><button type="button" data-cerrar aria-label="Cerrar">${icono("cerrar")}</button></div>${html}`;
  $("hoja").hidden = false; $("hoja-cont").querySelector("[data-cerrar]").focus();
}
const cerrarHoja = () => { $("hoja").hidden = true; };
function hojaLiquidez(){
  const L = posicionLiquida();
  abrirHoja("Posición líquida", `<p class="gran num">${eur(L.total)}</p><p class="sub">Todo lo que puedes usar sin vender el piso${MULTI ? ": tus cuentas y lo demás que es líquido" : ""}.</p>
    <ul class="movs">${L.partes.map(x => `<li class="mov ${x.c ? "cta-f " + x.c.cls : "ing"}"><span class="mi">${icono(x.ic)}</span><span class="mc"><span class="mn">${esc(x.n)}</span><span class="ms">${esc(x.d)}</span></span><span class="mv"><b class="num">${eurS(x.v)}</b></span></li>`).join("")}
    ${L.comprometido ? `<li class="mov ven"><span class="mi" aria-hidden="true">!</span><span class="mc"><span class="mn">Comprometido</span><span class="ms">Pagos pendientes de cargo</span></span><span class="mv"><b class="num">${eur(-L.comprometido)}</b></span></li>` : ""}</ul>
    ${L.comprometido ? `<ul class="lista" style="margin-top:6px;border-top:2px solid var(--tinta)"><li><span class="nom">Libre de compromisos</span><span class="val num ${L.libre < 0 ? "mal" : ""}">${eur(L.libre)}</span></li></ul>` : ""}
    ${CUENTAS.some(c => c.saldo == null) ? `<p class="nota">${esc(CUENTAS.filter(c => c.saldo == null).map(c => c.nombre).join(" y "))}: falta el saldo, no se suma.</p>` : ""}`);
}
// Contraste de datos: lo que generar_datos.py comprueba al generar datos.js (cuadre, fijos frente al extracto, categorías…)
// y, además, lo que la app recalcula por su cuenta (previsión y meses) frente a lo que calculó el generador.
function htmlContraste(){
  const k = D.comprobaciones; if (!k) return "";
  const m = contrasteModelo(), av = avisosDatos();
  return `<h3 class="contraste-t">Contraste de datos <span class="chip ${av.length ? "oro" : ""}">${av.length ? plural(av.length, "aviso", "avisos") : "Todo cuadra"}</span></h3>
    <p class="sub">${plural(k.hechas || 0, "comprobación", "comprobaciones")} al generar los datos (${esc((D.generado || "").slice(0, 10).split("-").reverse().join("/"))}): el saldo de cada cuenta encadena apunte a apunte, cada fijo se compara con el extracto y nada lleva importe sin fuente.${m.hechas ? ` La app vuelve a calcular por su cuenta la previsión y los meses (${plural(m.hechas, "comprobación más", "comprobaciones más")}) y ${m.av.length ? "<b>no coinciden</b> con el generador: mira los avisos." : "coinciden con el generador."}` : ""}</p>
    ${av.length ? `<ul class="alertas">${av.map(a => `<li class="aviso"><span class="ico" aria-hidden="true">!</span><span>${esc(a)}</span></li>`).join("")}</ul>` : ""}`;
}
function hojaPendientes(){
  const items = datosQueFaltan();
  abrirHoja("Datos pendientes", (items.length ? `<p class="sub">Cuando lo sepas, díselo al agente y desaparece de aquí.</p><ul class="lista">${items.map(i => `<li><span class="nom">${i.c ? punto(i.c) + " " : ""}${esc(i.t)}</span><span></span>${i.q ? `<span class="det">${esc(i.q)}</span>` : ""}${i.i ? `<span class="det tenue">${esc(i.i)}</span>` : ""}</li>`).join("")}</ul>`
    : `<p class="sub">No falta nada. Las tarjetas y las ruedas se esperan al extracto.</p>`) + htmlContraste());
}
function hojaHerramientas(){
  abrirHoja("Herramientas", `<div class="herr">${HERRAMIENTAS.map(([k, n, d, dev]) => `<button type="button" data-tab="${k}" aria-current="${k === ACTUAL ? "page" : "false"}"><span class="ic">${icono(k)}</span><span>${n}<small>${d}</small></span>${dev ? `<span class="chip oro dev">En desarrollo</span>` : ""}</button>`).join("")}</div>`);
}

function pintar(){
  const dias = entre(DATO_VIEJO, HOY), fr = $("frescura");
  fr.textContent = "Datos al " + corta(DATO_VIEJO) + (dias > 0 ? " · hace " + plural(dias, "día", "días") : "");
  fr.classList.toggle("vieja", dias > 7);
  const nP = datosQueFaltan().length + avisosDatos().length;
  $("pend").innerHTML = `<span class="ic">${icono("info")}</span>${nP ? `<i>${nP}</i>` : ""}`;
  $("pend").setAttribute("aria-label", nP ? `${nP} datos pendientes o avisos` : "Datos pendientes");
  $("titulo").textContent = TITULOS[ACTUAL];
  document.title = TITULOS[ACTUAL] + " · Finanzas de Alberto";
  // Selector de banco: «Todas» o una cuenta, cada una con su color
  const sel = SEL(), nav = $("cuentas-sel"), conSel = MULTI && PRINCIPALES.some(([k]) => k === ACTUAL);
  nav.hidden = !conSel;
  nav.innerHTML = conSel ? `<button type="button" class="b-neutro" data-cuenta="todas" aria-pressed="${sel === "todas"}">Todas</button>`
    + CUENTAS.map(c => `<button type="button" class="${c.cls}" data-cuenta="${esc(c.id)}" aria-pressed="${sel === c.id}"><span class="pb"></span>${esc(c.nombre)}</button>`).join("") : "";
  // Muelle: lo que hay en cada cuenta y el total líquido, siempre a la vista
  const L = posicionLiquida();
  $("liq").innerHTML = `<span class="cs">${CUENTAS.map(c => `<span class="banco ${c.cls}"><span class="pb"></span>${esc(c.nombre)} <b class="num">${c.saldo == null ? "¿?" : eur0(c.saldo)}</b></span>`).join("")}</span><span class="tot"><small>Líquido</small><b class="num">${eur(L.total)}</b></span>`;
  const enHerr = HERRAMIENTAS.some(([k]) => k === ACTUAL);
  $("barra").innerHTML = PRINCIPALES.map(([k, n]) => `<button type="button" data-tab="${k}" aria-current="${k === ACTUAL ? "page" : "false"}"><span class="ic">${icono(k)}</span><span>${n}</span></button>`).join("")
    + `<button type="button" data-herr aria-current="${enHerr ? "page" : "false"}"><span class="ic">${icono("herramientas")}</span><span>Herramientas</span></button>`;
  $("app").innerHTML = `<section class="vista" id="v-${ACTUAL}"></section>`;
  VISTAS[ACTUAL]($("v-" + ACTUAL));
}

if (!D || !C || !PRI || !PRI.movs.length){
  $("app").innerHTML = `<p class="vacio">No encuentro los datos. Esta página necesita <b>datos.js</b> a su lado. Pídele al agente: «genera datos.js con generar_datos.py».</p>`;
} else {
  const deHash = () => { let h = location.hash.slice(1); h = ANTIGUAS[h] || h; if (VISTAS[h]) ACTUAL = h; return location.hash.slice(1) === "faltan"; };
  const pedirFaltan = deHash();
  window.addEventListener("hashchange", () => { deHash(); cerrarHoja(); pintar(); window.scrollTo(0, 0); });
  document.addEventListener("click", e => {
    if (e.target.closest("[data-cerrar]") || e.target.id === "hoja"){ cerrarHoja(); return; }
    if (e.target.closest("[data-liq]")){ hojaLiquidez(); return; }
    if (e.target.closest("[data-pend]")){ hojaPendientes(); return; }
    if (e.target.closest("[data-herr]")){ hojaHerramientas(); return; }
    const t = e.target.closest("[data-tab],[data-ir]"); if (t){ cerrarHoja(); const k = t.dataset.tab || t.dataset.ir; if (k === ACTUAL){ pintar(); window.scrollTo(0, 0); } else location.hash = k; return; }
    const cu = e.target.closest("[data-cuenta]"); if (cu){ ESTADO.cuenta = cu.dataset.cuenta; ESTADO.verTodos = false; ESTADO.diaSel = null; ESTADO.filtro = {cat: "", q: "", tipo: ""}; pintar(); window.scrollTo(0, 0); return; }
    const h = e.target.closest("[data-horizonte]"); if (h){ ESTADO.horizonte = +h.dataset.horizonte; guardar(); pintar(); return; }
    const mo = e.target.closest("[data-modo]"); if (mo){ ESTADO.futuro = mo.dataset.modo; guardar(); pintar(); return; }
    if (e.target.closest("[data-vertodos]")){ ESTADO.verTodos = true; pintar(); return; }
    const mp = e.target.closest("[data-mespas]"); if (mp){ ESTADO.mesPasado = mp.dataset.mespas; ESTADO.filtro.cat = ""; ESTADO.verTodos = false; pintar(); return; }
    const c = e.target.closest("[data-cal]"); if (c){
      if (c.dataset.cal === "hoy") ESTADO.mesCal = ym(HOY);
      else { const [y, m] = ESTADO.mesCal.split("-").map(Number); ESTADO.mesCal = ym(new Date(y, m - 1 + Number(c.dataset.cal), 1)); }
      pintar(); return; }
    const d = e.target.closest("[data-dia]"); if (d){ ESTADO.diaSel = d.dataset.dia; pintar(); document.querySelector(`[data-dia="${d.dataset.dia}"]`)?.focus(); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("hoja").hidden) cerrarHoja(); });
  let t, ancho = window.innerWidth;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (window.innerWidth !== ancho){ ancho = window.innerWidth; pintar(); } }, 150); });
  pintar();
  if (pedirFaltan) hojaPendientes();
}

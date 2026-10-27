
"use strict";
/* =========================================================
   UTILIDADES
   ========================================================= */
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sept","oct","nov","dic"];
const MESES_L = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
function miles(entero){ return String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function eur(n, signo){
  if (n == null) return "sin importe";
  const s = Math.abs(n).toFixed(2).split(".");
  return (n < 0 ? "−" : (signo && n > 0 ? "+" : "")) + miles(s[0]) + "," + s[1] + " €";
}
const eur0 = n => (Math.round(n) < 0 ? "−" : "") + miles(Math.round(Math.abs(n))) + " €";
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
const entre = (a, b) => Math.round((b - a) / 86400000);
const laborable = d => { const r = new Date(d); while (r.getDay() === 0 || r.getDay() === 6) r.setDate(r.getDate() + 1); return r; };
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $ = id => document.getElementById(id);
const ETQ = {exacto: "Exacto", ultimo_real: "Último real", por_confirmar: "Por confirmar", sin_importe: "Sin importe", aviso: "Aviso", hipotesis: "Hipótesis"};
// Iconos de trazo (24×24) para pestañas y tarjetas
const ICO = {
  inicio: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  prevision: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  movimientos: '<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>',
  gastos: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.4 6.4"/>',
  recurrentes: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M20 4v5h-5M4 20v-5h5"/>',
  comprar: '<path d="M5 7h14l-1.5 11a2 2 0 0 1-2 1.7h-7A2 2 0 0 1 6.5 18z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',
  global: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  faltan: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>',
  cuenta: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
  bajada: '<path d="M12 4v14M6 12l6 6 6-6"/>',
  escudo: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>',
  tarjeta: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M15 15h3"/>',
  pasado: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 3"/>',
  futuro: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h3v3H8z"/>',
  herramientas: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  inversiones: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  financiacion: '<path d="M3 10l9-6 9 6"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/>',
  liquidez: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
  flecha: '<path d="M9 6l6 6-6 6"/>',
};
const icono = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k] || ""}</svg>`;
const cert = c => `<span class="cert ${c}">${ETQ[c] || c}</span>`;

/* =========================================================
   MODELO
   ========================================================= */
const D = window.DATOS;
const C = D ? D.config : null;
const MOVS = D ? D.movimientos.map(m => ({...m, f: leer(m.fecha)})) : [];
const ULT = MOVS[MOVS.length - 1];
const BASE = ULT ? ULT.f : new Date();
const HOY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

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

// --- Resumen por mes: ingresos y gastos corrientes (sin movimientos entre cuentas ni la compra del piso)
function resumenMeses(){
  const r = {};
  for (const m of MOVS){
    const k = m.fecha.slice(0, 7);
    const x = r[k] || (r[k] = {k, ingresos: 0, gastos: 0, porCat: {}, porIng: {}, interno: 0, compra: 0, hasta: m.f, n: 0});
    x.n++; if (m.f > x.hasta) x.hasta = m.f;
    if (m.tipo === "ingreso"){ x.ingresos += m.importe; x.porIng[m.cat] = (x.porIng[m.cat] || 0) + m.importe; }
    else if (m.tipo === "gasto"){ x.gastos -= m.importe; x.porCat[m.cat] = (x.porCat[m.cat] || 0) - m.importe; }
    else if (m.tipo === "interno") x.interno += m.importe;
    else x.compra += m.importe;
  }
  return Object.values(r).sort((a, b) => a.k < b.k ? -1 : 1).map(x => {
    const finMes = new Date(+x.k.slice(0,4), +x.k.slice(5,7), 0);
    for (const c in x.porCat) x.porCat[c] = r2(x.porCat[c]);
    for (const c in x.porIng) x.porIng[c] = r2(x.porIng[c]);
    return {...x, ingresos: r2(x.ingresos), gastos: r2(x.gastos), ahorro: r2(x.ingresos - x.gastos), interno: r2(x.interno), compra: r2(x.compra), completo: BASE >= finMes, finMes};
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

// --- La previsión: solo resta lo que tiene importe real; lo demás se cuenta como «sin importe»
// extra: movimientos hipotéticos (validador de compras). Nunca vienen de datos/.
function prevision(dias, extra){
  const fin = sumar(BASE, dias), ev = [];
  for (const x of extra || []) if (x.fecha > BASE && x.fecha <= fin) ev.push({...x, certeza: "hipotesis", origen: "hipotesis"});
  for (const f of C.fijos){
    if (f.activo === false) continue;
    for (const d of ocurrencias(f.dia, f.meses, BASE, fin)){
      const imp = cuotaEn(f, d), nota = f.nota || "";
      if (imp == null) ev.push({fecha: d, concepto: f.nombre, importe: null, certeza: "sin_importe", clase: f.tipo, nota, origen: "fijo"});
      else ev.push({fecha: d, concepto: f.nombre, importe: f.tipo === "ingreso" ? imp : -imp, certeza: f.certeza, clase: f.tipo, nota, origen: "fijo", id: f.id});
    }
  }
  const T = C.tarjetas;
  for (const d of ocurrencias(T.dia_cargo, null, BASE, fin)){
    const liq = (T.liquidaciones || []).find(l => l.cargo && ym(leer(l.cargo)) === ym(d));
    if (liq && liq.importe != null) ev.push({fecha: d, concepto: T.nombre, importe: -liq.importe, certeza: "exacto", clase: "gasto", nota: "Liquidación: " + (liq.fuente || ""), origen: "tarjeta"});
    else ev.push({fecha: d, concepto: T.nombre, importe: null, certeza: "sin_importe", clase: "gasto", nota: T.nota, origen: "tarjeta"});
  }
  for (const p of C.pendientes){
    if (!p.fecha) continue;
    let d = laborable(leer(p.fecha)), nota = p.nota || "";
    if (d <= BASE){ d = sumar(BASE, 1); nota = nota || "Vencido y sin cargar: se reserva desde el primer día"; }
    if (d > fin) continue;
    const imp = p.importe == null ? null : (p.clase === "cobro" ? p.importe : -p.importe);
    ev.push({fecha: d, concepto: p.nombre, importe: imp, certeza: imp == null ? "sin_importe" : (p.certeza || "exacto"), clase: p.clase === "cobro" ? "ingreso" : "gasto", nota, origen: "pendiente"});
  }
  for (const v of C.vencimientos){
    if (!v.fecha) continue;
    const d = leer(v.fecha);
    // Recordatorio para revisarlo antes del vencimiento (aviso_dias)
    if (v.aviso_dias){ const r = laborable(sumar(d, -v.aviso_dias)); if (r > BASE && r <= fin) ev.push({fecha: r, concepto: "Revisar: " + v.nombre.replace(/^Renovación del /, "").replace(/^seguro/, "Seguro"), importe: null, certeza: "aviso", clase: "aviso", nota: `Vence el ${corta(d)}${v.entidad ? " · " + v.entidad : ""}. Compara precios antes de que renueve solo`, origen: "revision"}); }
    if (d <= BASE || d > fin) continue;
    if (v.es_cargo) ev.push({fecha: d, concepto: v.nombre, importe: v.importe == null ? null : -v.importe, certeza: v.importe == null ? "sin_importe" : (v.certeza || "exacto"), clase: "gasto", nota: v.nota, origen: "vencimiento"});
    else ev.push({fecha: d, concepto: v.nombre, importe: null, certeza: "aviso", clase: "aviso", nota: v.nota, origen: "vencimiento"});
  }
  // Orden prudente dentro del día: gastos conocidos, sin importe, avisos y, al final, ingresos
  const orden = e => e.clase === "ingreso" ? 3 : e.certeza === "aviso" ? 2 : e.importe == null ? 1 : 0;
  ev.sort((a, b) => a.fecha - b.fecha || orden(a) - orden(b) || (a.importe || 0) - (b.importe || 0));
  let s = ULT.saldo, min = {saldo: s, fecha: BASE, previos: 0}, sinAntes = 0;
  for (const e of ev){
    if (e.importe != null) s = r2(s + e.importe);
    else if (e.certeza === "sin_importe") sinAntes++;
    e.saldo = s;
    if (e.importe != null && s < min.saldo) min = {saldo: s, fecha: e.fecha, previos: sinAntes};
  }
  // Tope de cada cargo sin importe: lo máximo que puede ser sin que la cuenta baje de 0 dentro del horizonte
  for (let k = 0; k < ev.length; k++){
    const e = ev[k]; if (e.certeza !== "sin_importe") continue;
    let t = e.saldo, tf = e.fecha;
    for (let j = k + 1; j < ev.length; j++) if (ev[j].importe != null && ev[j].saldo < t){ t = ev[j].saldo; tf = ev[j].fecha; }
    e.tope = t; e.topeFecha = tf;
  }
  const porDia = []; let i = 0, sd = ULT.saldo;
  for (let d = new Date(BASE); d <= fin; d = sumar(d, 1)){
    const del = [];
    while (i < ev.length && iso(ev[i].fecha) === iso(d)){ del.push(ev[i]); sd = ev[i].saldo; i++; }
    porDia.push({fecha: new Date(d), saldo: sd, ev: del});
  }
  const con = ev.filter(e => e.importe != null);
  return {
    dias, fin, ev, porDia, min, final: s,
    sin: ev.filter(e => e.certeza === "sin_importe"),
    porConfirmar: ev.filter(e => e.certeza === "por_confirmar"),
    ingresos: r2(con.filter(e => e.importe > 0).reduce((a, e) => a + e.importe, 0)),
    gastos: r2(-con.filter(e => e.importe < 0).reduce((a, e) => a + e.importe, 0)),
  };
}

// --- Saldo real al cerrar cada día (del extracto), los últimos «dias» hasta el día anterior a BASE
function historiaSaldo(dias){
  const r = [], desde = sumar(BASE, -dias);
  let j = 0, s = null;
  for (let d = new Date(desde); d < BASE; d = sumar(d, 1)){
    const k = iso(d), mov = [];
    while (j < MOVS.length && MOVS[j].fecha <= k){ if (MOVS[j].fecha === k) mov.push(MOVS[j]); s = MOVS[j].saldo; j++; }
    if (s != null) r.push({fecha: new Date(d), saldo: s, real: true, mov});
  }
  return r;
}

// --- Indicadores
function fijosMensuales(){
  let ing = 0, gas = 0, deuda = 0;
  for (const f of C.fijos){
    if (f.activo === false || f.importe == null || f.meses) continue;
    if (f.tipo === "ingreso") ing += f.importe; else gas += f.importe;
    if (f.deuda) deuda += f.importe;
  }
  return {ing: r2(ing), gas: r2(gas), deuda: r2(deuda)};
}
const COLCHON_BASE = () => r2(C.reglas.gastos_fijos_mensuales_colchon * (C.reglas.colchon_meses_estable || 3));
const textoTope = e => e.tope < 0
  ? `Antes de este cargo ya vas a quedar en negativo (${eur(e.tope)} el ${corta(e.topeFecha)}).`
  : `Tope: ${eur(e.tope)}. Si pasa de ahí, el ${corta(e.topeFecha)} te quedas en negativo.`;

// --- Lo que falta para que todo sea exacto (discreto: botón de la cabecera).
// Las tarjetas y lo marcado con no_preguntar no se preguntan: se esperan al extracto.
function datosQueFaltan(){
  const items = [];
  for (const x of C.pendientes.filter(x => x.importe == null && !x.no_preguntar))
    items.push({t: x.nombre, q: "Falta: importe" + (x.fecha ? "" : " y fecha"), i: x.nota || ""});
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

// --- Deudas con cuadro de amortización: cuota del mes y capital pendiente tras la última cuota pasada
const deudaDe = id => C.deudas.find(d => d.id === id);
function cuotaEn(f, d){
  if (!f.cuadro) return f.importe;
  const deu = deudaDe(f.cuadro), x = deu && deu.cuadro && deu.cuadro.find(x => x.fecha.slice(0, 7) === ym(d));
  return x ? x.cuota : f.importe;
}
function filaCuadro(deu, d){ let r = null; for (const x of deu.cuadro || []) if (leer(x.fecha) <= d) r = x; return r; }
const pendienteDe = deu => { const x = deu.cuadro ? filaCuadro(deu, BASE) : null; return x ? x.pendiente : deu.pendiente; };

// --- Posición líquida: cuenta + todo lo que es medianamente líquido (efectivo, capital social, fondos, acciones). El piso no.
function posicionLiquida(){
  const partes = [{id: "cuenta", n: "Cuenta Caja Rural", v: ULT.saldo, d: "Real a " + corta(BASE), ic: "cuenta"}];
  for (const b of C.bienes) if (b.liquido) partes.push({id: b.id, n: b.nombre, v: b.valor, d: b.nota || "", ic: b.id === "efectivo" ? "liquidez" : "escudo"});
  const inv = C.inversiones || [];
  if (inv.length) for (const i of inv) partes.push({id: i.id, n: i.nombre, v: i.valor, d: i.nota || "", ic: "inversiones"});
  else partes.push({id: "inv", n: "Fondos y acciones", v: 0, d: "Aún no tienes", ic: "inversiones"});
  const total = r2(partes.filter(x => x.v != null).reduce((a, x) => a + x.v, 0));
  const comprometido = r2(C.pendientes.filter(x => x.importe != null && x.clase !== "cobro").reduce((a, x) => a + x.importe, 0));
  return {partes, total, comprometido, libre: r2(total - comprometido)};
}
function patrimonio(){
  const liq = posicionLiquida(), inm = C.bienes.filter(b => !b.liquido && b.valor != null);
  const deudas = C.deudas.map(d => ({...d, viva: pendienteDe(d)}));
  const activos = r2(liq.total + inm.reduce((a, b) => a + b.valor, 0));
  const pasivos = r2(deudas.reduce((a, d) => a + d.viva, 0) + liq.comprometido);
  return {liq, inm, deudas, activos, pasivos, neto: r2(activos - pasivos)};
}

/* =========================================================
   GRÁFICOS (SVG a mano, sin librerías)
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

// Saldo en escalones: real del extracto (línea continua) + previsto (discontinua, con relleno),
// con el colchón y los cargos sin importe marcados. opc.hist = historiaSaldo(n); opc.comparar = otra previsión (sin la compra)
function graficoSaldo(hueco, p, opc){
  opc = opc || {};
  const W = Math.max(320, hueco.clientWidth || 900), estrecho = W < 560, H = estrecho ? 250 : 310;
  const M = {t: 24, r: estrecho ? 14 : 96, b: 30, l: estrecho ? 54 : 66};
  const hist = opc.hist || [], nh = hist.length;
  const dias = hist.concat(p.porDia), n = dias.length, colchon = COLCHON_BASE();
  const vals = dias.map(d => d.saldo).concat([colchon, 0], opc.comparar ? opc.comparar.porDia.map(d => d.saldo) : []);
  const vmin0 = Math.min(...vals), vmax0 = Math.max(...vals), paso = pasoNice(vmax0 - Math.min(0, vmin0));
  const vmin = Math.floor(Math.min(0, vmin0) / paso) * paso, vmax = Math.ceil(vmax0 * 1.06 / paso) * paso;
  const x = i => M.l + (W - M.l - M.r) * (i / Math.max(1, n - 1));
  const y = v => M.t + (H - M.t - M.b) * (1 - (v - vmin) / (vmax - vmin));
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" tabindex="0" aria-label="Saldo ${nh ? "real desde el " + corta(hist[0].fecha) + " y " : ""}previsto hasta el ${corta(p.fin)}. Mínimo previsto ${eur(p.min.saldo)} el ${corta(p.min.fecha)}.">`;
  // Zona por debajo del colchón
  s += `<rect x="${M.l}" y="${y(colchon)}" width="${W - M.l - M.r}" height="${Math.max(0, y(Math.max(vmin, 0)) - y(colchon))}" fill="var(--aviso-suave)" opacity=".55"/>`;
  if (vmin < 0) s += `<rect x="${M.l}" y="${y(0)}" width="${W - M.l - M.r}" height="${y(vmin) - y(0)}" fill="var(--critico-suave)"/>`;
  for (let v = vmin; v <= vmax; v += paso){
    s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "var(--tinta-2)" : "var(--raya-2)"}" stroke-width="1"/>`;
    s += `<text x="${M.l - 8}" y="${y(v) + 4}" text-anchor="end" class="num">${eur0(v)}</text>`;
  }
  const marcaQuincena = n <= 130 && !estrecho;
  dias.forEach((d, i) => { const dd = d.fecha.getDate();
    if (dd === 1 || (dd === 15 && marcaQuincena)){ s += `<text x="${x(i)}" y="${H - M.b + 18}" text-anchor="middle">${dd} ${MESES[d.fecha.getMonth()]}</text><line x1="${x(i)}" x2="${x(i)}" y1="${H - M.b}" y2="${H - M.b + 4}" stroke="var(--raya)"/>`; } });
  const yc = y(colchon);
  s += `<line x1="${M.l}" x2="${W - M.r}" y1="${yc}" y2="${yc}" stroke="var(--aviso)" stroke-width="1.5" stroke-dasharray="2 3"/>`;
  s += estrecho ? `<text x="${M.l + 4}" y="${yc - 5}" font-size="11">Colchón base ${eur0(colchon)}</text>`
                : `<text x="${W - M.r + 6}" y="${yc - 2}" font-size="11">Colchón base</text><text x="${W - M.r + 6}" y="${yc + 12}" font-size="11" class="num">${eur0(colchon)}</text>`;
  const escalon = (desde, hasta, val) => { let d = `M ${x(desde)} ${y(val(desde))}`; for (let i = desde + 1; i <= hasta; i++) d += ` H ${x(i)} V ${y(val(i))}`; return d; };
  // Real
  if (nh){
    const dr = escalon(0, nh, i => dias[i].saldo);
    s += `<path d="${dr}" fill="none" stroke="var(--serie)" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<line x1="${x(nh)}" x2="${x(nh)}" y1="${M.t - 6}" y2="${H - M.b}" stroke="var(--tinta-3)" stroke-dasharray="3 3"/>`;
    s += `<text x="${x(nh) + 5}" y="${M.t - 10}" font-size="11" style="font-weight:700">Hoy · ${corta(BASE)}</text>`;
  }
  // Comparación (sin la compra)
  if (opc.comparar){
    const pd = opc.comparar.porDia;
    let dc = `M ${x(nh)} ${y(pd[0].saldo)}`; for (let i = 1; i < pd.length && nh + i < n; i++) dc += ` H ${x(nh + i)} V ${y(pd[i].saldo)}`;
    s += `<path d="${dc}" fill="none" stroke="var(--tinta-3)" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/>`;
  }
  // Previsto
  const dp = escalon(nh, n - 1, i => dias[i].saldo);
  s += `<path d="${dp} V ${y(Math.max(vmin, 0))} H ${x(nh)} Z" fill="var(--serie-wash)"/>`;
  s += `<path d="${dp}" fill="none" stroke="var(--serie)" stroke-width="2" stroke-dasharray="6 4" stroke-linejoin="round"/>`;
  // Cargos sin importe e hipótesis
  dias.forEach((q, i) => { if (!q.real && q.ev.some(e => e.certeza === "sin_importe")){
    s += `<circle cx="${x(i)}" cy="${y(q.saldo)}" r="8" fill="var(--hoja)" stroke="var(--critico)" stroke-width="2"/><text x="${x(i)}" y="${y(q.saldo) + 4}" text-anchor="middle" style="fill:var(--critico);font-weight:800" font-size="11">?</text>`; }
    if (!q.real && q.ev.some(e => e.certeza === "hipotesis"))
      s += `<rect x="${x(i) - 6}" y="${y(q.saldo) - 6}" width="12" height="12" rx="3" fill="#6250d6" stroke="var(--hoja)" stroke-width="2"/>`; });
  const iMin = nh + p.porDia.findIndex(q => iso(q.fecha) === iso(p.min.fecha));
  if (iMin >= nh && p.min.saldo < ULT.saldo){
    const px = x(iMin), py = y(p.min.saldo), izq = px > W * (estrecho ? 0.45 : 0.7), arriba = py > H - M.b - 34;
    s += `<circle cx="${px}" cy="${py}" r="6" fill="var(--critico)" stroke="var(--hoja)" stroke-width="2"/>`;
    s += `<text x="${px + (izq ? -10 : 10)}" y="${arriba ? py - 12 : py + 20}" paint-order="stroke" stroke="var(--hoja)" stroke-width="4" text-anchor="${izq ? "end" : "start"}" style="fill:var(--tinta);font-weight:700" class="num">${estrecho ? "" : "Día más justo "}${corta(p.min.fecha)}: ${estrecho ? eur0(p.min.saldo) : eur(p.min.saldo)}</text>`;
  }
  s += `<circle cx="${x(n - 1)}" cy="${y(p.final)}" r="4" fill="var(--serie)" stroke="var(--hoja)" stroke-width="2"/>`;
  const antes = dias[Math.max(0, n - 8)].saldo, abajo = antes > p.final;
  s += estrecho ? `<text x="${x(n - 1)}" y="${y(p.final) + (abajo ? 18 : -10)}" text-anchor="end" style="fill:var(--tinta);font-weight:600" class="num">${eur(p.final)}</text>`
                : `<text x="${x(n - 1) + 8}" y="${y(p.final) + (Math.abs(y(p.final) - yc) < 26 ? (y(p.final) > yc ? 30 : -22) : 4)}" style="fill:var(--tinta);font-weight:600" class="num">${eur(p.final)}</text>`;
  s += `<line class="cur" x1="0" x2="0" y1="${M.t}" y2="${H - M.b}" stroke="var(--tinta-2)" visibility="hidden"/><rect class="zona" x="${M.l}" y="${M.t}" width="${W - M.l - M.r}" height="${H - M.t - M.b}" fill="transparent"/></svg>`;
  hueco.innerHTML = s;
  const svg = hueco.querySelector("svg"), cur = svg.querySelector(".cur"), fig = hueco.closest("figure") || hueco.parentElement, tt = tooltipEn(fig);
  let act = Math.max(0, iMin);
  const ver = i => {
    act = Math.max(0, Math.min(n - 1, i)); const q = dias[act], cx = x(act);
    const fr = fig.getBoundingClientRect(), sr = svg.getBoundingClientRect(), k = sr.width / W;
    cur.setAttribute("x1", cx); cur.setAttribute("x2", cx); cur.setAttribute("visibility", "visible");
    let h = `<b>${esc(cap(larga(q.fecha)))}</b><div class="fila"><span>${q.real ? "Saldo real" : "Saldo previsto"}</span><b class="num">${eur(q.saldo)}</b></div>`;
    if (q.real){
      const ent = r2(q.mov.filter(m => m.importe > 0).reduce((a, m) => a + m.importe, 0)), sal = r2(q.mov.filter(m => m.importe < 0).reduce((a, m) => a + m.importe, 0));
      if (q.mov.length) h += `<div class="fila"><span>${plural(q.mov.length, "movimiento", "movimientos")}</span><span class="num">${ent ? eur(ent, true) + " " : ""}${sal ? eur(sal) : ""}</span></div>`;
    } else for (const e of q.ev) h += `<div class="fila"><span>${esc(e.concepto)}</span><span class="num">${e.importe == null ? (e.certeza === "aviso" ? "aviso" : "¿?") : eur(e.importe, true)}</span></div>`;
    tt.mostrar(h, sr.left - fr.left + cx * k, sr.top - fr.top + y(q.saldo) * k);
  };
  const oc = () => { tt.ocultar(); cur.setAttribute("visibility", "hidden"); };
  svg.querySelector(".zona").addEventListener("pointermove", ev => { const r = svg.getBoundingClientRect(); ver(Math.round(((ev.clientX - r.left) * W / r.width - M.l) / (W - M.l - M.r) * (n - 1))); });
  svg.querySelector(".zona").addEventListener("pointerleave", oc);
  svg.addEventListener("focus", () => ver(act)); svg.addEventListener("blur", oc);
  svg.addEventListener("keydown", e => { if (e.key === "ArrowRight"){ e.preventDefault(); ver(act + 1); } if (e.key === "ArrowLeft"){ e.preventDefault(); ver(act - 1); } if (e.key === "Escape") oc(); });
}
const leyendaSaldo = (hist, comparar) => `<div class="leyenda">${hist ? `<span><i class="linea" style="background:var(--serie)"></i>Saldo real</span>` : ""}<span><i class="discontinua"></i>Saldo previsto</span>${comparar ? `<span><i class="discontinua" style="border-top-style:dotted;border-top-color:var(--tinta-3)"></i>Sin la compra</span><span><i style="background:#6250d6"></i>La compra (Hipótesis)</span>` : ""}<span><i style="background:var(--aviso-suave);border:1px dashed var(--aviso)"></i>Por debajo del colchón</span><span><b class="mal">?</b> cargo sin importe</span></div>`;

// Mini gráfico de saldo real para la tarjeta del héroe (sin ejes)
function sparkSaldo(hist){
  if (hist.length < 2) return "";
  const W = 300, H = 56, v = hist.map(h => h.saldo).concat([ULT.saldo]), mn = Math.min(...v), mx = Math.max(...v);
  const x = i => i / (v.length - 1) * W, y = a => 4 + (H - 8) * (1 - (a - mn) / ((mx - mn) || 1));
  let d = `M 0 ${y(v[0])}`; for (let i = 1; i < v.length; i++) d += ` H ${x(i)} V ${y(v[i])}`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d} V ${H} H 0 Z" fill="rgba(255,255,255,.12)"/><path d="${d}" fill="none" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

// Columnas agrupadas: ingresos y gastos corrientes por mes
function graficoMeses(hueco, meses){
  const W = Math.max(320, hueco.clientWidth || 700), H = 250, M = {t: 26, r: 10, b: 40, l: 62};
  const max = Math.max(1, ...meses.flatMap(m => [m.ingresos, m.gastos])), paso = pasoNice(max), vmax = Math.ceil(max * 1.1 / paso) * paso;
  const y = v => M.t + (H - M.t - M.b) * (1 - v / vmax), banda = (W - M.l - M.r) / meses.length, bw = Math.min(28, banda / 4);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Ingresos y gastos corrientes por mes">`;
  for (let v = 0; v <= vmax; v += paso) s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--raya-2)"/><text x="${M.l - 8}" y="${y(v) + 4}" text-anchor="end" class="num">${eur0(v)}</text>`;
  meses.forEach((m, i) => {
    const cx = M.l + banda * i + banda / 2;
    [["ingresos", "var(--ingreso)", -bw - 1], ["gastos", "var(--gasto)", 1]].forEach(([k, col, dx]) => {
      const v = m[k], top = y(v), h = y(0) - top, x0 = cx + dx, r = Math.min(4, h);
      s += `<path d="M ${x0} ${y(0)} V ${top + r} Q ${x0} ${top} ${x0 + r} ${top} H ${x0 + bw - r} Q ${x0 + bw} ${top} ${x0 + bw} ${top + r} V ${y(0)} Z" fill="${col}" data-tip="${esc(cap(nombreMes(m.k)))}${m.completo ? "" : " (hasta el " + corta(m.hasta) + ")"}|${k === "ingresos" ? "Ingresos" : "Gastos"}|${eur(v)}"/>`;
      s += `<text x="${x0 + bw / 2}" y="${top - 6}" text-anchor="middle" style="fill:var(--tinta);font-weight:600" font-size="11" class="num">${eur0(v)}</text>`;
    });
    s += `<text x="${cx}" y="${H - M.b + 18}" text-anchor="middle">${cap(MESES_L[+m.k.slice(5) - 1])}${m.completo ? "" : "*"}</text>`;
  });
  hueco.innerHTML = s + `</svg>`;
  conTooltip(hueco);
}
function conTooltip(hueco){
  const svg = hueco.querySelector("svg"), fig = hueco.parentElement, tt = tooltipEn(fig);
  svg.addEventListener("pointermove", ev => {
    const t = ev.target.closest("[data-tip]"); if (!t){ tt.ocultar(); return; }
    const [a, b, c] = t.dataset.tip.split("|"), r = fig.getBoundingClientRect();
    tt.mostrar(`<b>${a}</b><div class="fila"><span>${b}</span><b class="num">${c}</b></div>`, ev.clientX - r.left, ev.clientY - r.top);
  });
  svg.addEventListener("pointerleave", () => tt.ocultar());
}
// Barras horizontales ordenadas (una sola serie)
function graficoBarras(hueco, items, total, etiqueta){
  const W = Math.max(320, hueco.clientWidth || 600), estrecho = W < 520, fila = 30, M = {t: 6, r: estrecho ? 76 : 96, b: 6, l: estrecho ? 130 : 190};
  const H = M.t + M.b + fila * items.length, max = Math.max(1, ...items.map(i => i.v));
  const x = v => M.l + (W - M.l - M.r) * v / max, lim = estrecho ? 18 : 28;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(etiqueta || "Barras")}">`;
  items.forEach((it, i) => {
    const yy = M.t + fila * i, bh = 16, w = Math.max(2, x(it.v) - M.l), r = Math.min(4, w);
    s += `<text x="${M.l - 10}" y="${yy + 17}" text-anchor="end">${esc(it.n.length > lim ? it.n.slice(0, lim - 1) + "…" : it.n)}</text>`;
    s += `<path d="M ${M.l} ${yy + 5} H ${M.l + w - r} Q ${M.l + w} ${yy + 5} ${M.l + w} ${yy + 5 + r} V ${yy + 5 + bh - r} Q ${M.l + w} ${yy + 5 + bh} ${M.l + w - r} ${yy + 5 + bh} H ${M.l} Z" fill="${it.color || "var(--serie)"}" data-tip="${esc(it.n)}|${total ? pct(it.v / total * 100) + " del total" : ""}|${eur(it.v)}"/>`;
    s += `<text x="${M.l + w + 8}" y="${yy + 17}" style="fill:var(--tinta);font-weight:600" class="num">${eur0(it.v)}</text>`;
  });
  hueco.innerHTML = s + `</svg>`;
  conTooltip(hueco);
}

// Saldo real día a día (Pasado): línea en escalón con máximo y mínimo marcados
function graficoHistoria(hueco, dias){
  const W = Math.max(320, hueco.clientWidth || 900), estrecho = W < 560, H = estrecho ? 220 : 270;
  const M = {t: 22, r: estrecho ? 12 : 24, b: 30, l: estrecho ? 54 : 66}, n = dias.length;
  if (n < 2){ hueco.innerHTML = `<p class="sub">Aún no hay días suficientes.</p>`; return; }
  const vals = dias.map(d => d.saldo), vmin0 = Math.min(0, ...vals), vmax0 = Math.max(...vals), paso = pasoNice(vmax0 - vmin0);
  const vmin = Math.floor(vmin0 / paso) * paso, vmax = Math.ceil(vmax0 * 1.06 / paso) * paso;
  const x = i => M.l + (W - M.l - M.r) * (i / (n - 1)), y = v => M.t + (H - M.t - M.b) * (1 - (v - vmin) / (vmax - vmin));
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" tabindex="0" aria-label="Saldo real del ${corta(dias[0].fecha)} al ${corta(dias[n - 1].fecha)}">`;
  for (let v = vmin; v <= vmax; v += paso) s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "var(--tinta-2)" : "var(--raya-2)"}"/><text x="${M.l - 8}" y="${y(v) + 4}" text-anchor="end" class="num">${eur0(v)}</text>`;
  dias.forEach((d, i) => { const dd = d.fecha.getDate(); if (dd === 1 || (dd === 15 && !estrecho)) s += `<text x="${x(i)}" y="${H - M.b + 18}" text-anchor="middle">${dd} ${MESES[d.fecha.getMonth()]}</text>`; });
  let path = `M ${x(0)} ${y(vals[0])}`; for (let i = 1; i < n; i++) path += ` H ${x(i)} V ${y(vals[i])}`;
  s += `<path d="${path} V ${y(Math.max(vmin, 0))} H ${x(0)} Z" fill="var(--serie-wash)"/><path d="${path}" fill="none" stroke="var(--serie)" stroke-width="2.2" stroke-linejoin="round"/>`;
  const iMx = vals.indexOf(Math.max(...vals)), iMn = vals.lastIndexOf(Math.min(...vals));
  for (const [i, t] of [[iMx, "Máx."], [iMn, "Mín."]]){
    const px = x(i), py = y(vals[i]), izq = px > W * .7, abajo = t === "Mín." && py < H - M.b - 30;
    s += `<circle cx="${px}" cy="${py}" r="4.5" fill="var(--serie)" stroke="var(--hoja)" stroke-width="2"/><text x="${px + (izq ? -8 : 8)}" y="${abajo ? py + 18 : py - 9}" text-anchor="${izq ? "end" : "start"}" paint-order="stroke" stroke="var(--hoja)" stroke-width="4" style="fill:var(--tinta);font-weight:700" class="num">${t} ${eur0(vals[i])} · ${corta(dias[i].fecha)}</text>`;
  }
  s += `<line class="cur" x1="0" x2="0" y1="${M.t}" y2="${H - M.b}" stroke="var(--tinta-2)" visibility="hidden"/><rect class="zona" x="${M.l}" y="${M.t}" width="${W - M.l - M.r}" height="${H - M.t - M.b}" fill="transparent"/></svg>`;
  hueco.innerHTML = s;
  const svg = hueco.querySelector("svg"), cur = svg.querySelector(".cur"), fig = hueco.closest("figure"), tt = tooltipEn(fig);
  svg.querySelector(".zona").addEventListener("pointermove", ev => {
    const r = svg.getBoundingClientRect(), k = r.width / W, i = Math.max(0, Math.min(n - 1, Math.round(((ev.clientX - r.left) / k - M.l) / (W - M.l - M.r) * (n - 1)))), q = dias[i];
    cur.setAttribute("x1", x(i)); cur.setAttribute("x2", x(i)); cur.setAttribute("visibility", "visible");
    const fr = fig.getBoundingClientRect();
    tt.mostrar(`<b>${esc(cap(larga(q.fecha)))}</b><div class="fila"><span>Saldo</span><b class="num">${eur(q.saldo)}</b></div>${q.mov.length ? `<div class="fila"><span>${plural(q.mov.length, "movimiento", "movimientos")}</span><span class="num">${eur(r2(q.mov.reduce((a, m) => a + m.importe, 0)), true)}</span></div>` : ""}`, r.left - fr.left + x(i) * k, r.top - fr.top + y(q.saldo) * k);
  });
  svg.querySelector(".zona").addEventListener("pointerleave", () => { tt.ocultar(); cur.setAttribute("visibility", "hidden"); });
}

/* =========================================================
   PIEZAS
   ========================================================= */
const ESTADO = {verTodos: false, horizonte: 60, futuro: "lista", mesCal: ym(HOY > BASE ? HOY : BASE), diaSel: null, mesPasado: null, filtro: {cat: "", q: "", tipo: ""},
  compra: {que: "", importe: "", fecha: iso(sumar(HOY > BASE ? HOY : BASE, 1)), forma: "cuenta", tipo: "consumo", cuota: "", plazo: "", entrada: "", reventa: "", ingreso: ""}, evaluada: false};
try { const g = JSON.parse(localStorage.getItem("estado-finanzas") || "{}"); if ([30, 60, 90, 180].includes(g.horizonte)) ESTADO.horizonte = g.horizonte; if (["lista", "calendario"].includes(g.futuro)) ESTADO.futuro = g.futuro; } catch(e) {}
const guardar = () => { try { localStorage.setItem("estado-finanzas", JSON.stringify({horizonte: ESTADO.horizonte, futuro: ESTADO.futuro})); } catch(e) {} };

function veredicto(p){
  const colchon = COLCHON_BASE(), m = p.min;
  if (m.saldo < 0) return {clase: "malo", t: "No llegas", h: `El ${corta(m.fecha)} te quedas en negativo`};
  if (m.saldo < colchon) return {clase: "justo", t: "Llegas, sin colchón", h: `El ${corta(m.fecha)} bajas de tu colchón`};
  return {clase: "bueno", t: "Llegas con colchón", h: `El saldo no baja del colchón hasta el ${corta(p.fin)}`};
}
const selectorHorizonte = () => `<span class="segmentos" role="group" aria-label="Horizonte">${[30, 60, 90, 180].map(d => `<button type="button" data-horizonte="${d}" aria-pressed="${ESTADO.horizonte === d}">${d} d</button>`).join("")}</span>`;
const seg = (k, obj, sel) => `<span class="segmentos" role="group">${Object.entries(obj).map(([v, n]) => `<button type="button" data-${k}="${v}" aria-pressed="${sel === v}">${Array.isArray(n) ? n[0] : n}</button>`).join("")}</span>`;
function barrasHtml(items, max){
  return `<div class="barras">${items.map(it => `<div><div class="bt"><span>${esc(it.n)}</span><b class="num">${eur0(it.v)}</b></div><div class="medidor fino"><i style="width:${Math.max(1.5, it.v / max * 100)}%;background:${it.color || "var(--serie)"}"></i></div></div>`).join("")}</div>`;
}
function anillo(frac, color, texto){
  const r = 22, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  return `<svg class="anillo" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="${r}" fill="none" stroke="var(--raya-2)" stroke-width="7"/><circle cx="28" cy="28" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 28 28)"/><text x="28" y="32" text-anchor="middle" font-size="12" font-weight="800" style="fill:var(--tinta)">${texto ?? Math.round(f * 100) + "%"}</text></svg>`;
}
// Fila de un movimiento previsto
function filaMov(e, conSaldo){
  const tipo = e.certeza === "sin_importe" ? "sin" : e.certeza === "aviso" ? "ven" : e.certeza === "hipotesis" ? "hip" : e.importe > 0 ? "ing" : "gas";
  const ic = {sin: "?", ven: "!", hip: "◆", ing: "↑", gas: "↓"}[tipo];
  const sub = e.certeza === "sin_importe" ? (e.origen === "tarjeta" ? "Sin restar hasta ver la liquidación" : "Sin importe · no se resta")
    : e.certeza === "aviso" ? (e.origen === "revision" ? "Recordatorio" : "Aviso") : ETQ[e.certeza];
  return `<li class="mov ${tipo}"><span class="fd"><b>${e.fecha.getDate()}</b>${MESES[e.fecha.getMonth()]}</span><span class="mi" aria-hidden="true">${ic}</span>
    <span class="mc"><span class="mn">${esc(e.concepto)}</span><span class="ms">${esc(sub)}</span></span>
    <span class="mv"><b class="num ${e.importe > 0 ? "positivo" : tipo === "sin" ? "mal" : ""}">${e.importe == null ? (tipo === "sin" ? "¿?" : "") : eur(e.importe, true)}</b>${conSaldo && e.importe != null ? `<span class="num">${eur0(e.saldo)}</span>` : ""}</span></li>`;
}
const listaAlertas = l => `<ul class="alertas">${l.map(a => `<li class="${a.nivel}"><span class="ico" aria-hidden="true">${a.nivel === "info" ? "i" : "!"}</span><span>${esc(a.texto)}</span></li>`).join("")}</ul>`;

// Alertas, de más a menos grave. Las tarjetas salen siempre en rojo pero no se restan.
function avisos(p){
  const l = [], colchon = COLCHON_BASE();
  if (p.min.saldo < 0) l.push({nivel: "grave", texto: `Negativo el ${corta(p.min.fecha)}: ${eur(p.min.saldo)}`});
  else if (p.min.saldo < colchon) l.push({nivel: "grave", texto: `Sin colchón el ${corta(p.min.fecha)}: faltan ${eur(r2(colchon - p.min.saldo))}`});
  const tj = p.sin.find(e => e.origen === "tarjeta");
  if (tj) l.push({nivel: "grave", texto: `Tarjetas del ${corta(tj.fecha)}: sin restar hasta ver la liquidación${tj.tope >= 0 ? ` (margen ${eur0(tj.tope)})` : ""}`});
  for (const x of C.pendientes) if (x.importe != null && x.fecha && leer(x.fecha) <= BASE) l.push({nivel: "info", texto: `${x.nombre.replace(/^Honorarios compra: /, "Honorarios: ")} aún sin cobrar · ${eur(x.importe)} reservados`});
  for (const e of p.ev.filter(e => e.origen === "revision")) l.push({nivel: "aviso", texto: `${e.concepto} desde el ${corta(e.fecha)}`});
  const cerrado = resumenMeses().filter(m => m.completo).pop();
  if (cerrado && cerrado.ahorro < 0) l.push({nivel: "aviso", texto: `${cap(MESES_L[+cerrado.k.slice(5) - 1])} cerró en ${eur(cerrado.ahorro)}`});
  const v = entre(BASE, HOY); if (v > 7) l.push({nivel: "aviso", texto: `Datos de hace ${v} días: pásale un extracto al agente`});
  for (const n of C.notas || []) l.push({nivel: n.nivel === "aviso" ? "aviso" : "info", texto: n.texto});
  return l;
}
const proxNomina = p => p.ev.find(e => e.id === "nomina");
const reservado = () => r2(C.pendientes.filter(x => x.importe != null && x.clase !== "cobro").reduce((a, x) => a + x.importe, 0));

/* =========================================================
   PESTAÑAS
   ========================================================= */
// INICIO: la foto de hoy. Posición global, bienes, deudas y lo relevante. Lo que viene está en Futuro; lo que pasó, en Pasado.
function vistaInicio(el){
  const P = patrimonio(), p = prevision(ESTADO.horizonte), v = veredicto(p), colchon = COLCHON_BASE(), fm = fijosMensuales();
  const nom = proxNomina(p), hastaNom = nom ? prevision(entre(BASE, nom.fecha)) : null, mn = hastaNom ? hastaNom.min : p.min;
  const meses = resumenMeses(), mes = meses[meses.length - 1], cerr = meses.filter(m => m.completo).pop();
  const colMeses = Math.max(0, p.min.saldo) / C.reglas.gastos_fijos_mensuales_colchon, objetivo = C.reglas.colchon_meses_estable || 3;
  const end = fm.ing ? fm.deuda / fm.ing * 100 : null, lim = C.reglas.tasa_esfuerzo_max_pct;
  const hip = P.deudas.find(d => d.id === "hipoteca"), filaH = hip && hip.cuadro ? filaCuadro(hip, BASE) : null;
  const avs = avisos(p);
  // Composición: lo que tienes frente a lo que debes
  const tienes = [{n: "Liquidez", v: P.liq.total, c: "#7fd8b5"}, ...P.inm.map(b => ({n: b.id === "piso" ? "Piso" : b.nombre, v: b.valor, c: "#e9c98a"}))];
  const debes = [...P.deudas.map(d => ({n: d.id === "hipoteca" ? "Hipoteca" : d.nombre.replace("Devolución a mi ", ""), v: d.viva, c: d.id === "hipoteca" ? "#ff9f8f" : "#ffc8bd"})), ...(P.liq.comprometido ? [{n: "Honorarios", v: P.liq.comprometido, c: "#f7d6cf"}] : [])];
  const tope = Math.max(P.activos, P.pasivos);
  const barra = l => `<div class="barra">${l.map(x => `<i style="width:${x.v / tope * 100}%;background:${x.c}" title="${esc(x.n)} ${eur0(x.v)}"></i>`).join("")}</div>`;
  el.innerHTML = `
    <div class="heroe ${P.neto < 0 ? "justo" : "bueno"}"><div class="fila-h">
      <div><span class="estado"><i></i>Posición global</span>
        <div class="n">Patrimonio neto</div><div class="grande num">${eur(P.neto)}</div>
        <div class="pills"><span class="pill">Tienes <b class="num">${eur0(P.activos)}</b></span><span class="pill">Debes <b class="num">${eur0(P.pasivos)}</b></span>${filaH ? `<span class="pill">Hipoteca amortizada <b class="num">${pct((hip.inicial - filaH.pendiente) / hip.inicial * 100)}</b></span>` : ""}</div></div>
      <div class="compos">
        <div class="fila"><span>Tienes</span>${barra(tienes)}<b class="num">${eur0(P.activos)}</b></div>
        <div class="fila"><span>Debes</span>${barra(debes)}<b class="num">${eur0(P.pasivos)}</b></div>
        <div class="ley">${tienes.concat(debes).map(x => `<span style="--c:${x.c}">${esc(x.n)}</span>`).join("")}</div>
      </div>
    </div></div>
    <div class="cifras">
      <button class="tile ${mn.saldo < 0 ? "alerta" : "ok"}" type="button" data-ir="futuro"><div class="n"><span class="ic">${icono("futuro")}</span>${nom ? "Hasta la nómina del " + corta(nom.fecha) : "Próximos " + ESTADO.horizonte + " días"}</div>
        <div class="v num ${mn.saldo < 0 ? "mal" : ""}">${mn.saldo < 0 ? "No llegas" : "Llegas"}</div><div class="d">Mínimo ${eur0(mn.saldo)} el ${corta(mn.fecha)}</div></button>
      <button class="tile" type="button" data-ir="pasado"><div class="n"><span class="ic">${icono("pasado")}</span>${cap(MESES_L[+mes.k.slice(5) - 1])}${mes.completo ? "" : " hasta el " + mes.hasta.getDate()}</div>
        <div class="v num ${mes.ahorro < 0 ? "mal" : "bien"}">${eur(mes.ahorro, true)}</div><div class="d">Ingresos ${eur0(mes.ingresos)} · gastos ${eur0(mes.gastos)}</div></button>
      <div class="tile ${colMeses < objetivo ? "alerta" : "ok"} con-anillo">${anillo(colMeses / objetivo, colMeses >= objetivo ? "var(--bien)" : colMeses >= objetivo / 2 ? "var(--aviso)" : "var(--critico)", colMeses.toFixed(1).replace(".", ","))}
        <div><div class="n">Colchón en meses</div><div class="v num">${colMeses.toFixed(1).replace(".", ",")} <span class="tenue" style="font-size:14px">de ${objetivo}</span></div><div class="d">Objetivo ${eur0(colchon)}</div></div></div>
      <button class="tile ${end > lim ? "alerta" : ""}" type="button" data-ir="financiacion"><div class="n"><span class="ic">${icono("financiacion")}</span>Endeudamiento</div>
        <div class="v num ${end > lim ? "mal" : end > lim * .85 ? "ojo" : ""}">${pct(end)}</div><div class="d">Cuotas ÷ ingresos fijos · límite ${lim} %</div></button>
    </div>
    <div class="mitades">
      <div class="bloque"><h3>Lo que tienes <span class="total num">${eur(P.activos)}</span></h3><ul class="movs">
        ${P.liq.partes.map(x => `<li class="mov ing"><span class="mi">${icono(x.ic)}</span><span class="mc"><span class="mn">${esc(x.n)}</span><span class="ms">${esc(x.d)}</span></span><span class="mv"><b class="num">${x.v == null ? "¿?" : eur(x.v)}</b><span>Líquido</span></span></li>`).join("")}
        ${P.inm.map(b => `<li class="mov oro"><span class="mi">${icono("financiacion")}</span><span class="mc"><span class="mn">${esc(b.nombre)}</span><span class="ms">${esc(b.nota || "")}</span></span><span class="mv"><b class="num">${eur(b.valor)}</b><span>No líquido</span></span></li>`).join("")}
      </ul></div>
      <div class="bloque"><h3>Lo que debes <span class="total num">${eur(-P.pasivos)}</span></h3><ul class="movs">
        ${P.deudas.map(d => { const f = d.cuadro ? filaCuadro(d, BASE) : null, sig = d.cuadro ? d.cuadro.find(x => leer(x.fecha) > BASE) : null;
          return `<li class="mov sin"><span class="mi">${icono(d.id === "hipoteca" ? "financiacion" : "escudo")}</span><span class="mc"><span class="mn">${esc(d.nombre)}</span><span class="ms">${sig ? `Próxima cuota ${eur(sig.cuota)} el ${corta(leer(sig.fecha))} · ${eur0(sig.intereses)} de intereses` : esc(d.nota || "")}</span></span><span class="mv"><b class="num">${eur(-d.viva)}</b><span>${f ? "a " + corta(leer(f.fecha)) : "Sin cuota"}</span></span></li>`; }).join("")}
        ${C.pendientes.filter(x => x.importe != null && x.clase !== "cobro").map(x => `<li class="mov ven"><span class="mi">!</span><span class="mc"><span class="mn">${esc(x.nombre)}</span><span class="ms">${leer(x.fecha) <= BASE ? "Vencido, sin cobrar · reservado" : "Vence el " + corta(leer(x.fecha))}</span></span><span class="mv"><b class="num">${eur(-x.importe)}</b><span>Comprometido</span></span></li>`).join("")}
      </ul></div>
    </div>
    <div class="dos">
      <div class="bloque"><h3>Alertas <span class="chip ${avs.some(a => a.nivel === "grave") ? "rojo" : ""}">${avs.length}</span></h3>${avs.length ? listaAlertas(avs.slice(0, 4)) + (avs.length > 4 ? `<details class="mas"><summary>Ver ${avs.length - 4} más</summary>${listaAlertas(avs.slice(4))}</details>` : "") : `<p class="sub">Nada que vigilar.</p>`}</div>
      <div class="bloque"><h3>Resultado por mes <button class="enlace" type="button" data-ir="pasado">Pasado →</button></h3>
        <ul class="lista">${meses.slice().reverse().map(x => `<li><span class="nom">${cap(nombreMes(x.k))}${x.completo ? "" : ` <span class="tenue" style="font-weight:600">· hasta el ${corta(x.hasta)}</span>`}</span><span class="val num ${x.ahorro < 0 ? "mal" : "bien"}">${eur(x.ahorro, true)}</span><span class="det">Ingresos ${eur(x.ingresos)} · gastos ${eur(x.gastos)} · ahorro ${tasa(x)}</span></li>`).join("")}</ul></div>
    </div>`;
}

// PASADO: lo que ya pasó. Saldo real, resultado del mes, en qué se gasta y todos los movimientos.
function vistaPasado(el){
  const meses = resumenMeses();
  if (!ESTADO.mesPasado) ESTADO.mesPasado = meses[meses.length - 1].k;
  const todo = ESTADO.mesPasado === "todo", m = todo ? null : (meses.find(x => x.k === ESTADO.mesPasado) || meses[meses.length - 1]);
  const ing = todo ? r2(meses.reduce((a, x) => a + x.ingresos, 0)) : m.ingresos, gas = todo ? r2(meses.reduce((a, x) => a + x.gastos, 0)) : m.gastos, res = r2(ing - gas);
  const porCat = {}; for (const x of todo ? meses : [m]) for (const [c, v] of Object.entries(x.porCat)) porCat[c] = r2((porCat[c] || 0) + v);
  const cats = Object.entries(porCat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const diaAdia = new Set((C.variables.find(v => v.id === "dia-a-dia") || {}).categorias || []);
  const totalDia = r2(cats.filter(([c]) => diaAdia.has(c)).reduce((a, [, v]) => a + v, 0));
  const nDias = todo ? entre(MOVS[0].f, BASE) + 1 : (m.completo ? m.finMes.getDate() : m.hasta.getDate());
  const delPeriodo = MOVS.filter(x => todo || x.fecha.startsWith(m.k));
  const comercios = {};
  for (const x of delPeriodo.filter(x => x.tipo === "gasto" && x.importe < 0)){ const k = x.concepto.replace(/\d{3,}/g, "").replace(/\s+/g, " ").trim(); comercios[k] = r2((comercios[k] || 0) - x.importe); }
  const top = Object.entries(comercios).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const F = ESTADO.filtro;
  const lista = delPeriodo.filter(x => (!F.cat || x.cat === F.cat) && (!F.tipo || x.tipo === F.tipo) && (!F.q || x.concepto.toLowerCase().includes(F.q.toLowerCase()))).slice().reverse();
  // Saldo real por día (desde el primer movimiento)
  const hist = historiaSaldo(entre(MOVS[0].f, BASE) + 1); hist.push({fecha: BASE, saldo: ULT.saldo, mov: MOVS.filter(x => x.fecha === iso(BASE))});
  const histVer = todo ? hist : hist.filter(d => ym(d.fecha) === m.k);
  let filas = "", diaAnt = "";
  const filtrando = F.cat || F.tipo || F.q, corte = ESTADO.verTodos || filtrando ? lista.length : 15;
  for (const x of lista.slice(0, corte)){
    if (x.fecha !== diaAnt){ filas += `<li class="dia-sep"><span>${esc(larga(x.f))}</span><span class="num">Saldo ${eur(x.saldo)}</span></li>`; diaAnt = x.fecha; }
    const t = x.tipo === "ingreso" ? "ing" : x.tipo === "gasto" ? "gas" : "ven";
    filas += `<li class="mov ${t}"><span class="mi" aria-hidden="true">${t === "ing" ? "↑" : t === "gas" ? "↓" : "↔"}</span><span class="mc"><span class="mn">${esc(x.concepto)}</span><span class="ms">${esc(CAT[x.cat].nombre)}</span></span><span class="mv"><b class="num ${x.importe > 0 ? "positivo" : ""}">${eur(x.importe, true)}</b></span></li>`;
  }
  el.innerHTML = `
    <div class="controles">${seg("mespas", Object.fromEntries([...meses.map(x => [x.k, cap(MESES_L[+x.k.slice(5) - 1]) + (x.completo ? "" : "*")]), ["todo", "Todo"]]), ESTADO.mesPasado)}
      <span class="tenue" style="font-size:13px">${todo ? "Del " + corta(MOVS[0].f) + " al " + corta(BASE) : m.completo ? "Mes completo" : "* Hasta el " + corta(m.hasta)}</span></div>
    <div class="cifras">
      <div class="tile"><div class="n"><span class="ic">${icono("bajada")}</span>Ingresos</div><div class="v num positivo">${eur(ing, true)}</div><div class="d">Nómina, alquileres y otros</div></div>
      <div class="tile"><div class="n"><span class="ic">${icono("gastos")}</span>Gastos</div><div class="v num">${eur(-gas)}</div><div class="d">Sin compra del piso ni traspasos</div></div>
      <div class="tile ${res < 0 ? "alerta" : "ok"}"><div class="n"><span class="ic">${icono("cuenta")}</span>Resultado</div><div class="v num ${res < 0 ? "mal" : "bien"}">${eur(res, true)}</div><div class="d">Ahorro ${ing ? pct(res / ing * 100) : "—"}</div></div>
      <div class="tile"><div class="n"><span class="ic">${icono("tarjeta")}</span>Día a día</div><div class="v num">${eur0(totalDia)}</div><div class="d">${eur(r2(totalDia / nDias))} de media al día</div></div>
    </div>
    <figure class="grafico"><div class="tit">Saldo real en la cuenta</div><div class="hueco"></div></figure>
    <div class="mitades">
      <div class="bloque"><h3>En qué se va</h3>${cats.length ? barrasHtml(cats.map(([c, v]) => ({n: CAT[c].nombre, v})), cats[0][1]) : `<p class="sub">Sin gastos.</p>`}<p class="nota">Las tarjetas salen como un solo cargo el día 5.</p></div>
      <div class="bloque"><h3>Dónde más</h3><ul class="lista">${top.map(([k, v]) => `<li><span class="nom" style="font-weight:600">${esc(k)}</span><span class="val num">${eur(-v)}</span></li>`).join("") || `<li><span class="det">Nada.</span></li>`}</ul></div>
    </div>
    <div class="bloque"><h3>Movimientos <span class="chip">${lista.length}</span></h3>
      <div class="controles" style="margin:6px 0 2px">
        <label>Categoría <select id="f-cat"><option value="">Todas</option>${Object.values(CAT).filter(c => delPeriodo.some(x => x.cat === c.id)).map(c => `<option value="${c.id}" ${F.cat === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}</select></label>
        <label>Tipo <select id="f-tipo"><option value="">Todos</option>${[["ingreso","Ingresos"],["gasto","Gastos"],["interno","Entre cuentas"],["compra_piso","Compra del piso"]].map(([k, n]) => `<option value="${k}" ${F.tipo === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <label style="flex:1 1 180px">Buscar <input type="search" id="f-q" value="${esc(F.q)}" placeholder="Concepto" style="flex:1"></label>
      </div>
      <ul class="movs">${filas || `<li class="sub">Ningún movimiento con ese filtro.</li>`}</ul>${lista.length > corte ? `<button class="enlace" type="button" data-vertodos style="margin-top:10px">Ver los ${lista.length} movimientos</button>` : ""}</div>
    <details class="metodo"><summary>Mes a mes por categoría</summary><div class="envuelve" style="margin-top:10px"><table><thead><tr><th>Categoría</th>${meses.map(x => `<th class="der">${cap(MESES_L[+x.k.slice(5) - 1])}${x.completo ? "" : "*"}</th>`).join("")}</tr></thead><tbody>
      ${[...new Set(meses.flatMap(x => Object.keys(x.porCat)))].map(c => `<tr><td>${esc(CAT[c].nombre)}</td>${meses.map(x => `<td class="der num">${x.porCat[c] ? eur(-x.porCat[c]) : "—"}</td>`).join("")}</tr>`).join("")}
      <tr class="total"><td>Gastos</td>${meses.map(x => `<td class="der num">${eur(-x.gastos)}</td>`).join("")}</tr>
      <tr><td>Ingresos</td>${meses.map(x => `<td class="der num positivo">${eur(x.ingresos, true)}</td>`).join("")}</tr>
      <tr><td><b>Resultado</b></td>${meses.map(x => `<td class="der num ${x.ahorro < 0 ? "mal" : "bien"}"><b>${eur(x.ahorro, true)}</b></td>`).join("")}</tr>
      <tr><td class="tenue">Entre cuentas tuyas</td>${meses.map(x => `<td class="der num tenue">${x.interno ? eur(x.interno, true) : "—"}</td>`).join("")}</tr>
      <tr><td class="tenue">Compra del piso</td>${meses.map(x => `<td class="der num tenue">${x.compra ? eur(x.compra, true) : "—"}</td>`).join("")}</tr>
    </tbody></table></div></details>`;
  graficoHistoria(el.querySelector(".hueco"), histVer);
  const set = (k, v) => { ESTADO.filtro[k] = v; pintar(); };
  $("f-cat").onchange = e => set("cat", e.target.value); $("f-tipo").onchange = e => set("tipo", e.target.value);
  let t; $("f-q").oninput = e => { clearTimeout(t); t = setTimeout(() => { set("q", e.target.value); const i = $("f-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
}

// Calendario del mes (Futuro): días pasados con lo real, futuros con lo previsto y el saldo al cerrar el día
function htmlCalendario(){
  const [yy, mm] = ESTADO.mesCal.split("-").map(Number), primero = new Date(yy, mm - 1, 1), ultimo = new Date(yy, mm, 0);
  const p = prevision(Math.max(30, entre(BASE, ultimo) + 1)), colchon = COLCHON_BASE(), porDia = {};
  for (const m of MOVS) (porDia[m.fecha] ||= {real: [], prev: []}).real.push(m);
  for (const e of p.ev) (porDia[iso(e.fecha)] ||= {real: [], prev: []}).prev.push(e);
  let h = `<div class="cal-cab"><button type="button" data-cal="-1" aria-label="Mes anterior">‹</button><h3>${nombreMes(ESTADO.mesCal)}</h3><button type="button" data-cal="1" aria-label="Mes siguiente">›</button><button type="button" data-cal="hoy">Hoy</button></div>`;
  h += `<div class="cal">` + ["lun","mar","mié","jue","vie","sáb","dom"].map(d => `<div class="dsem">${d}</div>`).join("");
  const desfase = (primero.getDay() + 6) % 7;
  for (let i = 0; i < desfase; i++) h += `<div class="dia fuera" aria-hidden="true"></div>`;
  for (let d = 1; d <= ultimo.getDate(); d++){
    const f = new Date(yy, mm - 1, d), k = iso(f), x = porDia[k] || {real: [], prev: []};
    const pasado = f <= BASE, cls = ["dia"]; if (pasado) cls.push("pasado"); if (k === iso(HOY)) cls.push("hoy"); if (ESTADO.diaSel === k) cls.push("sel");
    const conImp = x.prev.filter(e => e.importe != null), saldoDia = conImp.length ? conImp[conImp.length - 1].saldo : null;
    if (!pasado && saldoDia != null && saldoDia < colchon && conImp.some(e => e.importe < 0)) cls.push("critico");
    let items = "";
    if (pasado){
      const corr = x.real.filter(m => m.tipo === "ingreso" || m.tipo === "gasto");
      const ent = r2(corr.filter(m => m.importe > 0).reduce((a, m) => a + m.importe, 0)), sal = r2(-corr.filter(m => m.importe < 0).reduce((a, m) => a + m.importe, 0));
      if (ent) items += `<span class="it ing num">+${eur0(ent)}</span>`;
      if (sal) items += `<span class="it real num">−${eur0(sal)}</span>`;
    } else {
      for (const e of x.prev.slice(0, 3)) items += `<span class="it ${e.certeza === "sin_importe" ? "sin" : e.certeza === "aviso" ? "ven" : e.importe > 0 ? "ing" : ""}" title="${esc(e.concepto)}">${e.importe == null ? (e.certeza === "aviso" ? "◇ " : "? ") : (e.importe > 0 ? "+" : "−") + eur0(Math.abs(e.importe)) + " "}${esc(e.concepto)}</span>`;
      if (x.prev.length > 3) items += `<span class="it mas">+${x.prev.length - 3} más</span>`;
    }
    const puntos = pasado ? "" : x.prev.map(e => `<span class="punto" style="background:${e.certeza === "sin_importe" ? "var(--critico)" : e.certeza === "aviso" ? "var(--aviso)" : e.importe > 0 ? "var(--bien)" : "var(--gasto)"}"></span>`).join("");
    h += `<button type="button" class="${cls.join(" ")}" data-dia="${k}" aria-label="${esc(larga(f))}"><span class="nd num">${d}</span>${items}<span>${puntos}</span>${!pasado && saldoDia != null ? `<span class="neto num ${saldoDia < 0 ? "mal" : ""}">${eur0(saldoDia)}</span>` : ""}</button>`;
  }
  for (let i = (desfase + ultimo.getDate()) % 7; i && i < 7; i++) h += `<div class="dia fuera" aria-hidden="true"></div>`;
  h += `</div><div class="leyenda-cal"><span><b class="positivo">+</b> ingreso</span><span><b>−</b> gasto</span><span class="mal"><b>?</b> sin importe</span><span style="color:var(--aviso)"><b>◇</b> aviso</span><span><span class="muestra"></span>bajo el colchón</span><span>Cifra de abajo: saldo al cerrar el día</span></div>`;
  let det = `<p class="sub">Toca un día para ver el detalle.</p>`;
  if (ESTADO.diaSel){
    const f = leer(ESTADO.diaSel), x = porDia[ESTADO.diaSel] || {real: [], prev: []};
    const filas = x.real.map(m => `<li><span class="nom">${esc(m.concepto)}</span><span class="val num ${m.importe > 0 ? "positivo" : ""}">${eur(m.importe, true)}</span><span class="det">Real · ${esc(CAT[m.cat].nombre)}</span></li>`).join("")
      + x.prev.map(e => `<li><span class="nom">${esc(e.concepto)}</span><span class="val num ${e.certeza === "sin_importe" ? "mal" : ""}">${e.importe == null ? (e.certeza === "aviso" ? "—" : "¿?") : eur(e.importe, true)}</span><span class="det">${cert(e.certeza)} ${esc(e.nota || "")}</span></li>`).join("");
    det = `<p class="sub"><b>${cap(larga(f))}</b></p><ul class="lista">${filas || `<li><span class="det">Sin movimientos.</span></li>`}</ul>`;
  }
  return `<div class="dos"><div class="bloque">${h}</div><div class="bloque"><h3>Detalle del día</h3>${det}</div></div>`;
}

// FUTURO: ¿llego?, la previsión, el calendario y todo lo que se repite o vence.
function vistaFuturo(el){
  const p = prevision(ESTADO.horizonte), v = veredicto(p), colchon = COLCHON_BASE(), fm = fijosMensuales();
  const nom = proxNomina(p), tj = p.sin.find(e => e.origen === "tarjeta");
  const largo = prevision(400), prox = id => { const e = largo.ev.find(e => e.id === id); return e ? corta(e.fecha) : "—"; };
  const proxC = nombre => { const e = largo.ev.find(e => e.concepto === nombre); return e ? corta(e.fecha) : "—"; };
  let lista = "", mesAnt = "";
  for (const e of p.ev){ const k = ym(e.fecha); if (k !== mesAnt){ lista += `<li class="mes-sep">${nombreMes(k)}</li>`; mesAnt = k; } lista += filaMov(e, true); }
  const fijos = C.fijos.filter(f => f.activo !== false), sigEv = id => largo.ev.find(e => e.id === id);
  const anual = f => f.importe == null ? null : r2(Math.abs(largo.ev.filter(e => e.id === f.id && e.fecha <= sumar(BASE, 365)).reduce((a, e) => a + (e.importe || 0), 0)));
  el.innerHTML = `
    <div class="heroe ${v.clase}"><div class="fila-h">
      <div><span class="estado"><i></i>${v.t}</span>
        <div class="n">Día más justo · ${corta(p.min.fecha)}</div><div class="grande num">${eur(p.min.saldo)}</div>
        <div class="pills">${nom ? `<span class="pill">Nómina <b class="num">${eur(nom.importe, true)}</b> ${corta(nom.fecha)}</span>` : ""}<span class="pill">Saldo el ${corta(p.fin)} <b class="num">${eur0(p.final)}</b></span>${tj ? `<span class="pill rojo">Tarjetas ${corta(tj.fecha)} <b>sin restar</b></span>` : ""}</div></div>
      <div><div class="n" style="margin-bottom:8px">${v.h}. Horizonte:</div>${selectorHorizonte()}</div>
    </div></div>
    <figure class="grafico"><div class="tit">Saldo previsto</div>${leyendaSaldo(false)}<div class="hueco"></div></figure>
    <div class="fila-tit"><span style="font-weight:800;font-size:18px">Lo que viene</span>${seg("modo", {lista: "Lista", calendario: "Calendario"}, ESTADO.futuro)}</div>
    ${ESTADO.futuro === "calendario" ? htmlCalendario() : `<div class="bloque"><ul class="movs">${lista || `<li class="sub">Nada previsto.</li>`}</ul>
      <p class="nota">Solo resta importes reales. Lo que no tiene cifra sale con «¿?» y no se resta. Si un día cae en fin de semana, pasa al lunes.</p></div>`}
    <div class="dos">
      <div class="bloque"><h3>Cada mes <span class="chip">Margen ${eur0(r2(fm.ing - fm.gas))}/mes</span></h3><ul class="movs">
        ${fijos.map(f => { const ing = f.tipo === "ingreso", s = sigEv(f.id), imp = s && s.importe != null ? Math.abs(s.importe) : f.importe;
          const cambio = f.cuadro ? deudaDe(f.cuadro).cuadro.find(x => leer(x.fecha) > BASE && x.cuota !== imp) : null;
          return `<li class="mov ${ing ? "ing" : "gas"}"><span class="mi" aria-hidden="true">${ing ? "↑" : "↓"}</span><span class="mc"><span class="mn">${esc(f.nombre)}</span><span class="ms">${f.meses ? "Día " + f.dia + " de " + f.meses.map(x => MESES[x - 1]).join(", ") : "Día " + f.dia} · próximo ${prox(f.id)}${cambio ? ` · ${eur(cambio.cuota)} desde ${MESES[leer(cambio.fecha).getMonth()]}` : ""}</span></span>
            <span class="mv"><b class="num ${ing ? "positivo" : ""}">${imp == null ? "¿?" : eur(ing ? imp : -imp, true)}</b><span class="num">${anual(f) == null ? "" : eur0(anual(f)) + "/año"}</span></span></li>`; }).join("")}
        <li class="mov sin"><span class="mi">?</span><span class="mc"><span class="mn">${esc(C.tarjetas.nombre)}</span><span class="ms">Día ${C.tarjetas.dia_cargo} · próximo ${proxC(C.tarjetas.nombre)} · se resta al ver la liquidación</span></span><span class="mv"><b class="mal">¿?</b></span></li>
      </ul><p class="nota">Ingresos fijos ${eur(fm.ing)}/mes · gastos fijos ${eur(fm.gas)}/mes. Sin tarjetas ni día a día.</p></div>
      <div class="pila">
        <div class="bloque"><h3>Pagos pendientes</h3><ul class="movs">
          ${C.pendientes.map(x => `<li class="mov ${x.importe == null ? "sin" : "ven"}"><span class="mi">${x.importe == null ? "?" : "!"}</span><span class="mc"><span class="mn">${esc(x.nombre)}</span><span class="ms">${x.fecha ? (leer(x.fecha) <= BASE ? "Venció el " + corta(leer(x.fecha)) + " · reservado ya" : "Vence el " + corta(leer(x.fecha))) : "Sin fecha"}${x.importe == null ? " · no se resta" : ""}</span></span><span class="mv"><b class="num ${x.importe == null ? "mal" : ""}">${x.importe == null ? "¿?" : eur(-x.importe)}</b></span></li>`).join("")}
        </ul></div>
        <div class="bloque"><h3>Vencimientos y renovaciones</h3><ul class="movs">
          ${C.vencimientos.slice().sort((a, b) => (a.fecha || "9") < (b.fecha || "9") ? -1 : 1).map(x => { const d = x.fecha ? leer(x.fecha) : null, rev = d && x.aviso_dias ? sumar(d, -x.aviso_dias) : null;
            return `<li class="mov ${x.es_cargo ? "gas" : "ven"}"><span class="fd">${d ? `<b>${d.getDate()}</b>${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : "—"}</span><span class="mi">${x.es_cargo ? "↓" : "◇"}</span><span class="mc"><span class="mn">${esc(x.nombre.replace(/^Renovación del /, "Renovación "))}</span><span class="ms">${rev ? "Revisar desde el " + corta(rev) + "/" + String(rev.getFullYear()).slice(2) : ""}${x.entidad ? (rev ? " · " : "") + esc(x.entidad) : ""}${x.es_cargo && x.certeza ? ETQ[x.certeza] : ""}</span></span><span class="mv"><b class="num">${x.importe != null ? eur(-x.importe) : x.es_cargo ? "¿?" : ""}</b></span></li>`; }).join("")}
        </ul></div>
      </div>
    </div>`;
  graficoSaldo(el.querySelector(".hueco"), p, {});
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
      <div class="tile"><div class="n"><span class="ic">${icono("inversiones")}</span>Tu cartera</div><div class="v num">${eur(tot)}</div><div class="d">${inv.length ? plural(inv.length, "producto", "productos") : "Sin fondos ni acciones"}</div></div>
      <div class="tile"><div class="n"><span class="ic">${icono("cuenta")}</span>Margen fijo al mes</div><div class="v num">${eur0(r2(fm.ing - fm.gas))}</div><div class="d">Antes de tarjetas y día a día</div></div>
      ${meses.slice(-2).map(x => `<div class="tile"><div class="n"><span class="ic">${icono("pasado")}</span>Ahorro real · ${MESES[+x.k.slice(5) - 1]}${x.completo ? "" : "*"}</div><div class="v num ${x.ahorro < 0 ? "mal" : "bien"}">${eur(x.ahorro, true)}</div><div class="d">Tasa ${tasa(x)}</div></div>`).join("")}
    </div>
    <div class="dos">
      <div class="bloque"><h3>Qué hacer con lo que sobra <span class="chip">contexto/05</span></h3>${esc6.html}</div>
      <div class="pila">
        ${proximo("Perfil de riesgo", "Cuánta volatilidad aceptas y cuánto quieres destinar cada mes.")}
        ${proximo("Reparto del ahorro", "Qué parte del ahorro mensual va a colchón, casa e inversión.")}
        ${proximo("Scoring de inversión", "Una nota para cada fondo o acción según tu perfil.")}
      </div>
    </div>`;
}

function vistaFinanciacion(el){
  const fm = fijosMensuales(), lim = C.reglas.tasa_esfuerzo_max_pct, hip = deudaDe("hipoteca"), piso = C.bienes.find(b => b.id === "piso");
  const end = fm.ing ? fm.deuda / fm.ing * 100 : null, libre = r2(fm.ing * lim / 100 - fm.deuda);
  const f = hip && hip.cuadro ? filaCuadro(hip, BASE) : null, viva = hip ? pendienteDe(hip) : 0;
  const sig = hip && hip.cuadro ? hip.cuadro.filter(x => leer(x.fecha) > BASE).slice(0, 12) : [];
  const intAnio = r2(sig.reduce((a, x) => a + x.intereses, 0)), capAnio = r2(sig.reduce((a, x) => a + x.amortizacion, 0));
  const viv = C.fijos.filter(x => ["hipoteca", "comunidad"].includes(x.id) && x.importe != null).reduce((a, x) => a + x.importe, 0);
  const ratios = [
    {n: "Tasa de esfuerzo", v: end, lim, f: "Cuotas de deuda ÷ ingresos fijos"},
    {n: "Vivienda sobre ingresos", v: fm.ing ? viv / fm.ing * 100 : null, lim, f: "Hipoteca + comunidad ÷ ingresos fijos"},
    {n: "LTV del piso", v: hip && piso ? viva / piso.valor * 100 : null, lim: 80, f: "Hipoteca pendiente ÷ precio de compra"},
  ];
  el.innerHTML = `
    ${enDesarrollo("Financiación · en desarrollo", "Aquí calcularemos cuándo puedes volver a financiar una casa o un piso, con un scoring como el de los bancos y tu tasa de esfuerzo. Por ahora, tus ratios reales y la hipoteca.")}
    <div class="cifras">
      <div class="tile ${end > lim ? "alerta" : ""}"><div class="n"><span class="ic">${icono("financiacion")}</span>Tasa de esfuerzo</div><div class="v num ${end > lim ? "mal" : ""}">${pct(end)}</div><div class="d">Límite ${lim} %</div></div>
      <div class="tile"><div class="n"><span class="ic">${icono("cuenta")}</span>Cuota libre hasta el ${lim} %</div><div class="v num ${libre < 0 ? "mal" : ""}">${eur0(libre)}<span class="tenue" style="font-size:14px">/mes</span></div><div class="d">Con tus ingresos fijos de hoy</div></div>
      <div class="tile"><div class="n"><span class="ic">${icono("escudo")}</span>Hipoteca pendiente</div><div class="v num">${eur0(viva)}</div><div class="d">${f ? "Tras la cuota del " + corta(leer(f.fecha)) : ""}</div></div>
      <div class="tile"><div class="n"><span class="ic">${icono("pasado")}</span>Próximos 12 meses</div><div class="v num">${eur0(intAnio)}</div><div class="d">de intereses · ${eur0(capAnio)} de capital</div></div>
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
// Compras miradas: en la nube (claude.ai, mismas en PC y móvil) si la página lo permite; si no, en este navegador
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
  el.innerHTML = `<p class="sub" style="margin:0">Tus datos reales y tus reglas. La compra es una ${cert("hipotesis")}: no cambia tus datos.</p>
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
      <figure class="grafico"><div class="tit">Tu saldo con y sin la compra</div>${leyendaSaldo(false, true)}<div class="hueco"></div></figure>
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
      <li><b>¿Es buena decisión?</b> Filtro 2 de contexto/05: colchón base (${eur(COLCHON_BASE())}) intacto, sin pagos comprometidos en ${REGLAS_COMPRA.dias_compromisos} días y último mes en positivo. Financiado: endeudamiento ≤ ${C.reglas.tasa_esfuerzo_max_pct} % y margen ≥ ${eur(REGLAS_COMPRA.margen_min_tras_cuota)} (provisional). Inversión: solo con los pasos 1–4 del excedente hechos.</li>
      <li><b>Patrimonio:</b> valor que conservas − lo que te cuesta. El valor de reventa y el ingreso los pones tú (Hipótesis). Si da ingresos, se suman en la previsión desde el mes siguiente.</li>
      <li>«Ahora no»: lo que falla ya fallaba sin la compra. Tarjeta: se carga entera el día ${C.tarjetas.dia_cargo} del mes siguiente.</li></ul></details>`;
  if (r) graficoSaldo(el.querySelector(".hueco"), r.con, {comparar: r.sin});
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
    {t: "Colchón específico del piso Viriato", e: "Sin decidir", c: "bloq", x: "Vacíos y reparaciones"},
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
    <div class="medidor ${malo ? "" : cerca ? "medio" : "ok"}" role="img" aria-label="${esc(r.n)} ${pct(r.v)}${r.lim != null ? ", límite " + r.lim + " %" : ""}"><i style="width:${r.v / tope * 100}%;${r.lim == null ? "background:var(--serie)" : ""}"></i>${r.lim != null ? `<b style="left:${r.lim / tope * 100}%" title="Límite ${r.lim} %"></b>` : ""}</div>
    <div class="f">${esc(r.f)}${r.lim != null ? ` · Límite ${r.lim} %${malo ? " · <b class='mal'>por encima</b>" : cerca ? " · cerca del límite" : ""}` : " · Informativo"}</div></div>`;
}

/* =========================================================
   MARCO Y ARRANQUE
   ========================================================= */
const PRINCIPALES = [["inicio", "Inicio", "Posición global"], ["pasado", "Pasado", "Gastos y movimientos"], ["futuro", "Futuro", "Previsión y calendario"]];
const HERRAMIENTAS = [["comprar", "¿Puedo comprarlo?", "Evalúa una compra", false], ["inversiones", "Inversiones", "Cartera y reparto del ahorro", true], ["financiacion", "Financiación", "Tasa de esfuerzo y vivienda", true]];
const TITULOS = Object.fromEntries([...PRINCIPALES, ...HERRAMIENTAS].map(([k, n]) => [k, n]));
const VISTAS = {inicio: vistaInicio, pasado: vistaPasado, futuro: vistaFuturo, comprar: vistaComprar, inversiones: vistaInversiones, financiacion: vistaFinanciacion};
// Direcciones de la v2, por si hay enlaces guardados
const ANTIGUAS = {calendario: "futuro", prevision: "futuro", recurrentes: "futuro", movimientos: "pasado", gastos: "pasado", global: "inicio", faltan: "inicio"};
let ACTUAL = "inicio";

function abrirHoja(titulo, html){
  $("hoja-cont").innerHTML = `<div class="hoja-cab"><h2>${titulo}</h2><button type="button" data-cerrar aria-label="Cerrar">${icono("cerrar")}</button></div>${html}`;
  $("hoja").hidden = false; $("hoja-cont").querySelector("[data-cerrar]").focus();
}
const cerrarHoja = () => { $("hoja").hidden = true; };
function hojaLiquidez(){
  const L = posicionLiquida();
  abrirHoja("Posición líquida", `<p class="gran num">${eur(L.total)}</p><p class="sub">Todo lo que puedes usar sin vender el piso.</p>
    <ul class="movs">${L.partes.map(x => `<li class="mov ing"><span class="mi">${icono(x.ic)}</span><span class="mc"><span class="mn">${esc(x.n)}</span><span class="ms">${esc(x.d)}</span></span><span class="mv"><b class="num">${x.v == null ? "¿?" : eur(x.v)}</b></span></li>`).join("")}
    ${L.comprometido ? `<li class="mov ven"><span class="mi">!</span><span class="mc"><span class="mn">Comprometido</span><span class="ms">Honorarios pendientes de cargo</span></span><span class="mv"><b class="num">${eur(-L.comprometido)}</b></span></li>` : ""}</ul>
    ${L.comprometido ? `<ul class="lista" style="margin-top:6px;border-top:2px solid var(--tinta)"><li><span class="nom">Libre de compromisos</span><span class="val num ${L.libre < 0 ? "mal" : ""}">${eur(L.libre)}</span></li></ul>` : ""}`);
}
function hojaPendientes(){
  const items = datosQueFaltan();
  abrirHoja("Datos pendientes", items.length ? `<p class="sub">Cuando lo sepas, díselo al agente y desaparece de aquí.</p><ul class="lista">${items.map(i => `<li><span class="nom">${esc(i.t)}</span><span></span>${i.q ? `<span class="det">${esc(i.q)}</span>` : ""}${i.i ? `<span class="det tenue">${esc(i.i)}</span>` : ""}</li>`).join("")}</ul>`
    : `<p class="sub">No falta nada. Las tarjetas y las ruedas se esperan al extracto.</p>`);
}
function hojaHerramientas(){
  abrirHoja("Herramientas", `<div class="herr">${HERRAMIENTAS.map(([k, n, d, dev]) => `<button type="button" data-tab="${k}" aria-current="${k === ACTUAL ? "page" : "false"}"><span class="ic">${icono(k === "comprar" ? "comprar" : k)}</span><span>${n}<small>${d}</small></span>${dev ? `<span class="chip oro dev">En desarrollo</span>` : ""}</button>`).join("")}</div>`);
}

function pintar(){
  const dias = entre(BASE, HOY), fr = $("frescura");
  fr.textContent = "Datos al " + corta(BASE) + (dias > 0 ? " · hace " + plural(dias, "día", "días") : "");
  fr.classList.toggle("vieja", dias > 7);
  const nP = datosQueFaltan().length;
  $("pend").innerHTML = `<span class="ic">${icono("info")}</span>${nP ? `<i>${nP}</i>` : ""}`;
  $("pend").setAttribute("aria-label", nP ? `${nP} datos pendientes` : "Datos pendientes");
  $("titulo").textContent = $("titulo-pc").textContent = TITULOS[ACTUAL];
  document.title = TITULOS[ACTUAL] + " · Finanzas de Alberto";
  const btn = ([k, n, , dev]) => `<button type="button" data-tab="${k}" aria-current="${k === ACTUAL ? "page" : "false"}"><span class="ic">${icono(k)}</span>${n}${dev ? `<span class="dev">Pronto</span>` : ""}</button>`;
  $("menu").innerHTML = `<span class="grupo">Principal</span>${PRINCIPALES.map(btn).join("")}<span class="grupo">Herramientas</span>${HERRAMIENTAS.map(btn).join("")}`;
  const L = posicionLiquida();
  $("liq-lat").innerHTML = `<div class="n"><span class="ic">${icono("liquidez")}</span>Posición líquida</div><div class="v num">${eur(L.total)}</div>
    <ul>${L.partes.map(x => `<li><span>${esc(x.n)}</span><b class="num">${x.v == null ? "¿?" : eur(x.v)}</b></li>`).join("")}</ul>
    ${L.comprometido ? `<div class="libre"><span>Libre de compromisos</span><b class="num">${eur(L.libre)}</b></div>` : ""}`;
  $("liq-movil").innerHTML = `<span class="ic">${icono("liquidez")}</span><span class="t"><small>Posición líquida</small><b class="num">${eur(L.total)}</b></span>${L.comprometido ? `<span class="x">Libre de compromisos<b class="num">${eur0(L.libre)}</b></span>` : ""}`;
  const enHerr = HERRAMIENTAS.some(([k]) => k === ACTUAL);
  $("barra").innerHTML = PRINCIPALES.map(([k, n]) => `<button type="button" data-tab="${k}" aria-current="${k === ACTUAL ? "page" : "false"}"><span class="ic">${icono(k)}</span><span>${n}</span></button>`).join("")
    + `<button type="button" data-herr aria-current="${enHerr ? "page" : "false"}"><span class="ic">${icono("herramientas")}</span><span>Herramientas</span></button>`;
  $("app").innerHTML = `<section class="vista" id="v-${ACTUAL}"></section>`;
  VISTAS[ACTUAL]($("v-" + ACTUAL));
}

if (!D || !MOVS.length || !C){
  $("app").innerHTML = `<p class="vacio">No encuentro los datos. Esta página necesita <b>datos.js</b> en la misma carpeta. Pídele al agente: «genera datos.js con generar_datos.py».</p>`;
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

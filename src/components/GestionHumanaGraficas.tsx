"use client";

import { useMemo } from "react";

interface EvaluacionData {
  notaFinal: number | null;
  notaPotencial: number | null;
  calidad: number | null;
  cantidadProductividad: number | null;
  tiempoOportunidad: number | null;
  respuestas: { puntuacion: number; competencia: { nombre: string; tipo: string } }[];
}

function BarraHorizontal({ nombre, valor, maxValor = 5, color = "#4f7cff" }: { nombre: string; valor: number; maxValor?: number; color?: string }) {
  const porcentaje = (valor / maxValor) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", minWidth: "120px", textAlign: "right" }}>{nombre}</span>
      <div style={{ flex: 1, height: "20px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ width: `${porcentaje}%`, height: "100%", background: color, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "0.5rem" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}>{valor.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function Histograma({ titulo, datos, color = "#4f7cff" }: { titulo: string; datos: { rango: string; cantidad: number }[]; color?: string }) {
  const max = Math.max(...datos.map(d => d.cantidad), 1);
  return (
    <div>
      <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#334155", marginBottom: "1rem" }}>{titulo}</h4>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "120px" }}>
        {datos.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#334155" }}>{d.cantidad}</span>
            <div style={{ width: "100%", height: `${(d.cantidad / max) * 100}px`, background: color, borderRadius: "4px 4px 0 0", minHeight: d.cantidad > 0 ? "4px" : "0" }} />
            <span style={{ fontSize: "0.65rem", color: "#64748b", textAlign: "center" }}>{d.rango}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GestionHumanaGraficas({ evaluaciones }: { evaluaciones: EvaluacionData[] }) {
  const stats = useMemo(() => {
    const evals = evaluaciones.filter(e => e.notaFinal !== null);
    if (evals.length === 0) return null;

    // Resultado Global Compañía
    const resultadoGlobal = evals.reduce((s, e) => s + Number(e.notaFinal), 0) / evals.length;

    // Distribución del Desempeño
    const distribDesempeño = [
      { rango: "1.0-1.9", cantidad: 0 },
      { rango: "2.0-2.9", cantidad: 0 },
      { rango: "3.0-3.9", cantidad: 0 },
      { rango: "4.0-5.0", cantidad: 0 },
    ];
    evals.forEach(e => {
      const n = Number(e.notaFinal);
      if (n < 2) distribDesempeño[0].cantidad++;
      else if (n < 3) distribDesempeño[1].cantidad++;
      else if (n < 4) distribDesempeño[2].cantidad++;
      else distribDesempeño[3].cantidad++;
    });

    // Distribución de Potencial
    const evalsPotencial = evaluaciones.filter(e => e.notaPotencial !== null);
    const distribPotencial = [
      { rango: "1.0-1.9", cantidad: 0 },
      { rango: "2.0-2.9", cantidad: 0 },
      { rango: "3.0-3.9", cantidad: 0 },
      { rango: "4.0-5.0", cantidad: 0 },
    ];
    evalsPotencial.forEach(e => {
      const n = Number(e.notaPotencial);
      if (n < 2) distribPotencial[0].cantidad++;
      else if (n < 3) distribPotencial[1].cantidad++;
      else if (n < 4) distribPotencial[2].cantidad++;
      else distribPotencial[3].cantidad++;
    });

    // Competencias Transversales (promedio)
    const transversales = ["ACTÚA CON INTEGRIDAD", "ORIENTACIÓN AL CLIENTE", "ADAPTACIÓN AL CAMBIO"];
    const compTransversales = transversales.map(nombre => {
      const vals = evaluaciones.flatMap(e => e.respuestas.filter(r => r.competencia.nombre === nombre).map(r => r.puntuacion));
      const promedio = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      return { nombre, valor: promedio };
    }).filter(c => c.valor > 0);

    // Competencias por Nivel
    const niveles = ["operativo", "tactico", "estrategico"];
    const compPorNivel = niveles.map(nivel => {
      const vals = evaluaciones.flatMap(e => e.respuestas.filter(r => r.competencia.tipo === nivel).map(r => r.puntuacion));
      const promedio = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      return { nombre: nivel.charAt(0).toUpperCase() + nivel.slice(1), valor: promedio };
    }).filter(c => c.valor > 0);

    // Desempeño Organizacional
    const desempenoOrg = [
      { nombre: "Calidad", valor: 0 },
      { nombre: "Cantidad/Productividad", valor: 0 },
      { nombre: "Tiempo/Oportunidad", valor: 0 },
    ];
    const calVals = evaluaciones.filter(e => e.calidad !== null).map(e => e.calidad!);
    const cantVals = evaluaciones.filter(e => e.cantidadProductividad !== null).map(e => e.cantidadProductividad!);
    const tiempVals = evaluaciones.filter(e => e.tiempoOportunidad !== null).map(e => e.tiempoOportunidad!);
    if (calVals.length > 0) desempenoOrg[0].valor = calVals.reduce((s, v) => s + v, 0) / calVals.length;
    if (cantVals.length > 0) desempenoOrg[1].valor = cantVals.reduce((s, v) => s + v, 0) / cantVals.length;
    if (tiempVals.length > 0) desempenoOrg[2].valor = tiempVals.reduce((s, v) => s + v, 0) / tiempVals.length;

    // Nine Box Organizacional
    const nineBox = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];
    evals.forEach(e => {
      if (e.notaFinal === null || e.notaPotencial === null) return;
      const des = Number(e.notaFinal);
      const pot = Number(e.notaPotencial);
      const row = pot >= 4 ? 0 : pot >= 3 ? 1 : 2;
      const col = des >= 4 ? 2 : des >= 3 ? 1 : 0;
      nineBox[row][col] = nineBox[row][col] ? `${Number(nineBox[row][col]) + 1}` : "1";
    });

    return {
      resultadoGlobal,
      distribDesempeño,
      distribPotencial,
      compTransversales,
      compPorNivel,
      desempenoOrg: desempenoOrg.filter(d => d.valor > 0),
      nineBox,
      totalEvaluados: evals.length,
    };
  }, [evaluaciones]);

  if (!stats) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
      {/* 1. Resultado Global Compañía */}
      <div style={{ textAlign: "center", padding: "1.5rem", background: "#f8fafc", borderRadius: "12px" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Resultado Global Compañía</span>
        <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1e3a8a", margin: "0.5rem 0" }}>{stats.resultadoGlobal.toFixed(2)}</div>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{stats.totalEvaluados} evaluaciones</span>
      </div>

      {/* 2. Distribución del Desempeño */}
      <div style={{ padding: "1rem", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <Histograma titulo="Distribución del Desempeño" datos={stats.distribDesempeño} color="#4f7cff" />
      </div>

      {/* 3. Distribución de Potencial */}
      <div style={{ padding: "1rem", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <Histograma titulo="Distribución de Potencial" datos={stats.distribPotencial} color="#8b5cf6" />
      </div>

      {/* 4. Competencias Transversales */}
      {stats.compTransversales.length > 0 && (
        <div style={{ padding: "1rem", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#334155", marginBottom: "1rem" }}>Competencias Transversales</h4>
          {stats.compTransversales.map((c, i) => <BarraHorizontal key={i} nombre={c.nombre} valor={c.valor} color="#4f7cff" />)}
        </div>
      )}

      {/* 5. Competencias por Nivel */}
      {stats.compPorNivel.length > 0 && (
        <div style={{ padding: "1rem", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#334155", marginBottom: "1rem" }}>Competencias por Nivel</h4>
          {stats.compPorNivel.map((c, i) => <BarraHorizontal key={i} nombre={c.nombre} valor={c.valor} color="#f59e0b" />)}
        </div>
      )}

      {/* 6. Desempeño Organizacional */}
      {stats.desempenoOrg.length > 0 && (
        <div style={{ padding: "1rem", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#334155", marginBottom: "1rem" }}>Desempeño Organizacional</h4>
          {stats.desempenoOrg.map((c, i) => <BarraHorizontal key={i} nombre={c.nombre} valor={c.valor} color="#10b981" />)}
        </div>
      )}

      {/* 7. Nine Box Organizacional */}
      <div style={{ padding: "1rem", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", gridColumn: "1 / -1" }}>
        <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#334155", marginBottom: "1rem" }}>Nine Box Organizacional</h4>
        <div style={{ display: "grid", gridTemplateColumns: "80px repeat(3, 1fr)", gap: "4px", maxWidth: "600px", margin: "0 auto" }}>
          <div />
          <div style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Bajo</div>
          <div style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Medio</div>
          <div style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Alto</div>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center" }}>Alto</div>
          {stats.nineBox[0].map((val, i) => (
            <div key={`0-${i}`} style={{ padding: "0.75rem", background: val ? "#f0fdf4" : "#f8fafc", borderRadius: "8px", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: val ? "#10b981" : "#cbd5e1", border: "1px solid #e2e8f0" }}>
              {val || "—"}
            </div>
          ))}
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center" }}>Medio</div>
          {stats.nineBox[1].map((val, i) => (
            <div key={`1-${i}`} style={{ padding: "0.75rem", background: val ? "#fffbeb" : "#f8fafc", borderRadius: "8px", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: val ? "#f59e0b" : "#cbd5e1", border: "1px solid #e2e8f0" }}>
              {val || "—"}
            </div>
          ))}
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center" }}>Bajo</div>
          {stats.nineBox[2].map((val, i) => (
            <div key={`2-${i}`} style={{ padding: "0.75rem", background: val ? "#fef2f2" : "#f8fafc", borderRadius: "8px", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: val ? "#ef4444" : "#cbd5e1", border: "1px solid #e2e8f0" }}>
              {val || "—"}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem", fontSize: "0.7rem", color: "#64748b" }}>
          <span>Desempeño →</span>
          <span>↑ Potencial</span>
        </div>
      </div>
    </div>
  );
}

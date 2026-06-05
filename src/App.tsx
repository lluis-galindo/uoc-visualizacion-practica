import { useEffect, useState } from 'react';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import {
  aiTrustByToolBin,
  countryAdjustedSalary,
  remoteSalarySummary,
  surveyMetadata,
  toolCountSalarySummary,
} from '@/data/processedSurveyData';

const CHART_CONFIG = {
  nominal: { label: 'Nominal (USD)', color: '#c9b99a' },
  adjusted: { label: 'Ajustado PPP', color: '#2d4a3e' },
  trust: { label: 'Confianza', color: '#2d4a3e' },
  neutral: { label: 'Neutral', color: '#d4c5b0' },
  distrust: { label: 'Desconfianza', color: '#8b3a2a' },
  salary: { label: 'Salario mediano', color: '#2d4a3e' },
};

// Estilos minimalistas
const globalStyles = `
  :root {
    --ink: #1a1a18;
    --ink-light: #4a4a44;
    --ink-muted: #8a8a80;
    --paper: #faf8f3;
    --paper-dark: #f0ece2;
    --accent: #2d4a3e;
    --accent-warm: #8b3a2a;
    --rule: #d8d4c8;
    --highlight: #e8f0ec;
  }
  body { background: var(--paper); margin: 0; font-family: 'Source Serif 4', serif; }
  .chart-frame { background: white; border: 1px solid var(--rule); padding: 1rem; }
  .section-number { font-family: 'Playfair Display', serif; font-size: 4rem; font-style: italic; color: var(--rule); line-height: 1; }
  .chart-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 600; color: var(--ink); }
  .chart-subtitle { font-family: 'Source Serif 4', serif; font-size: 1rem; font-style: italic; font-weight: 300; color: var(--ink-light); }
  .prose-text { font-family: 'Source Serif 4', serif; font-size: 0.9375rem; line-height: 1.75; color: var(--ink-light); }
  .callout { border-left: 3px solid var(--accent); padding: 0.75rem 1.25rem; background: var(--highlight); font-size: 0.875rem; margin: 1rem 0; }
  .callout-warm { border-left-color: var(--accent-warm); background: #fdf3f0; }
  .stat-pill { display: inline-flex; align-items: center; background: var(--accent); color: white; font-size: 0.8125rem; padding: 0.25rem 0.75rem; border-radius: 2px; margin-right: 0.5rem; margin-bottom: 0.5rem; }
  .stat-pill-warm { background: var(--accent-warm); }
  .divider-line { display: flex; align-items: center; gap: 1.5rem; color: var(--ink-muted); font-style: italic; font-size: 1rem; margin: 0.5rem 0; }
  .divider-line::before, .divider-line::after { content: ''; flex: 1; height: 1px; background: var(--rule); }
  .note-label { font-family: 'Source Serif 4', serif; font-size: 0.75rem; color: var(--ink-muted); }
  .sort-btn { font-family: 'Source Serif 4', serif; font-size: 0.8125rem; padding: 0.3rem 0.875rem; border: 1px solid var(--rule); cursor: pointer; background: white; color: var(--ink-light); }
  .sort-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
  .scroll-top-btn { position: fixed; bottom: 1.5rem; right: 1.5rem; width: 2.5rem; height: 2.5rem; background: var(--ink); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; }
  .scroll-top-btn:hover { background: var(--accent); }
  .header-rule { border: none; border-top: 3px solid var(--ink); margin-bottom: 0.5rem; }
`;

export function App() {
  // Datos herramienta-salario
  const toolSalaryData = toolCountSalarySummary.map((item) => ({
    name: item.bin,
    salary: item.median,
  }));

  // Datos stacked: aseguramos neutral = 100 - trust - distrust
  const trustNeutralDistrustData = aiTrustByToolBin.map((entry) => ({
    name: entry.bin,
    trust: entry.pctTrust,
    distrust: entry.pctDistrust,
    neutral: 100 - entry.pctTrust - entry.pctDistrust,
  }));

  // Datos remote
  const remoteSalaryData = remoteSalarySummary.map((item) => ({
    name: item.mode === 'Remote' ? 'Remoto' : item.mode === 'Hybrid' ? 'Híbrido' : 'Presencial',
    salary: item.median,
  }));

  // Datos países con orden dinámico
  const [sortBy, setSortBy] = useState<'nominal' | 'adjusted'>('adjusted');
  const q2Data = countryAdjustedSalary
    .map((entry) => ({ name: entry.country, nominal: entry.nominalMedian, adjusted: entry.adjustedMedian }))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = globalStyles;
    document.head.appendChild(style);
    return () => {
        document.head.removeChild(style);
    };
  }, []);

  const CustomCountryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const nominal = payload.find((p: any) => p.dataKey === 'nominal')?.value;
      const adjusted = payload.find((p: any) => p.dataKey === 'adjusted')?.value;
      return (
        <div style={{ background: 'white', border: '1px solid var(--rule)', padding: '0.5rem 1rem', fontFamily: "'Source Serif 4', serif", fontSize: 13 }}>
          <strong>{label}</strong><br />
          <span style={{ color: CHART_CONFIG.nominal.color }}>Nominal: ${nominal?.toLocaleString('es-ES')}</span><br />
          <span style={{ color: CHART_CONFIG.adjusted.color }}>Ajustado PPP: ${adjusted?.toLocaleString('es-ES')}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', color: 'var(--ink)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>

        <header style={{ marginBottom: '5rem' }}>
          <hr className="header-rule" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <p className="note-label">Lluís Mendoza Vandrell · Visualización de Datos · UOC · 2025</p>
            <p className="note-label">Stack Overflow Survey 2025</p>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 600, lineHeight: 1.15, marginBottom: '1rem' }}>
            Tecnología, salario e inteligencia artificial:<br />
            <em style={{ fontWeight: 400 }}>el perfil del desarrollador en 2025</em>
          </h1>
          <div style={{ width: '4rem', height: '3px', background: 'var(--accent)', margin: '1.5rem 0' }} />
          <p className="prose-text" style={{ maxWidth: '580px' }}>
            La <strong>Stack Overflow Developer Survey 2025</strong> es el termómetro global de la industria del software.
            Con más de <strong>{surveyMetadata.totalResponses.toLocaleString('es-ES')} respuestas</strong> y
            <strong> {surveyMetadata.employedWithSalary.toLocaleString('es-ES')} profesionales con salario declarado</strong>,
            esta edición revela tendencias que desafían la intuición. Hemos seleccionado cuatro preguntas que conectan
            la diversidad técnica, la actitud hacia la IA, la geografía económica y las modalidades de trabajo.
          </p>
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>

          <Section
            number="01"
            title="¿Más herramientas, mejor salario?"
            subtitle="La diversidad tecnológica tiene retornos crecientes... hasta cierto límite"
            note="Salario mediano anual en USD según el número de tecnologías distintas usadas profesionalmente N = 16.655 profesionales con salario declarado."
          >
            <div className="chart-frame">
              <ChartContainer config={CHART_CONFIG} className="h-95 w-full">
                <ResponsiveContainer>
                  <ReBarChart data={toolSalaryData} margin={{ top: 16, right: 24, left: 16, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e4d8" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6a6a60' }} label={{ value: 'Número de herramientas usadas', position: 'bottom', offset: 16, fontSize: 12, fill: '#8a8a80' }} />
                    <YAxis tickFormatter={v => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12, fill: '#6a6a60' }} label={{ value: 'Salario mediano (USD)', angle: -90, position: 'insideLeft', offset: 8, fontSize: 12, fill: '#8a8a80' }} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString('es-ES')}`, 'Mediana']} contentStyle={{ fontSize: 13, border: '1px solid #d8d4c8', background: '#faf8f3' }} />
                    <ReferenceLine y={105000} stroke="#8b3a2a" strokeDasharray="5 3" label={{ value: '← plateau', position: 'right', fontSize: 11, fill: '#8b3a2a', fontStyle: 'italic' }} />
                    <Bar dataKey="salary" fill="var(--color-salary)" name="Salario mediano" barSize={48} radius={[2, 2, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="prose-text" style={{ marginTop: '1rem' }}>
              <p>¿Merece la pena aprender más tecnologías? Los datos muestran una curva en forma de plateau ascendente: el salario mediano crece desde 70.769 USD (1‑5 herramientas) hasta 107.795 USD (26‑50), un aumento del 52%. Sin embargo, el grupo de 51 o más herramientas desciende ligeramente a 105.806 USD y presenta una dispersión enorme (P25=67.579, P75=169.555).</p>
              <p>¿Por qué ocurre esto? Existen dos explicaciones complementarias. Primera, la <strong>teoría del capital humano</strong>: dominar múltiples tecnologías señala adaptabilidad y permite resolver problemas más complejos, lo que se traduce en mayor valor de mercado. Segunda, el <strong>sesgo de experiencia</strong>: los desarrolladores senior han acumulado más herramientas a lo largo de los años, y son ellos quienes ocupan los puestos mejor pagados. Cuando se controla por años de experiencia, parte de la brecha se reduce, pero la forma de la curva se mantiene.</p>
              <p><strong>Conclusión práctica</strong>: la polivalencia es beneficiosa hasta un punto (26‑50 herramientas). A partir de ahí, la acumulación sin especialización no aporta valor adicional. El mito del "full stack" omnisciente no se refleja en los salarios. Las empresas premian la profundidad estratégica, no la colección de técnicas.</p>
            </div>
          </Section>

          <Divider text="Pero el salario no lo es todo. La irrupción de la IA generativa está cambiando la forma de trabajar. ¿Los desarrolladores más versátiles confían más en la IA o, por el contrario, son más críticos?" />

          <Section
            number="02"
            title="A más herramientas, más escepticismo hacia la IA"
            subtitle="La experiencia técnica amplia forja una mirada crítica sobre la exactitud de los modelos"
            note="Distribución de percepciones sobre la exactitud de la IA (AIAcc) según el número de herramientas usadas."
          >
            <div className="chart-frame">
              <ChartContainer config={CHART_CONFIG} className="h-100 w-full">
                <ResponsiveContainer>
                  <ReBarChart data={trustNeutralDistrustData} margin={{ top: 16, right: 24, left: 16, bottom: 48 }} stackOffset="expand">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e4d8" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} label={{ value: 'Número de herramientas', position: 'bottom', offset: 16, fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v*100}%`} tick={{ fontSize: 12 }} label={{ value: '% de desarrolladores', angle: -90, position: 'insideLeft', offset: 8, fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} contentStyle={{ fontSize: 13 }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="trust" stackId="a" fill="var(--color-trust)" name="Confianza" />
                    <Bar dataKey="neutral" stackId="a" fill="var(--color-neutral)" name="Neutral" />
                    <Bar dataKey="distrust" stackId="a" fill="var(--color-distrust)" name="Desconfianza" radius={[2, 2, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="prose-text" style={{ marginTop: '1rem' }}>
              <p>La relación es inversa y robusta: cuantas más herramientas domina un desarrollador, menos confía en la exactitud de la IA. Entre quienes usan 1‑5 tecnologías, el 34,1% confía y el 44,6% desconfía. En el grupo de 51+ herramientas, la confianza cae al 27,3% y la desconfianza se dispara al <strong>62,7%</strong>. La categoría neutral se mantiene estable (en torno al 20%), lo que indica una polarización real, no una simple deriva hacia el centro.</p>
              <p>¿Por qué los más experimentados son los más escépticos? La <strong>hipótesis del desencanto experto</strong> es la más plausible: quienes han trabajado con stacks diversos han utilizado la IA en tareas complejas (refactorización de sistemas heredados, depuración de arquitecturas distribuidas, integración de lenguajes heterogéneos). En esos contextos, los modelos actuales alucinan o cometen errores costosos. En cambio, los perfiles con pocas herramientas suelen probar la IA en tareas repetitivas y bien documentadas, donde el rendimiento es más predecible.</p>
              <p>Lejos de ser una reacción irracional, <strong>el escepticismo es una señal de conocimiento profundo de los límites de la tecnología</strong>. Los directivos que temen que la IA vuelva obsoletos a sus equipos más capaces deberían reconsiderarlo: son precisamente los seniors quienes más alertan sobre sus carencias.</p>
            </div>
          </Section>

          <Divider text="Si la IA divide opiniones según la experiencia, la geografía también divide bolsillos. Pero el salario nominal es un espejismo: cuando ajustamos por el coste de vida, el mapa del talento se reordena por completo." />

          <Section
            number="03"
            title="El espejismo del dólar"
            subtitle="El poder adquisitivo real reordena completamente el mapa del talento tecnológico"
            note="Comparación entre salario mediano nominal (USD) y ajustado por paridad de poder adquisitivo (PPA / Numbeo, EE.UU. = 100). Solo países con ≥ 80 respuestas."
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <button className={`sort-btn ${sortBy === 'nominal' ? 'active' : ''}`} onClick={() => setSortBy('nominal')}>Ordenar por salario nominal</button>
              <button className={`sort-btn ${sortBy === 'adjusted' ? 'active' : ''}`} onClick={() => setSortBy('adjusted')}>Ordenar por poder adquisitivo real</button>
            </div>
            <div className="chart-frame">
              <ChartContainer config={CHART_CONFIG} className="h-125 w-full">
                <ResponsiveContainer>
                  <ReBarChart data={q2Data} layout="vertical" margin={{ left: 16, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={v => `$${Math.round(v / 1000)}k`} />
                    <YAxis type="category" dataKey="name" width={110} />
                    <Tooltip content={<CustomCountryTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="nominal" fill="var(--color-nominal)" name="Nominal (USD)" barSize={14} opacity={0.75} />
                    <Bar dataKey="adjusted" fill="var(--color-adjusted)" name="Ajustado por PPA" barSize={14} radius={[0, 2, 2, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="prose-text" style={{ marginTop: '1rem' }}>
              <p>Si solo nos fijásemos en el salario nominal, Suiza, Estados Unidos (aunque no aparece en la tabla por umbral de respuestas) y Dinamarca serían los destinos soñados. Pero el poder adquisitivo real cambia las reglas del juego. <strong>Israel</strong> pasa a tener la mediana ajustada más alta (159.715 USD), seguido de <strong>Irlanda</strong> (151.852) y <strong>Canadá</strong> (127.016). Suiza cae a la sexta posición.</p>
              <p>¿Qué significa esto para un desarrollador? Que negociar un salario internacional tiene un componente geográfico enorme. Un profesional que trabaja remotamente para una empresa suiza o estadounidense, pero reside en Israel, Irlanda o el este de Europa, puede duplicar su calidad de vida en comparación con vivir en Zúrich o San Francisco. Este fenómeno explica el auge del <strong>nomadismo digital</strong> y la aparición de hubs tecnológicos secundarios (Estonia, Polonia, Portugal) que atraen talento con menor coste de vida pero salarios competitivos.</p>
              <p>Para los empleadores, la lección es clara: la guerra por el talento ya no se libra solo con dólares nominales, sino con el poder adquisitivo real que ofrecen. Las políticas de compensación deben tener en cuenta el coste de vida local si quieren retener a sus equipos remotos.</p>
            </div>
          </Section>

          <Divider text="Hemos visto que la geografía puede multiplicar el poder adquisitivo. ¿Y la modalidad de trabajo? ¿El teletrabajo es realmente la llave hacia salarios más altos?" />

          <Section
            number="04"
            title="El teletrabajo no paga más, selecciona mejor"
            subtitle="La brecha salarial del trabajo remoto desaparece casi por completo al controlar por país y experiencia"
            note="Salario mediano anual (USD) por modalidad laboral (RemoteWork). Muestra global. Las diferencias brutas no controlan por país ni experiencia."
          >
            <div className="chart-frame">
              <ChartContainer config={CHART_CONFIG} className="h-[320px] w-full">
                <ResponsiveContainer>
                  <ReBarChart data={remoteSalaryData} margin={{ top: 16, right: 24, left: 16, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e4d8" />
                    <XAxis dataKey="name" tick={{ fontSize: 13 }} label={{ value: 'Modalidad laboral', position: 'bottom', offset: 16, fontSize: 12 }} />
                    <YAxis tickFormatter={v => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} label={{ value: 'Salario mediano (USD)', angle: -90, position: 'insideLeft', offset: 8, fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString('es-ES')}`, 'Mediana']} contentStyle={{ fontSize: 13 }} />
                    <Bar dataKey="salary" fill="var(--color-salary)" name="Salario mediano" barSize={72} radius={[2, 2, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="prose-text" style={{ marginTop: '1rem' }}>
              <p>A primera vista, el teletrabajo parece un multiplicador salarial espectacular: los desarrolladores remotos ganan un 83% más que los presenciales. Sin embargo, esta estadística es engañosa. Los análisis multivariantes (control por país, experiencia, sector) reducen la brecha al 18% y en muchos modelos deja de ser significativa.</p>
              <p>¿Qué está pasando? El <strong>sesgo de selección</strong>: los perfiles con mayor poder de negociación (seniors con más de 10 años de experiencia, residentes en países de altos ingresos, trabajando para empresas de producto) son precisamente quienes pueden imponer el trabajo remoto como condición. Para un desarrollador junior en India o Brasil, optar por el remoto no le garantiza un salario de Silicon Valley; su salario sigue siendo local. El teletrabajo es una <strong>consecuencia del privilegio laboral, no su causa</strong>.</p>
              <p>El modelo híbrido (77.760 USD) se sitúa en un punto intermedio. Muchas empresas lo utilizan como mecanismo de retención para perfiles que, de otro modo, exigirían remoto total. La brecha entre remoto e híbrido (~8%) podría interpretarse como la prima que los empleadores pagan por la presencialidad parcial.</p>
            </div>
          </Section>

          <div style={{ borderTop: '3px solid var(--ink)', paddingTop: '2.5rem' }}>
            <p className="note-label" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Síntesis</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.75rem' }}>
              Cuatro lecciones para el desarrollador y el empleador
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { n: '01', title: 'La amplitud tecnológica tiene retornos decrecientes.', body: 'El rango óptimo se sitúa entre 26 y 50 herramientas. Acumular más allá de ese punto no mejora el salario mediano y aumenta la dispersión. La especialización estratégica prima sobre la acumulación indiscriminada.' },
                { n: '02', title: 'El experto versátil desconfía más de la IA, con razón.', body: 'La desconfianza crece del 45% al 63% al pasar de 1‑5 a 51+ herramientas. Lejos de ser tecnofobia, es una calibración realista de los límites de la IA basada en la experiencia práctica.' },
                { n: '03', title: 'El mapa del talento se reescribe con paridad de poder adquisitivo.', body: 'Israel e Irlanda ofrecen el mejor poder adquisitivo real para desarrolladores. El nomadismo digital y las políticas públicas pueden redirigir el flujo global de talento hacia países con menor coste de vida pero salarios competitivos.' },
                { n: '04', title: 'El teletrabajo no es un ascenso, es un privilegio.', body: 'La brecha salarial del 83% se evapora casi por completo al controlar por país y experiencia. El remoto es una consecuencia de tener poder de negociación, no una herramienta para crearlo.' },
              ].map(({ n, title, body }) => (
                <div key={n} style={{ display: 'grid', gridTemplateColumns: '2.5rem 1fr', gap: '1rem', alignItems: 'start' }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--rule)' }}>{n}</span>
                  <p className="prose-text"><strong style={{ color: 'var(--ink)' }}>{title}</strong> {body}</p>
                </div>
              ))}
            </div>
            <p className="note-label" style={{ marginTop: '2.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
              Fuente: Stack Overflow Developer Survey 2025 (licencia ODbL). Índices de coste de vida: Numbeo, junio 2025.
              Procesado el {new Date(surveyMetadata.processedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </main>
  );
}

function Section({ number, title, subtitle, note, children }: {
  number: string; title: string; subtitle: string; note: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1rem' }}>
        <span className="section-number">{number}</span>
        <div>
          <h2 className="chart-title">{title}</h2>
          <p className="chart-subtitle">{subtitle}</p>
        </div>
      </div>
      <p className="note-label" style={{ marginBottom: '1rem', paddingLeft: '3.75rem' }}>↳ {note}</p>
      {children}
    </div>
  );
}

function Divider({ text }: { text: string }) {
  return <div className="divider-line">{text}</div>;
}
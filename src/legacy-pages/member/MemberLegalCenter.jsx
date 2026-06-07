import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Lock, Shield, AlertTriangle, Scale, CheckCircle, Eye, ChevronRight, BadgeCheck, Clock, QrCode
} from 'lucide-react';

// ── LEGAL SECTIONS DATA ──────────────────────────────────────────
const LEGAL_SECTIONS = [
  { id: 'aviso-legal', label: 'Aviso Legal', icon: FileText },
  { id: 'terminos', label: 'Términos y Condiciones', icon: Scale },
  { id: 'privacidad', label: 'Privacidad', icon: Lock },
  { id: 'riesgos', label: 'Aviso de Riesgos', icon: AlertTriangle },
  { id: 'aml-kyc', label: 'AML / KYC', icon: Shield },
  { id: 'politica-uso', label: 'Política de Uso', icon: Eye },
  { id: 'codigo-conducta', label: 'Código de Conducta', icon: CheckCircle },
  { id: 'transparencia', label: 'Transparencia', icon: FileText },
  { id: 'contrato-digital', label: 'Contrato Digital', icon: FileText },
];

// ── CONTENT DATA (extracted exactly from website) ──────────────────
const LEGAL_CONTENT = {
  'aviso-legal': {
    title: 'Aviso Legal',
    sections: [
      { heading: '1. Identificación y Naturaleza', content: 'Mindbliss Power es una plataforma digital diseñada para la participación en un ecosistema de servicios financieros, educativos y de desarrollo comunitario. La plataforma es operada bajo regulaciones internacionales y se adhiere a estándares de transparencia, protección de datos y cumplimiento normativo.' },
      { heading: '2. Aceptación de Términos', content: 'Al acceder y utilizar la plataforma Mindbliss Power, aceptas integralmente este aviso legal y todos los términos, condiciones y políticas asociadas. Si no estás de acuerdo con alguna parte, no debes utilizar la plataforma.' },
      { heading: '3. Uso Permitido y Restricciones', content: 'La plataforma está destinada exclusivamente a uso legítimo y legal. Los usuarios se comprometen a no utilizar la plataforma para actividades ilegales o fraudulentas, no acceder sin autorización a sistemas o datos de terceros, no distribuir malware o contenido nocivo, no interferir con la operación normal de la plataforma, y cumplir con todas las leyes aplicables.' },
      { heading: '4. Propiedad Intelectual', content: 'Todo el contenido de la plataforma, incluyendo texto, gráficos, logos, imágenes, software y bases de datos, es propiedad de Mindbliss Power o sus proveedores autorizados. Sin la autorización expresa escrita de Mindbliss Power, los usuarios no pueden reproducir, distribuir, modificar o transmitir cualquier material de la plataforma.' },
      { heading: '5. Limitación de Responsabilidad', content: 'Mindbliss Power proporciona la plataforma "tal como está" sin garantías de ningún tipo, ni expresas ni implícitas. En la medida máxima permitida por la ley, Mindbliss Power no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos.' },
    ]
  },
  'terminos': {
    title: 'Términos y Condiciones',
    sections: [
      { heading: '1. Definiciones', content: '"Plataforma": La aplicación web y servicios digitales operados por Mindbliss Power. "Usuario": Cualquier persona que accede y utiliza la Plataforma. "Participación": La activación formal dentro del ecosistema mediante la aceptación de estos términos.' },
      { heading: '2. Elegibilidad', content: 'Para utilizar la Plataforma debes: Tener al menos 18 años de edad, tener capacidad legal para celebrar un contrato vinculante, no estar restringido por ninguna ley o regulación, proporcionar información precisa y completa en tu registro, y mantener actualizada tu información.' },
      { heading: '3. Registro de Cuenta', content: 'Al registrarte eres responsable de mantener la confidencialidad de tus credenciales, notificar inmediatamente de acceso no autorizado, ser responsable de toda actividad en tu cuenta, y proporcionar información exacta y actualizada.' },
      { heading: '4. Participación Inicial', content: 'La Participación requiere: Aceptación formal de todos los términos, realización de una activación inicial mediante pago, cumplimiento de procedimientos de verificación de identidad (KYC/AML), y confirmación de comprensión de riesgos.' },
      { heading: '5. Naturaleza No Garantizada de Beneficios', content: 'Los usuarios reconocen que los beneficios proyectados no están garantizados, dependen del desarrollo del ecosistema, Mindbliss Power no ofrece garantía de capital o retorno, y los escenarios simulados son proyecciones basadas en supuestos.' },
    ]
  },
  'privacidad': {
    title: 'Política de Privacidad',
    sections: [
      { heading: '1. Introducción', content: 'Mindbliss Power está comprometida con la protección de tu privacidad. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos tu información personal cuando utilizas la Plataforma.' },
      { heading: '2. Información que Recopilamos', content: 'Recopilamos: Información de Registro (nombre, email, teléfono, identificación, dirección, información bancaria). Información de Navegación (IP, tipo de navegador, páginas visitadas, geolocalización). Información de Participación (nivel, historial de transacciones, comunicaciones con soporte, datos de desempeño).' },
      { heading: '3. Uso de Información', content: 'Utilizamos tu información para: Crear y mantener tu cuenta, procesar transacciones, proporcionar soporte, verificar identidad, enviar comunicaciones, mejorar la plataforma, detectar fraude, y cumplir obligaciones legales.' },
      { heading: '4. Protección de Datos', content: 'Implementamos medidas de seguridad incluyendo: Encriptación de datos, acceso restringido, auditorías de seguridad, protocolos de autenticación robustos, y monitoreo de acceso no autorizado.' },
      { heading: '5. Compartir Información', content: 'Compartimos información con: Proveedores de servicios, autoridades regulatorias, proveedores de pago, partes relacionadas, y otros usuarios cuando sea necesario para el funcionamiento del ecosistema.' },
    ]
  },
  'riesgos': {
    title: 'Aviso de Riesgos',
    sections: [
      { heading: '⚠ LECTURA OBLIGATORIA', content: 'Esta sección describe riesgos materiales asociados con la participación. Debes leer cuidadosamente y entender estos riesgos antes de participar.' },
      { heading: '1. Riesgo de Pérdida de Capital', content: 'Tu participación inicial no está garantizada. Existe riesgo material de pérdida parcial o total del capital invertido. Participa solo con fondos que puedas permitirte perder completamente.' },
      { heading: '2. Riesgo Regulatorio y Legal', content: 'El marco regulatorio está en evolución. Cambios regulatorios pueden afectar significativamente la operación y beneficios. Autoridades pueden requerir cambios operacionales, restriccionar servicios, o imponer requisitos adicionales.' },
      { heading: '3. Riesgo de Liquidez', content: 'Tu participación no es fácilmente convertible a efectivo. Los beneficios pueden estar bloqueados o limitados en disponibilidad. Participa solo con fondos que puedas bloquear a largo plazo.' },
      { heading: '4. Riesgo Operacional', content: 'Errores operacionales, fallos tecnológicos o interrupciones de servicio pueden afectar tu acceso. Ningún sistema es completamente inmune a fallos.' },
    ]
  },
  'aml-kyc': {
    title: 'AML / KYC – Cumplimiento Regulatorio',
    sections: [
      { heading: '1. Marco Regulatorio', content: 'Mindbliss Power opera de conformidad con estándares internacionales incluyendo: Recomendaciones del GAFI, regulaciones anti-lavado de dinero (AML), políticas de conozca a su cliente (KYC), procedimientos de debida diligencia mejorada (EDD), y verificación de listas de sanciones.' },
      { heading: '2. Procedimiento KYC', content: 'Todos los usuarios deben completar el proceso KYC antes de participar activamente. Este incluye: Nivel 1 (Verificación Básica), Nivel 2 (Verificación Mejorada), y Nivel 3 (Debida Diligencia Mejorada).' },
      { heading: '3. Procedimiento AML', content: 'Mindbliss Power implementa controles robustos: Monitoreo de Transacciones, Reportes de Transacciones Sospechosas (SAR), Verificación de Listas OFAC, Umbrales de Alerta, y Análisis de Riesgo continuo.' },
      { heading: '4. Fuente de Fondos', content: 'Los usuarios deben proporcionar documentación verificable de la fuente de fondos incluyendo: Extractos bancarios, certificados de ingresos, documentos de herencia, registros de ventas de activos, y otros documentos relevantes.' },
      { heading: '5. Listas de Control Sancionadas', content: 'Mindbliss Power verifica regularmente contra: Lista OFAC, listas de la Unión Europea, listados de Naciones Unidas, listas de países sancionados, y bases de datos de personas políticamente expuestas (PEP).' },
    ]
  },
  'politica-uso': {
    title: 'Política de Uso',
    sections: [
      { heading: '1. Aceptación de Términos', content: 'Al acceder y utilizar la plataforma Mindbliss Power, aceptas esta Política de Uso en su totalidad. Si no estás de acuerdo con alguno de los términos, no debes utilizar la plataforma.' },
      { heading: '2. Conducta de Usuarios', content: 'Los usuarios se comprometen a: Utilizar la plataforma de manera legal y ética, proporcionar información verídica, respetar la propiedad intelectual, no interferir con la plataforma, mantener confidencialidad de credenciales, y cumplir con políticas internas.' },
      { heading: '3. Prohibiciones Expresas', content: 'Se prohíbe: Actividades ilícitas o fraudulentas, compartir credenciales, realizar operaciones no autorizadas, acosar a otros usuarios, publicar contenido ilegal, e intentar eludir medidas de seguridad.' },
      { heading: '4. Responsabilidad del Usuario', content: 'Cada usuario es responsable de sus acciones dentro de la plataforma. Mindbliss Power se reserva el derecho de suspender o terminar cuentas que incumplan esta política.' },
      { heading: '5. Modificaciones', content: 'Mindbliss Power se reserva el derecho de modificar esta Política en cualquier momento. Las modificaciones serán efectivas inmediatamente después de su publicación.' },
    ]
  },
  'codigo-conducta': {
    title: 'Código de Conducta',
    sections: [
      { heading: '1. Principios Fundamentales', content: 'El Código se fundamenta en: Integridad (actúa con honestidad), Responsabilidad (asume responsabilidad), Respeto (trata con dignidad), Cumplimiento (adhiere a leyes), y Diligencia (trabajo profesional).' },
      { heading: '2. Comunicación Responsable', content: 'Debes comunicar responsablemente sobre Mindbliss Power: Proporciona información precisa, no prometas resultados garantizados, presenta contexto completo incluyendo riesgos, utiliza materiales oficiales, y nunca hagas afirmaciones falsas.' },
      { heading: '3. Respeto por Información Oficial', content: 'Todos los participantes deben: Reconocer a Mindbliss Power como única fuente autorizada, no producir información no aprobada, respetar comunicaciones oficiales, corregir información incorrecta, y contactar al equipo sobre dudas.' },
      { heading: '4. Conducta Dentro del Ecosistema', content: 'Debes mantener conducta profesional y ética: Trata a otros con respeto, no hagas afirmaciones discriminatorias, resuelve conflictos profesionalmente, reporta conducta inapropiada, y participa activamente.' },
      { heading: '5. Prohibiciones Explícitas', content: 'Se prohíbe: Fraude, manipulación, discriminación, acoso, actividades ilegales, cibercrimen, lavado de dinero, y financiamiento del terrorismo.' },
    ]
  },
  'transparencia': {
    title: 'Transparencia y Cumplimiento',
    sections: [
      { heading: 'Estructura del Ecosistema', content: 'Mindbliss Power opera como un ecosistema integrado con: Infraestructura tecnológica descentralizada, operación activa con ejecución continua, y marco regulatorio que guía operaciones.' },
      { heading: 'Naturaleza del Modelo', content: 'Los participantes acceden a beneficios basados en su nivel de participación y actividad. El modelo incentiva crecimiento mediante acceso progresivo a servicios. Todos los beneficios mostrados son estimaciones sujetas a evolución del ecosistema.' },
      { heading: 'Proceso Regulatorio', content: 'Mindbliss Power opera bajo marco de cumplimiento activo en proceso de fortalecer posición regulatoria. Implementa: Cumplimiento activo, comunicación con autoridades, obtención de certificaciones, y auditorías periódicas.' },
      { heading: 'Políticas AML/KYC', content: 'Implementamos procedimientos: Verificación de identidad obligatoria, verificación de origen de fondos, monitoreo continuo de actividades, y reportes de actividades sospechosas a autoridades.' },
      { heading: 'Gestión de Riesgos', content: 'Identificamos y manejamos: Riesgo de mercado, riesgo operacional, riesgo regulatorio, riesgo de fraude, y riesgo de liquidez mediante planificación continua.' },
    ]
  },
  'contrato-digital': {
    title: 'Contrato de Membresía, Acceso a Ecosistema Empresarial y Participación en Beneficios',
    isNewContract: true,
    isDynamic: true,
    fullText: `CONTRATO DE MEMBRESÍA, ACCESO A ECOSISTEMA EMPRESARIAL Y PARTICIPACIÓN EN BENEFICIOS

Entre:

MINDBLISS POWER INC, sociedad constituida bajo las leyes del Estado de Massachusetts, Estados Unidos de América, representada por su Presidente, el Sr. GABRIEL RAMON GARCIA LUCERO, en adelante la "COMPAÑÍA";

y

{{USER_FULL_NAME}}, usuario registrado en la plataforma digital, en adelante el "MIEMBRO";

Se celebra el presente contrato bajo los siguientes términos:

---

CLÁUSULA 1 — DEFINICIONES

Para efectos del presente contrato se entenderá por:

• "Membresía": derecho de acceso al ecosistema digital y empresarial.
• "Ecosistema": conjunto de plataformas, herramientas, redes y actividades empresariales gestionadas por la COMPAÑÍA.
• "Beneficios": asignaciones económicas derivadas de la actividad empresarial global.
• "Plataforma": entorno digital de interacción del MIEMBRO.

---

CLÁUSULA 2 — OBJETO

El presente contrato regula el acceso del MIEMBRO al ecosistema de la COMPAÑÍA, así como su participación dentro de las dinámicas operativas, organizativas y de distribución de beneficios.

---

CLÁUSULA 3 — NATURALEZA DE LA MEMBRESÍA

La membresía constituye un derecho de acceso a un sistema tecnológico y empresarial privado, sin que implique:

• participación accionaria
• titularidad sobre activos
• derecho directo sobre proyectos específicos

---

CLÁUSULA 4 — MODELO DE NEGOCIO

La COMPAÑÍA desarrolla actividades empresariales que incluyen, entre otras:

• proyectos inmobiliarios
• desarrollos tecnológicos
• estructuras comerciales
• iniciativas financieras corporativas

Dichas actividades forman parte del patrimonio empresarial y son gestionadas exclusivamente por la COMPAÑÍA.

---

CLÁUSULA 5 — PARTICIPACIÓN EN BENEFICIOS

El MIEMBRO podrá participar en la distribución de beneficios generados por las actividades empresariales, conforme a:

• su actividad dentro del sistema
• su estructura de red
• su contribución al ecosistema
• los criterios internos de la COMPAÑÍA

La participación:

• no es garantizada
• no es fija
• depende del desempeño global

---

CLÁUSULA 6 — SISTEMA DE RED

El ecosistema podrá incluir estructuras organizativas de crecimiento, incluyendo sistemas binarios u otras configuraciones, utilizadas para:

• organización de miembros
• distribución interna de métricas
• asignación de beneficios

---

CLÁUSULA 7 — ACCESO A LA PLATAFORMA

El MIEMBRO tendrá acceso a:

• dashboard de control
• visualización de red
• herramientas de gestión
• módulos de interacción

---

CLÁUSULA 8 — PAGOS Y MEMBRESÍAS

El acceso al ecosistema podrá requerir el pago de membresías en distintos niveles, los cuales determinan:

• nivel de acceso
• alcance operativo
• participación en beneficios

---

CLÁUSULA 9 — RETIROS Y PAGOS (BMP)

La COMPAÑÍA podrá establecer mecanismos de retiro a través de plataformas externas autorizadas.

Para efectos operativos, el MIEMBRO acepta que:

• deberá contar con una cuenta activa en la plataforma designada (ej. Be-Mind Power - BMP)
• los pagos serán procesados mediante los datos proporcionados por el usuario
• la COMPAÑÍA no es responsable por errores en información proporcionada

---

CLÁUSULA 10 — CUMPLIMIENTO AML / KYC

El MIEMBRO acepta que la COMPAÑÍA podrá requerir:

• verificación de identidad
• documentación personal
• validación de datos

con el fin de cumplir estándares internacionales de prevención de:

• lavado de activos (AML)
• financiamiento ilícito

La negativa a proporcionar información podrá limitar el acceso a funciones.

---

CLÁUSULA 11 — PROPIEDAD INTELECTUAL

Todos los elementos del sistema pertenecen a la COMPAÑÍA:

• software
• diseño
• estructura de red
• contenido

Queda prohibida su reproducción o uso externo.

---

CLÁUSULA 12 — CONFIDENCIALIDAD

El MIEMBRO se compromete a no divulgar:

• información interna
• estructuras operativas
• datos del sistema

---

CLÁUSULA 13 — RESPONSABILIDAD DEL MIEMBRO

El MIEMBRO es responsable de:

• uso correcto del sistema
• veracidad de la información
• cumplimiento de normas

---

CLÁUSULA 14 — LIMITACIÓN DE RESPONSABILIDAD

La COMPAÑÍA no será responsable por:

• pérdidas económicas
• expectativas no cumplidas
• uso indebido del sistema

---

CLÁUSULA 15 — TERMINACIÓN

La COMPAÑÍA podrá suspender o cancelar la membresía en caso de:

• incumplimiento
• fraude
• uso indebido

---

CLÁUSULA 16 — MODIFICACIONES

La COMPAÑÍA podrá modificar:

• el modelo operativo
• las condiciones del sistema
• los criterios de distribución

---

CLÁUSULA 17 — JURISDICCIÓN

Este contrato se regirá por las leyes del Estado de Massachusetts, EE.UU.

---

CLÁUSULA 18 — ACEPTACIÓN ELECTRÓNICA

El MIEMBRO acepta el presente contrato mediante:

• registro
• activación de cuenta
• uso de la plataforma

---

ANEXO I — TÉRMINOS Y CONDICIONES WEB

(Integrar versión simplificada para sitio web)

---

ANEXO II — POLÍTICA AML/KYC

(Incluir procedimientos de verificación y cumplimiento)

---

ANEXO III — POLÍTICA DE RETIROS

(Describir uso de BMP como canal operativo)

---

CLÁUSULA FINAL — ACEPTACIÓN Y FORMALIZACIÓN DIGITAL

El presente contrato se considera plenamente aceptado y legalmente vinculante mediante la activación de la cuenta del MIEMBRO dentro de la plataforma digital de la COMPAÑÍA.

La aceptación se realiza a través de:

• registro en la plataforma
• activación de membresía
• uso continuo del sistema

El MIEMBRO reconoce que:

• ha leído el contenido íntegro del contrato
• entiende su alcance jurídico
• acepta las condiciones sin reserva

Este mecanismo constituye una aceptación electrónica válida, equivalente a una firma manuscrita conforme a las normativas aplicables en materia de contratación digital.

---

VALIDACIÓN DEL CONTRATO

Miembro:
Javier Demo MVP — Diamante Negro

ID:
VP-CA-0426-917

Correo:
@javierdemo.mvp

Fecha de Aceptación:
26/04/2026

Estado:
Contrato Activo y Validado

---

"Este contrato ha sido generado automáticamente y validado dentro del sistema de MINDBLISS POWER INC, constituyendo un acuerdo legal entre las partes."`,
  },
};

export default function MemberLegalCenter() {
  const [activeSection, setActiveSection] = useState('aviso-legal');
  const [scrollTop, setScrollTop] = useState(0);

  const currentContent = LEGAL_CONTENT[activeSection];
  const currentSection = LEGAL_SECTIONS.find(s => s.id === activeSection);

  const handleContentScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div style={{ background: '#05070D', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, #080D1C 0%, #05070D 100%)',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <p style={{ color: 'rgba(59,130,246,0.5)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px 0' }}>Control Personal</p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Centro Legal</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>Documentos legales, términos y políticas del ecosistema Mindbliss Power</p>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        {/* Left Sidebar — Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            width: 280, borderRight: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(4,10,22,0.9)',
            padding: '28px 0',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div style={{ paddingLeft: 20, paddingRight: 16 }}>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 16px 0' }}>Documentos</p>

            {LEGAL_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;

              return (
                <motion.button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '10px 12px', marginBottom: 6, borderRadius: 10,
                    background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.05)'}`,
                    color: isActive ? '#93C5FD' : 'rgba(255,255,255,0.4)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 180ms ease',
                    textAlign: 'left',
                  }}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} strokeWidth={1.5} />
                  {section.label}
                  {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Right Content Area */}
        <motion.div
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(to bottom, rgba(8,18,40,0.5), #05070D)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Fade overlays */}
          {scrollTop > 0 && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 32,
              background: 'linear-gradient(to bottom, #05070D, transparent)',
              pointerEvents: 'none', zIndex: 10,
            }} />
          )}

          {/* Content Viewer */}
          <motion.div
            key={activeSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onScroll={handleContentScroll}
            style={{
              flex: 1, overflowY: 'auto', padding: '40px 48px',
              maxWidth: 900,
            }}
          >
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              style={{ marginBottom: 40 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {currentSection && <currentSection.icon size={24} style={{ color: '#3b82f6' }} strokeWidth={1.5} />}
                <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: '-0.4px' }}>
                  {currentContent.title}
                </h2>
              </div>
              <div style={{ height: 1, background: 'rgba(59,130,246,0.15)', borderRadius: 1 }} />
            </motion.div>

            {/* User Contract Validation Badge */}
            {currentContent.isUserContract && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                style={{
                  padding: '20px 24px', borderRadius: 14,
                  background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32,
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <BadgeCheck size={20} style={{ color: '#10B981', flexShrink: 0 }} strokeWidth={1.5} />
                </motion.div>
                <div>
                  <p style={{ color: '#10B981', fontSize: 12, fontWeight: 800, margin: '0 0 2px 0' }}>Contrato Validado</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>Este documento es legal y vinculante</p>
                </div>
              </motion.div>
            )}

            {/* New Contract Full Text with Dynamic User Injection & Integrated Styling */}
            {currentContent.isNewContract && (() => {
              const userData = localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data')) : {};
              const userName = userData.name || 'Usuario';
              const userId = userData.userId || 'N/A';
              const joinDate = userData.joinDate || 'N/A';
              
              // Replace user placeholders in contract
              let processedText = (currentContent.fullText || '').replace(
                '{{USER_FULL_NAME}}',
                userName
              );

              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                  className="contractLegalContainer"
                  style={{
                    maxWidth: 880, margin: '0 auto', padding: '24px 20px',
                    borderRadius: 16,
                    background: 'rgba(10, 15, 25, 0.55)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  {/* Integrated Header with Complete Identity */}
                  <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 16px 0' }}>
                      Contrato Digital
                    </p>
                    
                    {/* Member Identity Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 6px 0' }}>
                          Miembro Activo
                        </p>
                        <p style={{ color: '#60A5FA', fontSize: 12, fontWeight: 700, margin: '0 0 2px 0', letterSpacing: '-0.2px' }}>
                          Javier Demo MVP
                        </p>
                        <p style={{ color: 'rgba(124,58,237,0.8)', fontSize: 10, fontWeight: 600, margin: 0 }}>
                          Diamante Negro
                        </p>
                      </div>
                      
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 6px 0' }}>
                          ID Miembro
                        </p>
                        <p style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>
                          VP-CA-0426-917
                        </p>
                      </div>

                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 6px 0' }}>
                          Fecha de Alta
                        </p>
                        <p style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 700, margin: 0 }}>
                          26/04/2026
                        </p>
                      </div>

                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 6px 0' }}>
                          Correo
                        </p>
                        <p style={{ color: '#60A5FA', fontSize: 11, fontWeight: 600, margin: 0, wordBreak: 'break-all' }}>
                          @javierdemo.mvp
                        </p>
                      </div>
                    </div>

                    {/* Company Representation */}
                    <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 6px 0' }}>
                        Representación Legal
                      </p>
                      <p style={{ color: '#E2E8F0', fontSize: 11, fontWeight: 700, margin: '0 0 2px 0', letterSpacing: '0.2px' }}>
                        MINDBLISS POWER INC
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0 }}>
                        Representado por Gabriel Ramón García Lucero
                      </p>
                    </div>
                  </div>

                  {/* Contract Text with Styled Clauses & Visual Hierarchy */}
                  <div style={{ fontFamily: 'Inter, sans-serif', color: '#CBD5E1', fontSize: '13.5px', lineHeight: 1.75 }}>
                    <style>{`
                      .contractClauseTitle {
                        font-weight: 600;
                        color: #3B82F6;
                        margin-top: 22px;
                        margin-bottom: 8px;
                        font-size: 14px;
                        letter-spacing: 0.2px;
                      }
                      .contractAnexoTitle {
                        font-weight: 700;
                        color: #6366F1;
                        margin-top: 24px;
                        margin-bottom: 10px;
                        font-size: 13.5px;
                        letter-spacing: 0.3px;
                        text-transform: uppercase;
                      }
                      .contractBulletList {
                        margin-left: 20px;
                        margin-bottom: 12px;
                      }
                      .contractBulletList li {
                        color: #CBD5E1;
                        margin-bottom: 6px;
                      }
                    `}</style>

                   {processedText.split('\n\n').map((paragraph, idx) => {
                      const trimmed = paragraph.trim();
                      const isClauseTitle = /^CLÁUSULA \d+/.test(trimmed);
                      const isAnexoTitle = /^ANEXO/.test(trimmed);
                      const isBetweenBlock = /^Entre:/.test(trimmed) || /^y$/.test(trimmed) || /^Se celebra/.test(trimmed);

                      return (
                        <div
                          key={idx}
                          style={{
                            marginBottom: isClauseTitle || isAnexoTitle ? 14 : 12,
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                          }}
                        >
                          {isClauseTitle ? (
                            <div className="contractClauseTitle">{trimmed}</div>
                          ) : isAnexoTitle ? (
                            <div className="contractAnexoTitle">{trimmed}</div>
                          ) : isBetweenBlock ? (
                            <div style={{ color: '#9CA3AF', fontSize: '12.5px', fontWeight: 500, marginBottom: 12 }}>
                              {trimmed}
                            </div>
                          ) : (
                            <div style={{ color: '#CBD5E1' }}>{trimmed}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legal Closure & Validation Footer */}
                  <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid rgba(59,130,246,0.12)' }}>
                    <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ color: 'rgba(59,130,246,0.6)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px 0' }}>
                        Validación del Contrato
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        {[
                          { label: 'Miembro', value: 'Javier Demo MVP — Diamante Negro' },
                          { label: 'ID', value: 'VP-CA-0426-917' },
                          { label: 'Correo', value: '@javierdemo.mvp' },
                          { label: 'Fecha de Aceptación', value: '26/04/2026' },
                          { label: 'Estado', value: 'Contrato Activo y Validado', highlight: true },
                        ].map((item, i) => (
                          <div key={i}>
                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 4px 0' }}>
                              {item.label}
                            </p>
                            <p style={{ color: item.highlight ? '#10B981' : '#E2E8F0', fontSize: 11, fontWeight: item.highlight ? 700 : 600, margin: 0, wordBreak: 'break-word' }}>
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '16px 18px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)' }}>
                      <p style={{ color: '#93C5FD', fontSize: 10, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
                        "Este contrato ha sido generado automáticamente y validado dentro del sistema de MINDBLISS POWER INC, constituyendo un acuerdo legal entre las partes."
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Original Content Sections (for other documents) */}
            {!currentContent.isNewContract && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {currentContent.sections.map((section, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + idx * 0.04 }}
                  >
                    <h3 style={{ color: '#93C5FD', fontSize: 14, fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '0.2px' }}>
                      {section.heading}
                    </h3>
                    <p style={{
                      color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: 0,
                      lineHeight: 1.8, letterSpacing: '0.3px',
                    }}>
                      {section.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Digital Signature Section (User Contract Only) */}
            {currentContent.isUserContract && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  marginTop: 40, padding: '32px',
                  background: 'linear-gradient(135deg, #080D1C 0%, #0C1230 100%)',
                  border: '1px solid rgba(59,130,246,0.18)',
                  borderRadius: 16,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(59,130,246,0.05)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 20px 0' }}>Firma Digital</p>

                  {/* Signature Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
                    {/* User Signature */}
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuario</p>
                      <div style={{
                        padding: '24px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)',
                        minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <p style={{ fontFamily: 'cursive', fontSize: 24, color: '#3b82f6', margin: 0, fontWeight: 300 }}>J. Demo MVP</p>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: '8px 0 0 0' }}>Firmado digitalmente</p>
                    </div>

                    {/* Vicion Signature */}
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mindbliss Power</p>
                      <div style={{
                        padding: '24px', borderRadius: 10,
                        background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.18)',
                        minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <p style={{ fontFamily: 'cursive', fontSize: 20, color: '#7C3AED', margin: 0, fontWeight: 300 }}>Mindbliss Power</p>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: '8px 0 0 0' }}>Autoridad certificante</p>
                    </div>
                  </div>

                  {/* Timestamp & Status */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                    {[
                      { label: 'Timestamp', value: '26/04/2026 14:32:48 UTC', icon: Clock },
                      { label: 'Estado', value: 'Activo', icon: CheckCircle, color: '#10B981' },
                      { label: 'Validación QR', value: 'VP-CA-0426-917', icon: QrCode },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} style={{
                          padding: '12px', borderRadius: 9,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Icon size={12} style={{ color: item.color || '#3b82f6' }} strokeWidth={1.5} />
                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>{item.label}</p>
                          </div>
                          <p style={{ color: item.color || '#93C5FD', fontSize: 11, fontWeight: 700, margin: 0 }}>{item.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legal footer */}
                  <div style={{
                    padding: '12px 16px', borderRadius: 9,
                    background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)',
                  }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0, lineHeight: 1.6 }}>
                      Este contrato es vinculante conforme a leyes aplicables. Ambas partes aceptan términos completos. Válido indefinidamente a menos que sea terminado conforme a procedimientos legales establecidos.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bottom spacing */}
            <div style={{ height: 40 }} />
          </motion.div>

          {/* Bottom fade */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
            background: 'linear-gradient(to top, #05070D, transparent)',
            pointerEvents: 'none',
          }} />
        </motion.div>

      </div>

      {/* Footer info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          padding: '12px 32px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(4,10,22,0.6)',
          fontSize: 10, color: 'rgba(255,255,255,0.2)',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          Centro Legal · Documentación oficial · No descargable · Solo lectura
        </div>
      </motion.div>

    </div>
  );
}
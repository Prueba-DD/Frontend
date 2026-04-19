import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '18 de abril de 2026';

export default function PoliticaPrivacidad() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Navegación */}
      <Link
        to="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-400 transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Volver a configuración
      </Link>

      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <ShieldCheck size={20} className="text-green-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Política de Privacidad</h1>
      </div>
      <p className="text-sm text-gray-500 mb-8">Última actualización: {LAST_UPDATED}</p>

      {/* Contenido */}
      <div className="space-y-8 text-sm text-gray-300 leading-relaxed">

        {/* 1 */}
        <Section title="1. Introducción">
          <p>
            Bienvenido a <Strong>GreenAlert</Strong> («nosotros», «nuestro», «la Plataforma»).
            Nos comprometemos a proteger tu privacidad y a manejar tus datos personales de forma
            transparente, segura y conforme a la legislación vigente en materia de protección de datos.
          </p>
          <p>
            Esta Política de Privacidad explica qué información recopilamos, cómo la utilizamos,
            con quién la compartimos y cuáles son tus derechos como usuario de la plataforma de
            monitoreo ambiental ciudadano.
          </p>
        </Section>

        {/* 2 */}
        <Section title="2. Responsable del tratamiento">
          <p>
            El responsable del tratamiento de los datos personales es el equipo de desarrollo de
            GreenAlert, plataforma de monitoreo ambiental ciudadano. Para cualquier consulta
            relacionada con esta política puedes contactarnos a:
          </p>
          <InfoBox>
            Correo electrónico: <Strong>greenalert.webcomany@gmail.com</Strong>
          </InfoBox>
        </Section>

        {/* 3 */}
        <Section title="3. Datos que recopilamos">
          <p>Recopilamos las siguientes categorías de información:</p>

          <SubSection title="3.1 Datos proporcionados directamente por ti">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><Strong>Datos de registro:</Strong> nombre, apellido, correo electrónico y contraseña (almacenada de forma cifrada con bcrypt).</li>
              <li><Strong>Datos de perfil:</Strong> información adicional que decidas añadir a tu perfil público.</li>
              <li><Strong>Reportes ambientales:</Strong> título, descripción, categoría de riesgo, nivel de severidad y ubicación geográfica (latitud y longitud).</li>
              <li><Strong>Evidencias:</Strong> fotografías e imágenes que adjuntes como respaldo visual de tus reportes.</li>
              <li><Strong>Comentarios de moderación:</Strong> observaciones realizadas durante el proceso de revisión de reportes.</li>
            </ul>
          </SubSection>

          <SubSection title="3.2 Datos recopilados automáticamente">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><Strong>Datos de sesión:</Strong> tokens de autenticación (JWT) para gestionar tu acceso seguro.</li>
              <li><Strong>Datos de verificación:</Strong> códigos OTP enviados a tu correo electrónico para confirmar tu identidad.</li>
              <li><Strong>Datos técnicos:</Strong> dirección IP, tipo de navegador, sistema operativo y registros de actividad necesarios para la seguridad del sistema.</li>
            </ul>
          </SubSection>

          <SubSection title="3.3 Datos de geolocalización">
            <p>
              Cuando creas un reporte, puedes proporcionar una ubicación geográfica (coordenadas GPS).
              Esta información es esencial para el propósito de monitoreo ambiental y se muestra en el
              mapa público de reportes. <Strong>No rastreamos tu ubicación en segundo plano</Strong> —
              la geolocalización solo se utiliza cuando tú la proporcionas activamente al crear un reporte.
            </p>
          </SubSection>
        </Section>

        {/* 4 */}
        <Section title="4. Finalidad del tratamiento">
          <p>Utilizamos tus datos personales para los siguientes fines:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><Strong>Gestión de cuenta:</Strong> creación, autenticación, verificación de correo electrónico y mantenimiento de tu cuenta.</li>
            <li><Strong>Funcionalidad de la plataforma:</Strong> recibir, almacenar, moderar y visualizar reportes ambientales ciudadanos.</li>
            <li><Strong>Comunicaciones:</Strong> envío de correos de bienvenida, verificación OTP, notificaciones de cambio de estado de reportes y resúmenes periódicos (si los activas).</li>
            <li><Strong>Moderación:</Strong> revisión de contenido para garantizar la veracidad y calidad de los reportes.</li>
            <li><Strong>Seguridad:</Strong> prevención de fraude, detección de accesos no autorizados y protección de la integridad del sistema.</li>
            <li><Strong>Mejora del servicio:</Strong> estadísticas agregadas y anónimas para mejorar la experiencia del usuario.</li>
          </ul>
        </Section>

        {/* 5 */}
        <Section title="5. Base legal del tratamiento">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><Strong>Consentimiento:</Strong> al registrarte y utilizar la plataforma, otorgas tu consentimiento para el tratamiento descrito.</li>
            <li><Strong>Ejecución contractual:</Strong> el tratamiento es necesario para prestarte el servicio de monitoreo ambiental.</li>
            <li><Strong>Interés legítimo:</Strong> para garantizar la seguridad de la plataforma y prevenir usos indebidos.</li>
            <li><Strong>Obligación legal:</Strong> cuando la ley nos exija conservar o revelar ciertos datos.</li>
          </ul>
        </Section>

        {/* 6 */}
        <Section title="6. Compartición de datos">
          <p>
            <Strong>No vendemos ni alquilamos tus datos personales a terceros.</Strong> Solo
            compartimos información en los siguientes casos:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><Strong>Datos públicos de reportes:</Strong> la ubicación, categoría, severidad y descripción de los reportes ambientales son visibles para todos los usuarios de la plataforma como parte de su naturaleza pública y ciudadana.</li>
            <li><Strong>Proveedores de servicio:</Strong> utilizamos servicios de terceros para el envío de correos electrónicos (servicio de email) y almacenamiento de archivos. Estos proveedores solo acceden a los datos estrictamente necesarios para prestar su servicio.</li>
            <li><Strong>Requerimiento legal:</Strong> podemos divulgar información si así lo requiere una orden judicial, requerimiento gubernamental o para proteger derechos legales.</li>
            <li><Strong>Autoridades ambientales:</Strong> los datos agregados y anónimos de reportes pueden compartirse con autoridades competentes para facilitar la acción ambiental, sin revelar datos personales.</li>
          </ul>
        </Section>

        {/* 7 */}
        <Section title="7. Seguridad de los datos">
          <p>Implementamos medidas técnicas y organizativas para proteger tu información:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Contraseñas cifradas con <Strong>bcrypt</Strong> (nunca se almacenan en texto plano).</li>
            <li>Autenticación basada en <Strong>JSON Web Tokens (JWT)</Strong> con expiración controlada.</li>
            <li>Verificación de identidad mediante <Strong>códigos OTP</Strong> por correo electrónico.</li>
            <li>Comunicaciones cifradas mediante <Strong>HTTPS/TLS</Strong>.</li>
            <li>Validación y sanitización de todos los datos de entrada para prevenir inyecciones y ataques XSS.</li>
            <li>Control de acceso basado en roles (ciudadano, moderador, administrador).</li>
            <li>Límites de tamaño y tipo en la carga de archivos (imágenes).</li>
          </ul>
          <p>
            A pesar de nuestras medidas, ningún sistema es 100% infalible. Si detectamos una brecha
            de seguridad que afecte tus datos, te notificaremos a la mayor brevedad posible.
          </p>
        </Section>

        {/* 8 */}
        <Section title="8. Conservación de datos">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><Strong>Datos de cuenta:</Strong> se conservan mientras tu cuenta esté activa. Si solicitas la eliminación, borraremos tus datos en un plazo máximo de 30 días.</li>
            <li><Strong>Reportes:</Strong> los reportes ambientales se conservan de forma indefinida como registro histórico de monitoreo ambiental, incluso tras la eliminación de la cuenta, aunque se disocian de tu identidad.</li>
            <li><Strong>Códigos OTP:</Strong> tienen una validez de 10 minutos y se eliminan automáticamente después de su uso o expiración.</li>
            <li><Strong>Registros de seguridad:</Strong> se conservan por un período máximo de 12 meses.</li>
          </ul>
        </Section>

        {/* 9 */}
        <Section title="9. Tus derechos">
          <p>Como usuario de GreenAlert, tienes los siguientes derechos sobre tus datos personales:</p>
          <div className="grid gap-3 mt-3">
            <RightItem emoji="📋" title="Acceso" desc="Solicitar una copia de los datos personales que tenemos sobre ti." />
            <RightItem emoji="✏️" title="Rectificación" desc="Corregir datos inexactos o incompletos desde tu perfil o contactándonos." />
            <RightItem emoji="🗑️" title="Supresión" desc="Solicitar la eliminación de tu cuenta y datos personales asociados." />
            <RightItem emoji="⏸️" title="Limitación" desc="Solicitar la restricción temporal del tratamiento de tus datos." />
            <RightItem emoji="📦" title="Portabilidad" desc="Recibir tus datos en un formato estructurado y legible por máquina." />
            <RightItem emoji="🚫" title="Oposición" desc="Oponerte al tratamiento de tus datos para finalidades específicas." />
            <RightItem emoji="🔔" title="Revocación" desc="Retirar tu consentimiento en cualquier momento sin afectar la licitud del tratamiento previo." />
          </div>
          <p className="mt-3">
            Para ejercer cualquiera de estos derechos, contacta a{' '}
            <Strong>privacidad@greenalert.app</Strong>. Responderemos en un plazo máximo de 30 días.
          </p>
        </Section>

        {/* 10 */}
        <Section title="10. Cookies y tecnologías similares">
          <p>
            GreenAlert utiliza <Strong>almacenamiento local del navegador</Strong> (localStorage) para
            mantener tu sesión activa mediante tokens de autenticación. No utilizamos cookies de
            seguimiento, rastreo publicitario ni herramientas de analítica de terceros.
          </p>
        </Section>

        {/* 11 */}
        <Section title="11. Menores de edad">
          <p>
            GreenAlert no está dirigida a menores de 13 años. No recopilamos intencionadamente datos
            de menores de dicha edad. Si descubrimos que hemos recopilado datos de un menor sin el
            consentimiento de sus padres o tutores, procederemos a eliminarlos.
          </p>
        </Section>

        {/* 12 */}
        <Section title="12. Cambios en esta política">
          <p>
            Nos reservamos el derecho de actualizar esta Política de Privacidad. Cuando realicemos
            cambios sustanciales:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Publicaremos la versión actualizada en esta misma página.</li>
            <li>Actualizaremos la fecha de «Última actualización».</li>
            <li>Si los cambios son significativos, te notificaremos mediante un aviso en la plataforma o por correo electrónico.</li>
          </ul>
          <p>
            Te recomendamos revisar esta política periódicamente. El uso continuado de la plataforma
            después de la publicación de cambios constituye la aceptación de los mismos.
          </p>
        </Section>

        {/* 13 */}
        <Section title="13. Contacto">
          <p>
            Si tienes preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad
            o con el tratamiento de tus datos personales, puedes contactarnos en:
          </p>
          <InfoBox>
            <p>📧 <Strong>greenalert.webcomany@gmail.com</Strong></p>
            <p className="mt-1">🌐 <Strong>greenalert.app</Strong></p>
          </InfoBox>
        </Section>

      </div>
    </div>
  );
}

/* ── Componentes auxiliares de maquetación ─────────────────────────────────── */

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SubSection({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-200 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Strong({ children }) {
  return <span className="text-white font-medium">{children}</span>;
}

function InfoBox({ children }) {
  return (
    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 text-sm text-gray-300">
      {children}
    </div>
  );
}

function RightItem({ emoji, title, desc }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-800">
      <span className="text-base mt-0.5">{emoji}</span>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '18 de abril de 2026';

export default function TerminosCondiciones() {
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
          <FileText size={20} className="text-green-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Términos y Condiciones</h1>
      </div>
      <p className="text-sm text-gray-500 mb-8">Última actualización: {LAST_UPDATED}</p>

      {/* Contenido */}
      <div className="space-y-8 text-sm text-gray-300 leading-relaxed">

        {/* 1 */}
        <Section title="1. Aceptación de los términos">
          <p>
            Al acceder, registrarte o utilizar <Strong>GreenAlert</Strong> («la Plataforma», «el
            Servicio»), aceptas cumplir y quedar vinculado por estos Términos y Condiciones.
            Si no estás de acuerdo con alguno de estos términos, no debes usar la Plataforma.
          </p>
          <p>
            El uso continuado de GreenAlert tras la publicación de modificaciones constituye
            la aceptación de dichos cambios.
          </p>
        </Section>

        {/* 2 */}
        <Section title="2. Descripción del servicio">
          <p>
            GreenAlert es una plataforma de <Strong>monitoreo ambiental ciudadano</Strong> que
            permite a los usuarios:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Crear reportes sobre incidencias ambientales (contaminación, deforestación, incendios, deslizamientos, etc.).</li>
            <li>Adjuntar evidencias fotográficas y ubicación geográfica precisa.</li>
            <li>Visualizar reportes en un mapa interactivo en tiempo real.</li>
            <li>Participar en el proceso de verificación y moderación ciudadana.</li>
            <li>Recibir notificaciones sobre el estado de sus reportes.</li>
          </ul>
          <p>
            La Plataforma se ofrece «tal cual» y «según disponibilidad», sin garantías de
            disponibilidad ininterrumpida.
          </p>
        </Section>

        {/* 3 */}
        <Section title="3. Registro y cuenta de usuario">
          <SubSection title="3.1 Requisitos">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Debes ser mayor de 13 años para usar GreenAlert.</li>
              <li>Debes proporcionar información veraz, precisa y actualizada al registrarte.</li>
              <li>Cada persona puede tener una sola cuenta activa.</li>
            </ul>
          </SubSection>

          <SubSection title="3.2 Seguridad de la cuenta">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Eres responsable de mantener la confidencialidad de tus credenciales.</li>
              <li>Debes notificarnos inmediatamente si detectas un uso no autorizado de tu cuenta.</li>
              <li>Tu contraseña debe cumplir con los requisitos mínimos de seguridad (8 caracteres, mayúscula, minúscula, número y carácter especial).</li>
              <li>GreenAlert no es responsable de pérdidas derivadas del uso no autorizado de tu cuenta.</li>
            </ul>
          </SubSection>

          <SubSection title="3.3 Verificación de correo electrónico">
            <p>
              Para acceder a todas las funcionalidades de la plataforma, es necesario verificar tu
              dirección de correo electrónico mediante el código OTP que te enviamos. Hasta completar
              la verificación, algunas funciones pueden estar restringidas.
            </p>
          </SubSection>
        </Section>

        {/* 4 */}
        <Section title="4. Roles y permisos">
          <p>GreenAlert opera con un sistema de roles que determina los permisos de cada usuario:</p>
          <div className="grid gap-3 mt-3">
            <RoleItem
              role="Ciudadano"
              desc="Puede crear y ver reportes, adjuntar evidencias, editar sus propios reportes en estado pendiente y gestionar su perfil."
            />
            <RoleItem
              role="Moderador"
              desc="Además de las funciones de ciudadano, puede revisar, aprobar, rechazar y solicitar correcciones en reportes de otros usuarios."
            />
            <RoleItem
              role="Administrador"
              desc="Acceso completo a la plataforma, incluyendo gestión de usuarios, categorías de riesgo, panel administrativo y moderación."
            />
          </div>
          <p className="mt-3">
            Los roles son asignados por los administradores de la plataforma. No es posible auto-asignarse
            un rol superior.
          </p>
        </Section>

        {/* 5 */}
        <Section title="5. Contenido del usuario">
          <SubSection title="5.1 Propiedad">
            <p>
              Conservas todos los derechos de propiedad intelectual sobre el contenido que publicas
              (textos, imágenes, ubicaciones). Al publicar contenido en GreenAlert, nos otorgas una
              <Strong> licencia no exclusiva, mundial, gratuita y sublicenciable</Strong> para usar,
              mostrar, reproducir y distribuir dicho contenido dentro de la Plataforma con fines de
              monitoreo ambiental.
            </p>
          </SubSection>

          <SubSection title="5.2 Responsabilidad del contenido">
            <p>Eres el único responsable del contenido que publicas. Te comprometes a:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Publicar información <Strong>veraz y verificable</Strong> sobre incidencias ambientales reales.</li>
              <li>No publicar contenido falso, engañoso o malintencionado.</li>
              <li>No subir imágenes que contengan material ilegal, ofensivo, violento o que vulnere derechos de terceros.</li>
              <li>No utilizar la plataforma para difamar, acosar o amenazar a personas u organizaciones.</li>
              <li>No crear reportes duplicados o spam.</li>
            </ul>
          </SubSection>

          <SubSection title="5.3 Moderación">
            <p>
              Todos los reportes están sujetos a un proceso de moderación. El equipo de GreenAlert
              se reserva el derecho de:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Aprobar, rechazar o solicitar correcciones a cualquier reporte.</li>
              <li>Modificar la categoría de riesgo o severidad si se considera necesario.</li>
              <li>Eliminar contenido que viole estos términos sin previo aviso.</li>
              <li>Añadir comentarios de moderación con observaciones o requerimientos.</li>
            </ul>
          </SubSection>
        </Section>

        {/* 6 */}
        <Section title="6. Conducta del usuario">
          <p>Al utilizar GreenAlert te comprometes a <Strong>NO</Strong>:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Intentar acceder a cuentas, datos o áreas restringidas de otros usuarios.</li>
            <li>Utilizar bots, scrapers u otras herramientas automatizadas para extraer datos de la Plataforma.</li>
            <li>Interferir con el funcionamiento normal del servicio (ataques DDoS, inyecciones, etc.).</li>
            <li>Suplantar la identidad de otra persona o entidad.</li>
            <li>Utilizar la plataforma con fines comerciales sin autorización expresa.</li>
            <li>Eludir o intentar eludir las medidas de seguridad o moderación de la Plataforma.</li>
            <li>Compartir tu cuenta o credenciales con terceros.</li>
          </ul>
        </Section>

        {/* 7 */}
        <Section title="7. Reportes ambientales">
          <SubSection title="7.1 Creación de reportes">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Los reportes deben estar relacionados con incidencias ambientales reales.</li>
              <li>La ubicación proporcionada debe corresponder al lugar real de la incidencia.</li>
              <li>Las evidencias fotográficas deben ser propias o contar con autorización para su uso.</li>
              <li>Se aceptan imágenes en formato JPEG, PNG y WebP con un tamaño máximo definido por la plataforma.</li>
            </ul>
          </SubSection>

          <SubSection title="7.2 Edición y estados">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Solo puedes editar tus propios reportes cuando se encuentren en estado <Strong>«Pendiente»</Strong>.</li>
              <li>Una vez que un reporte pasa a estado «En revisión», «Verificado» o «Resuelto», no podrá ser editado por el creador.</li>
              <li>Los moderadores y administradores pueden cambiar el estado de los reportes en cualquier momento.</li>
            </ul>
          </SubSection>

          <SubSection title="7.3 Naturaleza pública">
            <p>
              Los reportes ambientales son <Strong>de naturaleza pública</Strong>. Cualquier persona
              (registrada o no) puede ver los reportes, su ubicación, categoría, severidad y
              descripción en el mapa y listado de reportes. Tu nombre como autor puede ser visible
              según la configuración de la plataforma.
            </p>
          </SubSection>
        </Section>

        {/* 8 */}
        <Section title="8. Propiedad intelectual">
          <p>
            El diseño, código fuente, logotipos, marcas, estructura y contenido original de
            GreenAlert son propiedad del equipo de GreenAlert y están protegidos por las leyes
            de propiedad intelectual aplicables.
          </p>
          <p>
            No se te concede ningún derecho sobre la propiedad intelectual de GreenAlert más allá
            de lo necesario para el uso normal de la Plataforma.
          </p>
        </Section>

        {/* 9 */}
        <Section title="9. Limitación de responsabilidad">
          <InfoBox>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>GreenAlert no garantiza la veracidad, exactitud o completitud de los reportes creados por los usuarios.</li>
              <li>No somos responsables de las acciones o inacciones de autoridades ambientales u otras entidades basadas en la información de la plataforma.</li>
              <li>No garantizamos la disponibilidad continua e ininterrumpida del servicio.</li>
              <li>No somos responsables de daños directos, indirectos, incidentales o consecuentes derivados del uso de la Plataforma.</li>
              <li>La información ambiental proporcionada no sustituye la asesoría profesional ni los informes técnicos oficiales.</li>
            </ul>
          </InfoBox>
        </Section>

        {/* 10 */}
        <Section title="10. Suspensión y terminación">
          <p>
            Nos reservamos el derecho de suspender o cancelar tu cuenta, temporal o permanentemente,
            si:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Violas estos Términos y Condiciones.</li>
            <li>Publicas contenido falso, malintencionado o que vulnere derechos de terceros de forma reiterada.</li>
            <li>Intentas comprometer la seguridad o funcionamiento de la Plataforma.</li>
            <li>No verificas tu correo electrónico tras un período prolongado.</li>
          </ul>
          <p>
            Tú también puedes solicitar la eliminación de tu cuenta en cualquier momento desde la
            sección de Configuración. La eliminación es irreversible y conlleva la pérdida de todos
            tus datos según lo descrito en nuestra{' '}
            <Link to="/privacidad" className="text-green-400 hover:text-green-300 underline underline-offset-2">
              Política de Privacidad
            </Link>.
          </p>
        </Section>

        {/* 11 */}
        <Section title="11. Modificaciones de los términos">
          <p>
            GreenAlert se reserva el derecho de modificar estos Términos y Condiciones en cualquier
            momento. Cuando realicemos cambios significativos:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Actualizaremos la fecha de «Última actualización» en la parte superior.</li>
            <li>Te notificaremos mediante un aviso visible en la Plataforma o por correo electrónico.</li>
            <li>Te daremos un plazo razonable para revisar los cambios antes de que entren en vigor.</li>
          </ul>
        </Section>

        {/* 12 */}
        <Section title="12. Legislación aplicable y resolución de disputas">
          <p>
            Estos Términos y Condiciones se rigen por las leyes aplicables en la jurisdicción donde
            opera GreenAlert. Cualquier controversia derivada del uso de la Plataforma se resolverá
            preferentemente mediante negociación directa. En caso de no alcanzar acuerdo, las partes
            se someterán a los tribunales competentes de dicha jurisdicción.
          </p>
        </Section>

        {/* 13 */}
        <Section title="13. Disposiciones generales">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><Strong>Acuerdo completo:</Strong> estos términos, junto con la Política de Privacidad, constituyen el acuerdo completo entre tú y GreenAlert.</li>
            <li><Strong>Divisibilidad:</Strong> si alguna cláusula resulta nula o inaplicable, las restantes seguirán vigentes.</li>
            <li><Strong>No renuncia:</Strong> el hecho de no ejercer un derecho no constituye renuncia al mismo.</li>
            <li><Strong>Cesión:</Strong> no puedes ceder tus derechos u obligaciones bajo estos términos sin nuestro consentimiento previo por escrito.</li>
          </ul>
        </Section>

        {/* 14 */}
        <Section title="14. Contacto">
          <p>
            Si tienes preguntas o comentarios sobre estos Términos y Condiciones, contáctanos en:
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

function RoleItem({ role, desc }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-800">
      <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-white">{role}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

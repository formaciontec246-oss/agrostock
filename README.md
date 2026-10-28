#  AgroStock — Gestor de Inventario Agrícola

Aplicación web serverless desarrollada como proyecto de transferencia para el SENA. Permite a los pequeños productores agrícolas controlar sus insumos (semillas, fertilizantes, herramientas, etc.) de forma privada y segura.

##  Demo en vivo


##  Problema que resuelve
Los pequeños productores no llevan un control riguroso de sus insumos, lo que genera compras duplicadas, pérdidas por vencimiento y desabastecimiento en momentos críticos de siembra.

##  Tecnologías y Servicios Implementados
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla, ES Modules).
- **Backend Serverless:** Firebase.
  - **Cloud Firestore (Núcleo):** Base de datos NoSQL para el CRUD de productos.
  - **Firebase Authentication (Opción A):** Registro e inicio de sesión con correo/contraseña. Los datos se aíslan mediante el `uidAutor` para que cada usuario vea solo su inventario.
  - **Firebase SDK v10 (Modular):** Conexión e inicialización vía CDN (`initializeApp`).

##  Modelo de Datos (Firestore)
Colección: `productos`
- `nombre` (String): Nombre del insumo.
- `cantidad` (Number): Stock actual (alerta en rojo si es menor a 5).
- `categoria` (String): Semillas, Fertilizantes, Herramientas, etc.
- `uidAutor` (String): UID del usuario creador (para privacidad).
- `creadoEn` (Timestamp): Fecha de creación.

##  Funcionalidades
-  Registro e inicio de sesión seguro.
- Crear, Leer, Editar y Eliminar productos.
- Filtro por categoría.
- Alerta visual de stock bajo (< 5 unidades).
- Persistencia de sesión.
- Diseño responsive (adaptable a móviles).

## 👤 Autor
José — Tecnología en Análisis y Desarrollo de Software Complejo
Centro Tecnológico Para la Gestión Agroempresarial - SENA 2026
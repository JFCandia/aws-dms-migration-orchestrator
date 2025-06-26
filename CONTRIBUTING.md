# 🤝 Contributing to AWS DMS Migration Orchestrator

¡Gracias por tu interés en contribuir a este proyecto! Este documento te guiará a través del proceso de contribución.

## 📋 Código de Conducta

Este proyecto sigue el [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). Al participar, se espera que mantengas un ambiente respetuoso y constructivo.

## 🚀 Cómo Contribuir

### 1. Fork del Repositorio

```bash
# Fork en GitHub, luego clona tu fork
git clone https://github.com/tu-usuario/migrador-dms.git
cd migrador-dms
git remote add upstream https://github.com/jcandia-sbad/migrador-dms.git
```

### 2. Configurar Entorno de Desarrollo

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar tests para verificar setup
npm test
```

### 3. Crear Rama Feature

```bash
# Crear rama desde main
git checkout main
git pull upstream main
git checkout -b feature/descripcion-del-feature

# O para bugfix
git checkout -b bugfix/descripcion-del-bug
```

### 4. Desarrollo

#### Estilo de Código
- **ESLint**: Seguir configuración en `.eslintrc`
- **Prettier**: Formateo automático
- **JSDoc**: Documentar funciones públicas
- **Conventional Commits**: Mensajes de commit estructurados

```bash
# Verificar estilo
npm run lint

# Fix automático
npm run lint:fix
```

#### Testing
- **Unit Tests**: Para lógica de negocio
- **Integration Tests**: Para interacciones AWS
- **Simulation Tests**: Para flows completos sin AWS

```bash
# Ejecutar todos los tests
npm test

# Tests específicos
npm run test:unit
npm run test:simulation

# Coverage
npm test -- --coverage
```

### 5. Commit y Push

```bash
# Commits siguiendo Conventional Commits
git add .
git commit -m "feat: añadir nueva funcionalidad de monitoreo"

# Push a tu fork
git push origin feature/descripcion-del-feature
```

### 6. Pull Request

1. Ve a GitHub y crea un Pull Request
2. Describe los cambios realizados
3. Incluye tests para nuevas funcionalidades
4. Actualiza documentación si es necesario

## 📝 Guidelines

### Estructura de Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formateo, espacios, etc.
refactor: refactorización de código
test: añadir o corregir tests
chore: mantenimiento, deps, etc.
```

Ejemplos:
```bash
feat(lambda): añadir función de validación avanzada
fix(monitor): corregir cálculo de métricas de progreso
docs(readme): actualizar guía de instalación
test(orchestrator): añadir tests para manejo de errores
```

### Estructura de Branch

```
main                    # Producción
├── develop            # Desarrollo
├── feature/xxx        # Nuevas funcionalidades
├── bugfix/xxx         # Corrección de bugs
├── hotfix/xxx         # Fixes urgentes para producción
└── release/x.x.x      # Preparación de releases
```

### Testing Guidelines

#### Unit Tests
```javascript
// test/unit/validate.test.js
describe('Validate Function', () => {
  test('should validate DMS configuration successfully', async () => {
    const mockEvent = { taskArn: 'arn:aws:dms:...' };
    const result = await validateHandler(mockEvent, mockContext);
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).isValid).toBe(true);
  });
});
```

#### Integration Tests
```javascript
// test/integration/dms-integration.test.js
describe('DMS Integration', () => {
  beforeAll(async () => {
    // Setup AWS mocks
    mockDMS.mockImplementation(() => ({
      describeReplicationTasks: jest.fn().mockResolvedValue({
        ReplicationTasks: [mockTask]
      })
    }));
  });
});
```

### Documentation

#### JSDoc para Funciones
```javascript
/**
 * Valida la configuración DMS antes de iniciar migración
 * @param {Object} event - Evento de Lambda con configuración
 * @param {Object} context - Contexto de ejecución Lambda
 * @returns {Promise<Object>} Resultado de validación
 * @throws {Error} Si la configuración es inválida
 */
async function validateConfiguration(event, context) {
  // Implementation
}
```

#### README Updates
- Actualizar README.md si cambias funcionalidades principales
- Añadir ejemplos de uso para nuevas features
- Actualizar diagramas de arquitectura si es necesario

## 🐛 Reportar Bugs

### Antes de Reportar
1. Busca en issues existentes
2. Reproduce el bug en ambiente limpio
3. Identifica la versión donde ocurre

### Template de Bug Report
```markdown
## Descripción del Bug
Descripción clara y concisa del problema.

## Pasos para Reproducir
1. Configurar...
2. Ejecutar...
3. Ver error...

## Comportamiento Esperado
Qué esperabas que pasara.

## Comportamiento Actual
Qué está pasando realmente.

## Entorno
- OS: [e.g. Windows, macOS, Ubuntu]
- Node.js: [e.g. 18.16.0]
- AWS CLI: [e.g. 2.7.0]
- Versión del proyecto: [e.g. 1.0.0]

## Logs
```
[Incluir logs relevantes]
```

## Screenshots
Si aplica, añadir screenshots.
```

## 💡 Sugerir Funcionalidades

### Template de Feature Request
```markdown
## Funcionalidad Deseada
Descripción clara de la funcionalidad que te gustaría ver.

## Motivación
¿Por qué sería útil esta funcionalidad? ¿Qué problema resuelve?

## Solución Propuesta
Describe cómo te imaginas que funcionaría.

## Alternativas Consideradas
Otras soluciones que has considerado.

## Información Adicional
Contexto adicional, screenshots, etc.
```

## 🏗️ Desarrollo de Features Grandes

Para features que requieren cambios significativos:

1. **Crear RFC (Request for Comments)**:
   - Documento detallando la propuesta
   - Discusión en Issues antes de implementar

2. **Design Doc**:
   - Arquitectura propuesta
   - Trade-offs considerados
   - Plan de implementación

3. **Implementación por Fases**:
   - Dividir en PRs pequeños y revisables
   - Cada fase debe ser funcional

## 🔍 Review Process

### Para Reviewers
- **Funcionalidad**: ¿Funciona como se espera?
- **Tests**: ¿Tiene coverage adecuado?
- **Code Quality**: ¿Sigue las convenciones?
- **Performance**: ¿Puede optimizarse?
- **Security**: ¿Introduce vulnerabilidades?
- **Documentation**: ¿Está bien documentado?

### Para Contributors
- **Self-Review**: Revisa tu propio código antes del PR
- **Tests**: Asegúrate que todos los tests pasen
- **Documentation**: Actualiza docs relevantes
- **Commits**: Squash commits relacionados si es necesario

## 📦 Release Process

1. **Pre-release**:
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

2. **Version Bump**:
   ```bash
   npm version patch|minor|major
   ```

3. **Changelog**:
   - Actualizar CHANGELOG.md
   - Documentar breaking changes

4. **Tag y Release**:
   ```bash
   git tag v1.x.x
   git push origin v1.x.x
   ```

## 🆘 Obtener Ayuda

- **Documentation**: Revisar README y docs/
- **Issues**: Buscar en issues existentes
- **Discussions**: Para preguntas generales
- **Email**: jcandia.sbad@gmail.com para temas privados

## 🙏 Reconocimientos

Todos los contribuidores serán reconocidos en:
- README.md contributors section
- CHANGELOG.md para releases
- GitHub contributors page

¡Gracias por contribuir a hacer este proyecto mejor! 🚀

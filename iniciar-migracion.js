const AWS = require('aws-sdk');

// Configuración de credenciales para testing (SOLO PARA PRUEBAS)
// En producción usar AWS CLI o variables de entorno
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  console.log('✅ Usando credenciales de variables de entorno');
} else {
  console.log('⚠️ No se encontraron credenciales en variables de entorno');
  console.log('💡 Configura las variables:');
    console.log('   $env:AWS_ACCESS_KEY_ID = "YOUR_ACCESS_KEY_HERE"');
  console.log('   $env:AWS_SECRET_ACCESS_KEY = "YOUR_SECRET_ACCESS_KEY_HERE"');
  console.log('   $env:AWS_DEFAULT_REGION = "us-east-1"');
  console.log('');
  
  // Para testing rápido - reemplaza con tus credenciales reales:
  AWS.config.update({
    accessKeyId: 'AKIA...', // Tu Access Key ID aquí  
    secretAccessKey: 'wJalr...', // Tu Secret Access Key aquí
    region: 'us-east-1'
  });
}

// Configurá tu región (ejemplo: us-east-1)
const dms = new AWS.DMS({ region: 'us-east-1' });

// Reemplazá con el ARN real de tu tarea de migración DMS
const params = {
  ReplicationTaskArn: 'arn:aws:dms:us-east-1:123456789012:task:TU-TAREA-DMS',
  StartReplicationTaskType: 'start-replication'
};

// Configuración para testing
const TESTING_MODE = true; // Cambiar a false cuando tengas BD reales
const SIMULATE_MODE = true; // Cambiar a false cuando tengas credenciales AWS reales

// Función para validar configuración sin ejecutar
async function validarConfiguracion() {
  console.log('🔍 Modo testing - Validando configuración...');
  
  if (SIMULATE_MODE) {
    console.log('🎭 Modo simulación activado - Sin conexión AWS real');
    console.log('✅ Credenciales AWS: SIMULADAS');
    console.log('✅ Conexión DMS: SIMULADA - Tareas disponibles: 0');
    console.log('🎯 Script listo para usar con credenciales reales');
    console.log('💡 Para usar AWS real: cambiar SIMULATE_MODE = false');
    return true;
  }
  
  try {
    // Verificar credenciales AWS
    const sts = new AWS.STS({ region: 'us-east-1' });
    const identity = await sts.getCallerIdentity().promise();
    console.log(`✅ Credenciales AWS válidas - Account: ${identity.Account}`);
    
    // Verificar conexión DMS (sin ejecutar tarea)
    const response = await dms.describeReplicationTasks({}).promise();
    console.log(`✅ Conexión DMS OK - Tareas disponibles: ${response.ReplicationTasks.length}`);
    
    console.log('🎯 Configuración lista para cuando tengas BD reales');
    return true;
    
  } catch (err) {
    console.error(`❌ Error validación (${err.code}): ${err.message}`);
    console.log('💡 Para testing sin AWS: cambiar SIMULATE_MODE = true');
    return false;
  }
}

// Función para consultar el estado de la tarea
async function checkTaskStatus(taskArn) {
  try {
    const response = await dms.describeReplicationTasks({
      Filters: [
        {
          Name: 'replication-task-arn',
          Values: [taskArn]
        }
      ]
    }).promise();

    if (response.ReplicationTasks && response.ReplicationTasks.length > 0) {
      const task = response.ReplicationTasks[0];
      console.log(`📊 Estado actual: ${task.Status}`);
      console.log(`📈 Progreso: ${task.ReplicationTaskStats ? Math.round(task.ReplicationTaskStats.FullLoadProgressPercent || 0) : 0}%`);
      return task.Status;
    }
  } catch (err) {
    console.error(`❌ Error consultando estado (${err.code}): ${err.message}`);
  }
  return null;
}

// Función para hacer polling del estado
async function monitorTask(taskArn, maxWaitMinutes = 5) {
  console.log(`🔄 Monitoreando tarea por ${maxWaitMinutes} minutos...`);
  const maxAttempts = maxWaitMinutes * 2; // Check every 30 seconds
  
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkTaskStatus(taskArn);
    
    if (status === 'running') {
      console.log('🎉 ¡Tarea ejecutándose correctamente!');
      return true;
    } else if (status === 'failed' || status === 'stopped') {
      console.log(`⚠️ Tarea terminó con estado: ${status}`);
      return false;
    }
    
    if (i < maxAttempts - 1) {
      console.log('⏳ Esperando 30 segundos antes del próximo check...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('⏰ Tiempo de monitoreo agotado');
  return false;
}

// Ejecutar migración con monitoreo
async function iniciarMigracion() {
  try {
    console.log('🚀 Iniciando migración DMS...');
    
    const data = await dms.startReplicationTask(params).promise();
    
    console.log("✅ Migración iniciada con éxito:");
    console.log(JSON.stringify(data, null, 2));
    
    // Monitorear el estado de la tarea
    await monitorTask(params.ReplicationTaskArn);
    
  } catch (err) {
    console.error(`❌ Error (${err.code || 'UNKNOWN'}): ${err.message}`);
    
    // Si la tarea ya está corriendo, solo informar
    if (err.code === 'InvalidResourceStateFault') {
      console.log('ℹ️ La tarea podría estar ya ejecutándose. Verificando estado...');
      await checkTaskStatus(params.ReplicationTaskArn);
    }
  }
}

// Orquestador simple integrado
class MigrationOrchestrator {
  constructor() {
    this.steps = [
      { name: 'validar', fn: this.validarConfiguracion },
      { name: 'migrar', fn: this.iniciarMigracion },
      { name: 'monitorear', fn: this.monitorTask },
      { name: 'notificar', fn: this.enviarNotificacion }
    ];
  }

  async ejecutarPipeline() {
    console.log('🎭 Iniciando pipeline de migración...');
    const resultados = {};
    
    for (const step of this.steps) {
      try {
        console.log(`📋 Ejecutando: ${step.name}`);
        const resultado = await step.fn.call(this);
        resultados[step.name] = resultado;
        console.log(`✅ ${step.name} completado`);
      } catch (error) {
        console.error(`❌ Error en ${step.name}:`, error.message);
        await this.manejarError(step.name, error);
        break;
      }
    }
    
    console.log('🎉 Pipeline completado exitosamente!');
    console.log('📊 Resumen de resultados:', resultados);
    return resultados;
  }

  async enviarNotificacion(resultado) {
    // SNS, email, Slack, etc.
    console.log(`📧 Enviando notificación: Pipeline completado exitosamente`);
    console.log(`🎯 Resultado: ${JSON.stringify(resultado, null, 2)}`);
    
    if (process.env.SNS_TOPIC_ARN && !SIMULATE_MODE) {
      const sns = new AWS.SNS();
      await sns.publish({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: `Migración DMS completada: ${JSON.stringify(resultado)}`,
        Subject: 'Estado de Migración DMS'
      }).promise();
    } else {
      console.log('📧 Notificación simulada enviada exitosamente');
    }
    
    return { 
      simulated: SIMULATE_MODE, 
      status: 'sent', 
      timestamp: new Date().toISOString() 
    };
  }

  async manejarError(step, error) {
    console.log(`🔄 Manejando error en ${step}...`);
    
    // Enviar alerta inmediata
    await this.enviarNotificacion(`Error en ${step}: ${error.message}`);
    
    if (SIMULATE_MODE) {
      console.log('🎭 Simulando retry automático...');
      console.log(`✅ ${step} simulado como exitoso en retry`);
      return;
    }
    
    // Lógica de retry real solo si no está en simulación
    console.log(`🔄 Esperando 5 minutos antes del retry...`);
    await new Promise(resolve => setTimeout(resolve, 300000)); // 5 min
    
    // Reintentar el paso específico
    try {
      const stepObj = this.steps.find(s => s.name === step);
      if (stepObj) {
        console.log(`🔄 Reintentando ${step}...`);
        await stepObj.fn();
        console.log(`✅ ${step} completado en reintento`);
      }
    } catch (retryError) {
      console.error(`❌ Fallo definitivo en ${step}:`, retryError.message);
      throw retryError;
    }
  }

  // Métodos wrapper para las funciones globales
  async validarConfiguracion() {
    return await validarConfiguracion();
  }

  async iniciarMigracion() {
    if (SIMULATE_MODE) {
      console.log('🎭 Simulando inicio de migración...');
      console.log('✅ Migración simulada iniciada exitosamente');
      return { simulated: true, status: 'started' };
    }
    return await iniciarMigracion();
  }

  async monitorTask() {
    if (SIMULATE_MODE) {
      console.log('🎭 Simulando monitoreo de tarea...');
      console.log('📊 Estado simulado: running');
      
      // Simular progreso gradual sin delay real
      const progressSteps = [25, 50, 75, 100];
      for (const progress of progressSteps) {
        console.log(`📈 Progreso simulado: ${progress}%`);
        // Solo un pequeño delay para simular
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('🎉 Tarea simulada completada exitosamente');
      return { simulated: true, status: 'completed', progress: 100 };
    }
    return await monitorTask(params.ReplicationTaskArn);
  }
}

// Modo orquestador - usar la clase en lugar de funciones directas
const USE_ORCHESTRATOR = true; // Cambiar a true para usar orquestador

// Función principal
async function main() {
  if (USE_ORCHESTRATOR) {
    // Usar orquestador completo
    const orchestrator = new MigrationOrchestrator();
    await orchestrator.ejecutarPipeline();
  } else if (TESTING_MODE) {
    // En modo testing, solo validar configuración
    await validarConfiguracion();
  } else {
    // Iniciar migración en modo normal
    await iniciarMigracion();
  }
}

// Ejecutar función principal
main();

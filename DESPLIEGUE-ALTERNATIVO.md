# 🚀 Guía de Despliegue Alternativo - Migrador DMS

Esta guía proporciona múltiples opciones para desplegar el sistema de migración y monitoreo DMS según tus necesidades y preferencias.

## 📖 Índice

1. [Despliegue con AWS SAM](#despliegue-con-aws-sam)
2. [Despliegue con Serverless Framework](#despliegue-con-serverless-framework)
3. [Despliegue Manual con CLI](#despliegue-manual-con-cli)
4. [Despliegue con Terraform](#despliegue-con-terraform)
5. [Despliegue Local para Testing](#despliegue-local-para-testing)
6. [Comparación de Métodos](#comparación-de-métodos)

---

## 🎯 Despliegue con AWS SAM

### Prerrequisitos
```powershell
# Instalar AWS SAM CLI
npm install -g @aws-sam/cli

# Verificar instalación
sam --version

# Configurar credenciales AWS
aws configure
```

### Pasos de Despliegue

1. **Validar template SAM**
```powershell
sam validate --template template.yaml
```

2. **Build del proyecto**
```powershell
sam build --template template.yaml
```

3. **Deploy interactivo (primera vez)**
```powershell
sam deploy --guided --template template.yaml
```

4. **Deploy automatizado (subsecuentes)**
```powershell
sam deploy --stack-name migrador-dms-prod --parameter-overrides Environment=prod NotificationEmail=admin@tuempresa.com
```

### Configuración Avanzada SAM

**samconfig.toml**
```toml
version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "migrador-dms"
s3_bucket = "tu-bucket-sam-deployments"
s3_prefix = "migrador-dms"
region = "us-east-1"
confirm_changeset = true
capabilities = "CAPABILITY_IAM"
parameter_overrides = "Environment=dev NotificationEmail=dev@tuempresa.com"
```

### Comandos Útiles SAM
```powershell
# Ver logs en tiempo real
sam logs -n OrchestratorFunction --stack-name migrador-dms --tail

# Invocar función localmente
sam local invoke ValidateFunction --event events/validate-event.json

# Iniciar API local
sam local start-api

# Sincronizar cambios automáticamente
sam sync --watch
```

---

## ⚡ Despliegue con Serverless Framework

### Prerrequisitos
```powershell
# Instalar Serverless Framework
npm install -g serverless

# Instalar plugins necesarios
npm install --save-dev serverless-offline serverless-step-functions

# Verificar instalación
serverless --version
```

### Pasos de Despliegue

1. **Deploy de desarrollo**
```powershell
serverless deploy --stage dev --region us-east-1
```

2. **Deploy de producción**
```powershell
serverless deploy --stage prod --region us-east-1
```

3. **Deploy de función específica**
```powershell
serverless deploy function --function orchestrator --stage dev
```

### Variables de Entorno Serverless

**Crear archivo `.env`**
```bash
# Configuración de desarrollo
NOTIFICATION_EMAIL=dev@tuempresa.com
DMS_TASK_ARN=arn:aws:dms:us-east-1:123456789012:task:dev-migration-task

# Configuración de producción
# NOTIFICATION_EMAIL=prod@tuempresa.com
# DMS_TASK_ARN=arn:aws:dms:us-east-1:123456789012:task:prod-migration-task
```

### Comandos Útiles Serverless
```powershell
# Ver información del stack
serverless info --stage dev

# Ver logs
serverless logs -f orchestrator --stage dev --tail

# Remover stack
serverless remove --stage dev

# Ejecutar localmente
serverless offline start

# Invocar función
serverless invoke -f validate --stage dev --data '{\"taskArn\":\"arn:aws:dms:...\"}' 
```

---

## 🛠️ Despliegue Manual con CLI

### 1. Crear Funciones Lambda

```powershell
# Crear ZIP de funciones
Compress-Archive -Path lambda-functions\* -DestinationPath lambda-functions.zip

# Crear función de validación
aws lambda create-function `
    --function-name migrador-dms-validate `
    --runtime nodejs18.x `
    --role arn:aws:iam::123456789012:role/lambda-execution-role `
    --handler validate.handler `
    --zip-file fileb://lambda-functions.zip `
    --timeout 300

# Crear función de migración
aws lambda create-function `
    --function-name migrador-dms-migrate `
    --runtime nodejs18.x `
    --role arn:aws:iam::123456789012:role/lambda-execution-role `
    --handler migrate.handler `
    --zip-file fileb://lambda-functions.zip `
    --timeout 600

# Crear función de monitoreo
aws lambda create-function `
    --function-name migrador-dms-monitor `
    --runtime nodejs18.x `
    --role arn:aws:iam::123456789012:role/lambda-execution-role `
    --handler monitor.handler `
    --zip-file fileb://lambda-functions.zip `
    --timeout 300

# Crear función orquestadora
aws lambda create-function `
    --function-name migrador-dms-orchestrator `
    --runtime nodejs18.x `
    --role arn:aws:iam::123456789012:role/lambda-execution-role `
    --handler orchestrator.handler `
    --zip-file fileb://lambda-functions.zip `
    --timeout 900
```

### 2. Crear SNS Topic

```powershell
# Crear topic
aws sns create-topic --name migrador-dms-notifications

# Suscribir email
aws sns subscribe `
    --topic-arn arn:aws:sns:us-east-1:123456789012:migrador-dms-notifications `
    --protocol email `
    --notification-endpoint admin@tuempresa.com
```

### 3. Crear Tablas DynamoDB

```powershell
# Tabla de configuración
aws dynamodb create-table `
    --table-name migrador-dms-configuration `
    --attribute-definitions AttributeName=configId,AttributeType=S `
    --key-schema AttributeName=configId,KeyType=HASH `
    --billing-mode PAY_PER_REQUEST

# Tabla de monitoreo
aws dynamodb create-table `
    --table-name migrador-dms-monitoring `
    --attribute-definitions AttributeName=taskArn,AttributeType=S AttributeName=timestamp,AttributeType=S `
    --key-schema AttributeName=taskArn,KeyType=HASH AttributeName=timestamp,KeyType=RANGE `
    --billing-mode PAY_PER_REQUEST
```

### 4. Configurar Variables de Entorno

```powershell
# Configurar variables para cada función
aws lambda update-function-configuration `
    --function-name migrador-dms-orchestrator `
    --environment Variables='{
        "SNS_TOPIC_ARN":"arn:aws:sns:us-east-1:123456789012:migrador-dms-notifications",
        "VALIDATE_FUNCTION_NAME":"migrador-dms-validate",
        "MIGRATE_FUNCTION_NAME":"migrador-dms-migrate",
        "MONITOR_FUNCTION_NAME":"migrador-dms-monitor",
        "MONITORING_TABLE_NAME":"migrador-dms-monitoring"
    }'
```

---

## 🏗️ Despliegue con Terraform

### Crear archivo `main.tf`

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "notification_email" {
  description = "Email for notifications"
  type        = string
}

# Crear archivo ZIP para Lambda
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "lambda-functions"
  output_path = "lambda-functions.zip"
}

# Rol IAM para Lambda
resource "aws_iam_role" "lambda_role" {
  name = "migrador-dms-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Políticas IAM
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dms_policy" {
  name = "migrador-dms-policy-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dms:*",
          "sns:Publish",
          "dynamodb:*",
          "lambda:InvokeFunction"
        ]
        Resource = "*"
      }
    ]
  })
}

# SNS Topic
resource "aws_sns_topic" "notifications" {
  name = "migrador-dms-notifications-${var.environment}"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# Funciones Lambda
resource "aws_lambda_function" "validate" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "migrador-dms-validate-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "validate.handler"
  runtime         = "nodejs18.x"
  timeout         = 300
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.notifications.arn
    }
  }
}

resource "aws_lambda_function" "migrate" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "migrador-dms-migrate-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "migrate.handler"
  runtime         = "nodejs18.x"
  timeout         = 600
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.notifications.arn
      MONITORING_TABLE_NAME = aws_dynamodb_table.monitoring.name
    }
  }
}

resource "aws_lambda_function" "monitor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "migrador-dms-monitor-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "monitor.handler"
  runtime         = "nodejs18.x"
  timeout         = 300
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.notifications.arn
      MONITORING_TABLE_NAME = aws_dynamodb_table.monitoring.name
    }
  }
}

resource "aws_lambda_function" "orchestrator" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "migrador-dms-orchestrator-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "orchestrator.handler"
  runtime         = "nodejs18.x"
  timeout         = 900
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.notifications.arn
      VALIDATE_FUNCTION_NAME = aws_lambda_function.validate.function_name
      MIGRATE_FUNCTION_NAME = aws_lambda_function.migrate.function_name
      MONITOR_FUNCTION_NAME = aws_lambda_function.monitor.function_name
    }
  }
}

# Tablas DynamoDB
resource "aws_dynamodb_table" "configuration" {
  name           = "migrador-dms-configuration-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "configId"

  attribute {
    name = "configId"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Purpose     = "DMS Migration Configuration"
  }
}

resource "aws_dynamodb_table" "monitoring" {
  name           = "migrador-dms-monitoring-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "taskArn"
  range_key      = "timestamp"

  attribute {
    name = "taskArn"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Environment = var.environment
    Purpose     = "DMS Migration Monitoring"
  }
}

# Outputs
output "orchestrator_function_name" {
  value = aws_lambda_function.orchestrator.function_name
}

output "sns_topic_arn" {
  value = aws_sns_topic.notifications.arn
}
```

### Comandos Terraform

```powershell
# Inicializar
terraform init

# Planificar
terraform plan -var="notification_email=admin@tuempresa.com"

# Aplicar
terraform apply -var="notification_email=admin@tuempresa.com"

# Destruir
terraform destroy
```

---

## 🧪 Despliegue Local para Testing

### Setup con SAM Local

```powershell
# Instalar dependencias
npm install

# Iniciar API local
sam local start-api --template template.yaml

# Iniciar Lambda local
sam local start-lambda --template template.yaml

# Ejecutar función específica
sam local invoke ValidateFunction --event events/test-validate.json
```

### Setup con Serverless Offline

```powershell
# Instalar plugin
npm install --save-dev serverless-offline

# Iniciar servidor local
serverless offline start --stage local

# La API estará disponible en http://localhost:3000
```

### Crear Eventos de Prueba

**events/test-validate.json**
```json
{
  "taskArn": "arn:aws:dms:us-east-1:123456789012:task:test-task",
  "testMode": true
}
```

**events/test-migrate.json**
```json
{
  "taskArns": ["arn:aws:dms:us-east-1:123456789012:task:test-task"],
  "startType": "start-replication",
  "restartFailedTasks": true
}
```

### Testing con el Script Principal

```powershell
# Configurar modo testing
$env:AWS_ACCESS_KEY_ID = "test"
$env:AWS_SECRET_ACCESS_KEY = "test"

# Ejecutar en modo simulación
node iniciar-migracion.js
```

---

## 📊 Comparación de Métodos

| Método | Complejidad | Tiempo Setup | Control | Costos | Mantenimiento | Recomendado Para |
|--------|-------------|--------------|---------|--------|---------------|------------------|
| **AWS SAM** | ⭐⭐⭐ | 15 min | Alto | Bajo | Medio | Equipos AWS, CI/CD |
| **Serverless** | ⭐⭐ | 10 min | Medio | Bajo | Bajo | Desarrollo rápido |
| **Manual CLI** | ⭐⭐⭐⭐ | 30 min | Máximo | Bajo | Alto | Control total |
| **Terraform** | ⭐⭐⭐⭐⭐ | 45 min | Máximo | Bajo | Alto | Infraestructura como código |
| **Local** | ⭐ | 5 min | N/A | Gratis | Bajo | Testing y desarrollo |

### Recomendaciones por Escenario

- **🚀 Desarrollo rápido**: Serverless Framework
- **🏢 Empresa grande**: Terraform + CI/CD
- **☁️ AWS-native**: AWS SAM
- **🔧 Control total**: Manual CLI
- **🧪 Testing**: Local + Simulación

---

## 🔧 Troubleshooting Común

### Error: "Function not found"
```powershell
# Verificar funciones existentes
aws lambda list-functions --query 'Functions[?contains(FunctionName, `migrador-dms`)]'

# Crear función faltante
aws lambda create-function --function-name NOMBRE_FUNCION ...
```

### Error: "SNS topic not found"
```powershell
# Listar topics
aws sns list-topics

# Crear topic
aws sns create-topic --name migrador-dms-notifications
```

### Error: "DynamoDB table not found"
```powershell
# Listar tablas
aws dynamodb list-tables

# Crear tabla
aws dynamodb create-table --table-name NOMBRE_TABLA ...
```

### Logs y Debugging
```powershell
# Ver logs CloudWatch
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/migrador-dms

# Ver logs en tiempo real
aws logs tail /aws/lambda/migrador-dms-orchestrator --follow
```

---

## 📚 Recursos Adicionales

- [Documentación AWS SAM](https://docs.aws.amazon.com/serverless-application-model/)
- [Serverless Framework Guide](https://www.serverless.com/framework/docs/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/)
- [AWS DMS Documentation](https://docs.aws.amazon.com/dms/)

---

*📝 Esta guía se actualiza periódicamente. Para dudas o mejoras, crear un issue en el repositorio.*
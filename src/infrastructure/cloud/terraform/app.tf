# Security Group for Application
resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-app-sg"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 3010
    to_port     = 3010
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app-sg"
  }
}

# Application Load Balancer
# resource "aws_lb" "main" {
#   name               = "${var.project_name}-alb"
#   internal           = false
#   load_balancer_type = "application"
#   security_groups    = [aws_security_group.app.id]
#   subnets            = aws_subnet.public[*].id

#   enable_deletion_protection = var.environment == "production"

#   tags = {
#     Name = "${var.project_name}-alb"
#   }
# }

# ALB Target Group
# resource "aws_lb_target_group" "main" {
#   name     = "${var.project_name}-tg"
#   port     = 3010
#   protocol = "HTTP"
#   vpc_id   = aws_vpc.main.id

#   health_check {
#     enabled             = true
#     healthy_threshold   = 2
#     interval            = 30
#     matcher             = "200"
#     path                = "/health/ping"
#     port                = "traffic-port"
#     protocol            = "HTTP"
#     timeout             = 5
#     unhealthy_threshold = 2
#   }

#   tags = {
#     Name = "${var.project_name}-tg"
#   }
# }

# ALB Listener
# resource "aws_lb_listener" "main" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = "80"
#   protocol          = "HTTP"

#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.main.arn
#   }
# }

# # ECS Cluster
# resource "aws_ecs_cluster" "main" {
#   name = "${var.project_name}-cluster"

#   setting {
#     name  = "containerInsights"
#     value = "enabled"
#   }

#   tags = {
#     Name = "${var.project_name}-cluster"
#   }
# }

# # ECS Task Definition
# resource "aws_ecs_task_definition" "main" {
#   family                   = "${var.project_name}-task"
#   network_mode             = "awsvpc"
#   requires_compatibilities = ["FARGATE"]
#   cpu                      = var.app_cpu
#   memory                   = var.app_memory

#   execution_role_arn = aws_iam_role.ecs_execution.arn
#   task_role_arn      = aws_iam_role.ecs_task.arn

#   container_definitions = jsonencode([
#     {
#       name  = "${var.project_name}-app"
#       image = "${var.ecr_repository_url}:latest"

#       portMappings = [
#         {
#           containerPort = 3010
#           protocol      = "tcp"
#         }
#       ]

#       environment = [
#         {
#           name  = "API_PORT"
#           value = "3010"
#         },
#         {
#           name  = "PG_TYPE"
#           value = "postgres"
#         },
#         {
#           name  = "PG_PORT"
#           value = "5432"
#         },
#         {
#           name  = "HOST"
#           value = aws_db_instance.main.endpoint
#         },
#         {
#           name  = "USERNAME"
#           value = var.db_username
#         },
#         {
#           name  = "DATABASE"
#           value = var.db_name
#         },
#         {
#           name  = "DB_PASSWORD"
#           value = var.db_password
#         },
#         {
#           name  = "REDIS_PORT"
#           value = "6379"
#         },
#         {
#           name  = "REDIS_HOST"
#           value = aws_elasticache_replication_group.main.primary_endpoint_address
#         },
#         {
#           name  = "CACHE_TTL_L1"
#           value = var.cache_ttl_l1
#         },
#         {
#           name  = "CACHE_TTL_L2"
#           value = var.cache_ttl_l2
#         },
#         {
#           name  = "SMTP_MAIL_HOST"
#           value = "email-smtp.${var.aws_region}.amazonaws.com"
#         },
#         {
#           name  = "SMTP_MAIL_PORT"
#           value = "587"
#         },
#         {
#           name  = "SMTP_MAIL_SECURE"
#           value = "false"
#         },
#         {
#           name  = "SMTP_MAIL_USER"
#           value = aws_iam_access_key.ses_smtp.id
#         },
#         {
#           name  = "SMTP_MAIL_PASSWORD"
#           value = aws_iam_access_key.ses_smtp.ses_smtp_v4_secret_access_key
#         },
#         {
#           name  = "SMTP_MAIL_FROM"
#           value = "noreply@${var.ses_domain}"
#         }
#       ]

#       logConfiguration = {
#         logDriver = "awslogs"
#         options = {
#           awslogs-group         = aws_cloudwatch_log_group.app.name
#           awslogs-region        = var.aws_region
#           awslogs-stream-prefix = "ecs"
#         }
#       }
#     }
#   ])

#   tags = {
#     Name = "${var.project_name}-task-definition"
#   }
# }

# # ECS Service
# resource "aws_ecs_service" "main" {
#   name            = "${var.project_name}-service"
#   cluster         = aws_ecs_cluster.main.id
#   task_definition = aws_ecs_task_definition.main.arn
#   desired_count   = var.app_desired_count
#   launch_type     = "FARGATE"

#   network_configuration {
#     subnets          = aws_subnet.private[*].id
#     security_groups  = [aws_security_group.app.id]
#     assign_public_ip = false
#   }

#   load_balancer {
#     target_group_arn = aws_lb_target_group.main.arn
#     container_name   = "${var.project_name}-app"
#     container_port   = 3010
#   }

#   depends_on = [aws_lb_listener.main]

#   tags = {
#     Name = "${var.project_name}-service"
#   }
# }

# # CloudWatch Log Group for Application
# resource "aws_cloudwatch_log_group" "app" {
#   name              = "/ecs/${var.project_name}"
#   retention_in_days = 7

#   tags = {
#     Name = "${var.project_name}-app-logs"
#   }
# } 
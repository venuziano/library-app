# output "vpc_id" {
#   description = "VPC ID"
#   value       = aws_vpc.main.id
# }

# output "public_subnet_ids" {
#   description = "Public subnet IDs"
#   value       = aws_subnet.public[*].id
# }

# output "private_subnet_ids" {
#   description = "Private subnet IDs"
#   value       = aws_subnet.private[*].id
# }

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}

# output "elasticache_endpoint" {
#   description = "ElastiCache primary endpoint"
#   value       = aws_elasticache_replication_group.main.primary_endpoint_address
# }

# output "elasticache_port" {
#   description = "ElastiCache port"
#   value       = aws_elasticache_replication_group.main.port
# }

# output "alb_dns_name" {
#   description = "Application Load Balancer DNS name"
#   value       = aws_lb.main.dns_name
# }

# output "alb_zone_id" {
#   description = "Application Load Balancer zone ID"
#   value       = aws_lb.main.zone_id
# }

# output "ecs_cluster_name" {
#   description = "ECS cluster name"
#   value       = aws_ecs_cluster.main.name
# }

# output "ecs_service_name" {
#   description = "ECS service name"
#   value       = aws_ecs_service.main.name
# }

# output "ses_domain_identity" {
#   description = "SES domain identity"
#   value       = aws_ses_domain_identity.main.domain
# }

# output "ses_dkim_tokens" {
#   description = "SES DKIM tokens"
#   value       = aws_ses_domain_dkim.main.dkim_tokens
# }

# output "ses_smtp_username" {
#   description = "SES SMTP username"
#   value       = aws_iam_access_key.ses_smtp.id
# }

# output "ses_smtp_password" {
#   description = "SES SMTP password"
#   value       = aws_iam_access_key.ses_smtp.ses_smtp_v4_secret_access_key
#   sensitive   = true
# }

# output "cloudwatch_log_groups" {
#   description = "CloudWatch log groups"
#   value = {
#     app         = aws_cloudwatch_log_group.app.name
#     elasticache = aws_cloudwatch_log_group.elasticache.name
#     ses         = aws_cloudwatch_log_group.ses.name
#   }
# }

output "eks_cluster_endpoint" {
  description = "EKS API endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "Control-plane SG"
  value       = module.eks.cluster_security_group_id
}
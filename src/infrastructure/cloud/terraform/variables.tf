variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "sa-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "library-app"
}

variable "environment" {
  description = "Environment (development, staging, production)"
  type        = string
  default     = "development"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["sa-east-1a", "sa-east-1b"]
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

# Security Configuration
variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# RDS Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "RDS maximum allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "library_app"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

# ElastiCache Configuration
variable "cache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

# Application Configuration
variable "app_cpu" {
  description = "ECS task CPU units"
  type        = number
  default     = 256
}

variable "app_memory" {
  description = "ECS task memory in MB"
  type        = number
  default     = 512
}

variable "app_desired_count" {
  description = "ECS service desired count"
  type        = number
  default     = 1
}

# variable "ecr_repository_url" {
#   description = "ECR repository URL"
#   type        = string
# }

# Cache Configuration
variable "cache_ttl_l1" {
  description = "L1 cache TTL in seconds"
  type        = number
  default     = 300
}

variable "cache_ttl_l2" {
  description = "L2 cache TTL in seconds"
  type        = number
  default     = 3600
}

# SES Configuration
variable "ses_domain" {
  description = "SES domain for email sending"
  type        = string
  default     = "example.com"
}

variable "eks_cluster_name" {
  type        = string
  description = "Name of the EKS cluster"
}

variable "home_ip" {
  type        = list(string)
  description = "Home ip"
}

variable "eks_cluster_version" {
  type        = string
  description = "Kubernetes version"
  default     = "1.28"
}

variable "eks_node_instance_types" {
  type        = list(string)
  description = "EC2 types for worker nodes"
  default     = ["t3.large"]
}

variable "eks_node_min_capacity" {
  type        = number
  description = "Min # of workers"
  default     = 3
}

variable "eks_node_desired_capacity" {
  type        = number
  description = "Desired # of workers"
  default     = 3
}

variable "eks_node_max_capacity" {
  type        = number
  description = "Max # of workers"
  default     = 5
}
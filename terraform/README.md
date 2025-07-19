# Library App AWS Infrastructure

This Terraform configuration creates a complete AWS infrastructure for the Library App, matching the services used in the Docker Compose setup.

## Architecture Overview

The infrastructure includes:

- **VPC** with public and private subnets across 2 availability zones
- **RDS PostgreSQL** (replaces PostgreSQL container)
- **ElastiCache Redis** (replaces Redis container)
- **Amazon SES** (replaces MailHog for email)
- **ECS Fargate** for running the application
- **Application Load Balancer** for traffic distribution
- **CloudWatch** for logging and monitoring
- **IAM roles and policies** for secure access

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** (version >= 1.0)
3. **AWS Account** with appropriate permissions
4. **ECR Repository** for your Docker image
5. **Domain** for SES email sending

## Quick Start

1. **Clone and navigate to the terraform directory:**
   ```bash
   cd terraform
   ```

2. **Copy the example variables file:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. **Edit `terraform.tfvars` with your values:**
   - Set your AWS region
   - Configure your domain for SES
   - Set a secure database password
   - Update the ECR repository URL
   - Adjust instance sizes as needed

4. **Initialize Terraform:**
   ```bash
   terraform init
   ```

5. **Plan the deployment:**
   ```bash
   terraform plan
   ```

6. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## Configuration Details

### VPC and Networking
- VPC CIDR: `10.0.0.0/16`
- 2 public subnets for ALB and NAT Gateway
- 2 private subnets for ECS, RDS, and ElastiCache
- NAT Gateway for private subnet internet access

### Database (RDS PostgreSQL)
- PostgreSQL 13.12
- Multi-AZ in production
- Automated backups
- Performance Insights enabled
- Encryption at rest and in transit

### Caching (ElastiCache Redis)
- Redis 7.x
- Multi-AZ in production
- Encryption enabled
- CloudWatch logging

### Email (Amazon SES)
- Domain verification required
- DKIM authentication
- SMTP credentials for application
- Event tracking via SNS and CloudWatch

### Application (ECS Fargate)
- Serverless container deployment
- Auto-scaling capabilities
- Health checks via ALB
- CloudWatch logging

## Environment Variables Mapping

The ECS task definition maps your Docker Compose environment variables to AWS services:

| Docker Compose | AWS Service | Environment Variable |
|----------------|-------------|---------------------|
| `postgres` | RDS PostgreSQL | `HOST`, `USERNAME`, `DATABASE`, `DB_PASSWORD` |
| `redis` | ElastiCache Redis | `REDIS_HOST`, `REDIS_PORT` |
| `mailhog` | Amazon SES | `SMTP_MAIL_HOST`, `SMTP_MAIL_USER`, `SMTP_MAIL_PASSWORD` |

## Security Features

- **Network Security**: Security groups restrict access between services
- **Encryption**: All data encrypted at rest and in transit
- **IAM**: Least privilege access for all services
- **VPC**: Private subnets for sensitive resources
- **Secrets**: Database passwords and SES credentials managed securely

## Monitoring and Logging

- **CloudWatch Logs**: Centralized logging for all services
- **CloudWatch Metrics**: Performance monitoring
- **RDS Performance Insights**: Database performance analysis
- **ElastiCache CloudWatch**: Cache performance monitoring
- **SES Event Tracking**: Email delivery and bounce tracking

## Cost Optimization

- **Development**: Single-AZ deployment with smaller instances
- **Production**: Multi-AZ deployment with appropriate sizing
- **Auto-scaling**: ECS can scale based on demand
- **Reserved Instances**: Consider for production RDS and ElastiCache

## Post-Deployment Steps

1. **Verify SES Domain**: Complete domain verification in AWS Console
2. **Update DNS**: Add DKIM records for email authentication
3. **Deploy Application**: Push your Docker image to ECR
4. **Test Health Checks**: Verify `/health/ping` endpoint
5. **Monitor Logs**: Check CloudWatch for any issues

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

⚠️ **Warning**: This will delete all data in RDS and ElastiCache!

## Troubleshooting

### Common Issues

1. **SES Domain Not Verified**: Complete domain verification before sending emails
2. **RDS Connection Issues**: Check security group rules and subnet configuration
3. **ECS Task Failures**: Check CloudWatch logs for application errors
4. **ElastiCache Connection**: Verify security group allows traffic on port 6379

### Useful Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster library-app-cluster --services library-app-service

# View CloudWatch logs
aws logs tail /ecs/library-app --follow

# Test RDS connectivity
aws rds describe-db-instances --db-instance-identifier library-app-db
```

## Support

For issues with this Terraform configuration, check:
- AWS Service documentation
- Terraform provider documentation
- CloudWatch logs for application-specific issues 
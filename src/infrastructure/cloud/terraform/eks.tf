module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.eks_cluster_name
  cluster_version = var.eks_cluster_version

  enable_cluster_creator_admin_permissions = true
  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true
  # lock it down to just your laptop’s IP for safety
  cluster_endpoint_public_access_cidrs = var.home_ip

  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  eks_managed_node_group_defaults = {
    instance_types = var.eks_node_instance_types
  }

  eks_managed_node_groups = {
    workers = {
      desired_size = var.eks_node_desired_capacity
      min_size     = var.eks_node_min_capacity
      max_size     = var.eks_node_max_capacity
    }
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}
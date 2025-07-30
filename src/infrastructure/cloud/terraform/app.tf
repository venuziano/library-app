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
# # SES Domain Identity
# resource "aws_ses_domain_identity" "main" {
#   domain = var.ses_domain
# }

# # SES Domain DKIM
# resource "aws_ses_domain_dkim" "main" {
#   domain = aws_ses_domain_identity.main.domain
# }

# # SES Configuration Set
# resource "aws_ses_configuration_set" "main" {
#   name = "${var.project_name}-ses-config"

#   delivery_options {
#     tls_policy = "Optional"
#   }

#   reputation_metrics_enabled = true
#   last_fresh_start_enabled   = true
# }

# # SES Event Destination for CloudWatch
# resource "aws_ses_event_destination" "cloudwatch" {
#   name                   = "${var.project_name}-ses-cloudwatch"
#   configuration_set_name = aws_ses_configuration_set.main.name
#   enabled                = true
#   matching_types         = ["send", "reject", "bounce", "complaint", "delivery"]

#   cloudwatch_destination {
#     default_value  = "default"
#     dimension_name = "ses"
#     value_source   = "messageTag"
#   }
# }

# # SES Event Destination for SNS
# resource "aws_ses_event_destination" "sns" {
#   name                   = "${var.project_name}-ses-sns"
#   configuration_set_name = aws_ses_configuration_set.main.name
#   enabled                = true
#   matching_types         = ["bounce", "complaint"]

#   sns_destination {
#     topic_arn = aws_sns_topic.ses_events.arn
#   }
# }

# # SNS Topic for SES Events
# resource "aws_sns_topic" "ses_events" {
#   name = "${var.project_name}-ses-events"
# }

# # SNS Topic Policy
# resource "aws_sns_topic_policy" "ses_events" {
#   arn = aws_sns_topic.ses_events.arn

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = {
#           Service = "ses.amazonaws.com"
#         }
#         Action = [
#           "sns:Publish"
#         ]
#         Resource = aws_sns_topic.ses_events.arn
#         Condition = {
#           StringEquals = {
#             "AWS:SourceAccount": data.aws_caller_identity.current.account_id
#           }
#         }
#       }
#     ]
#   })
# }

# # IAM User for SES SMTP
# resource "aws_iam_user" "ses_smtp" {
#   name = "${var.project_name}-ses-smtp-user"
# }

# # IAM Access Key for SES SMTP
# resource "aws_iam_access_key" "ses_smtp" {
#   user = aws_iam_user.ses_smtp.name
# }

# # IAM Policy for SES SMTP
# resource "aws_iam_user_policy" "ses_smtp" {
#   name = "${var.project_name}-ses-smtp-policy"
#   user = aws_iam_user.ses_smtp.name

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "ses:SendEmail",
#           "ses:SendRawEmail"
#         ]
#         Resource = "*"
#       }
#     ]
#   })
# }

# # CloudWatch Log Group for SES
# resource "aws_cloudwatch_log_group" "ses" {
#   name              = "/aws/ses/${var.project_name}"
#   retention_in_days = 7

#   tags = {
#     Name = "${var.project_name}-ses-logs"
#   }
# }

# # Data source for current AWS account
# data "aws_caller_identity" "current" {} 
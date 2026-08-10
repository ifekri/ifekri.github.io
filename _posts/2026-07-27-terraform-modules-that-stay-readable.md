---
title: "Terraform modules that stay readable"
date: 2026-07-27 09:15:00 +0300
categories: [Infrastructure]
tags: [terraform, iac, aws]
description: "How to structure Terraform so the next person doesn't curse your name."
---

Terraform code rots faster than application code. Not because the language is bad, but because it's easy to write infrastructure that works today and is incomprehensible in six months. A few structural habits prevent most of that.

<!--more-->

## Modules should do one thing

A module that creates a VPC, a database, a cache, and a monitoring stack is not a module. It's a novel. Split it.

```
modules/
  vpc/
    main.tf
    variables.tf
    outputs.tf
  database/
    main.tf
    variables.tf
    outputs.tf
  monitoring/
    main.tf
    variables.tf
    outputs.tf
```

Each module should be understandable in one read. If you need to scroll to understand what a module creates, it's doing too much.

## Variables need contracts

Every variable should have a type, a description, and a default when a sensible one exists.

```hcl
variable "instance_type" {
  type        = string
  description = "EC2 instance class for the app servers"
  default     = "t3.medium"

  validation {
    condition     = can(regex("^t3\\.", var.instance_type))
    error_message = "Only t3 instance types are supported for this workload."
  }
}

variable "enable_monitoring" {
  type        = bool
  description = "Whether to attach CloudWatch agent and alarms"
  default     = true
}
```

The validation block is not optional. It's the difference between a typo caught at plan time and a production outage at apply time.

## Outputs are the API

A module's outputs are its public interface. Export what consumers need, nothing more.

```hcl
output "vpc_id" {
  description = "The ID of the created VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets, for use by app modules"
  value       = aws_subnet.private[*].id
}
```

Don't export every attribute of every resource. That couples consumers to implementation details you might want to change later.

## State is sacred

Remote state, state locking, and a clear separation between environments. Non-negotiable.

```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-prod"
    key            = "app/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

One state file per environment per component. Never share state between dev and prod. Never run `terraform apply` from a laptop against production state.

## The test that matters

The best Terraform test is `terraform plan` in CI on every pull request. If the plan output is clean, the change is probably safe. If it's a wall of red, something is wrong.

Readable infrastructure is a team sport. Write it for the person who has to change it at 2am, because eventually that person is you.

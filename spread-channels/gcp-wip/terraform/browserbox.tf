variable "instance_type" {
  description = "GCE instance type. Larger instances give more performance, but even the smallest should work."
  type        = string
  default     = "n1-standard-1"
}

variable "host_name" {
  description = "Fully-qualified domain name for the running BrowserBox instance to serve from."
  type        = string
}

variable "user_email" {
  description = "Your email address for agreeing to the BrowserBox T&Cs, and LetsEncrypt T&Cs."
  type        = string
}

variable "token" {
  description = "A secret token to construct your login link. Leave blank for a random token to be created."
  type        = string
  default     = ""
}

variable "install_doc_viewer" {
  description = "Whether to install document viewer. (true/false)"
  type        = string
  default     = "false"
}

variable "project" {
  description = "The ID of the project in which the resource belongs."
  type        = string
}

variable "zone" {
  description = "The GCP zone where the instance will be deployed."
  type        = string
  default     = "us-central1-a"
}

variable "machine_image" {
  description = "The machine image for the instance (by default the latest supported)"
  type        = string
  default     = "projects/debian-cloud/global/images/family/debian-9"
}

resource "google_compute_instance" "browserbox_instance" {
  name         = "browserbox-instance"
  machine_type = var.instance_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = var.machine_image
    }
  }

  network_interface {
    network = "default"
    access_config {
      // Ephemeral IP
    }
  }

  metadata_startup_script = <<-EOF
#!/usr/bin/env bash
# Your existing setup script here
EOF

  tags = ["http-server", "https-server"]
}

resource "google_compute_firewall" "browserbox_firewall" {
  name    = "browserbox-firewall"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "8080", "8078", "8079", "8081", "8082"]
  }

  source_ranges = ["0.0.0.0/0"]
}

output "instance_id" {
  description = "The Instance ID of the BrowserBox server"
  value       = google_compute_instance.browserbox_instance.id
}

output "public_ip" {
  description = "The Public IP address of the GCE instance"
  value       = google_compute_instance.browserbox_instance.network_interface[0].access_config[0].nat_ip
}


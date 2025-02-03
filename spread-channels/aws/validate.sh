#!/usr/bin/env bash

aws cloudformation validate-template --template-body file://cloud-formation-template.yaml --region us-west-2


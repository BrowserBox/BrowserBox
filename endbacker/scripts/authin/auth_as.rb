#!/usr/bin/env ruby

require 'rpam'

username = ARGV[0]
password = ARGV[1]

if Rpam.auth(username, password)
  puts 'authentication successful'
  exit 0
else
  puts 'authentication failure'
  exit 1
end

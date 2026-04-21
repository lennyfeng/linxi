#!/bin/bash
sleep 2
curl -s -X POST http://127.0.0.1:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'

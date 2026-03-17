#!/bin/sh

# Health check for frontend application
curl -f http://localhost:3007/ || exit 1

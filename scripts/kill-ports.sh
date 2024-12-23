#!/bin/bash

# Function to kill process on port (Unix/Linux)
kill_port_unix() {
    echo "Attempting to kill process on port $1..."
    fuser -k "$1"/tcp 2>/dev/null || true
}

# Function to kill process on port (macOS)
kill_port_mac() {
    echo "Attempting to kill process on port $1..."
    lsof -i :"$1" -t | xargs kill -9 2>/dev/null || true
}

# Detect OS and use appropriate command
case "$(uname -s)" in
    Linux*)
        kill_port_unix 3000
        kill_port_unix 3002
        ;;
    Darwin*)
        kill_port_mac 3000
        kill_port_mac 3002
        ;;
    *)
        echo "Unsupported operating system"
        exit 1
        ;;
esac

echo "Ports cleared" 
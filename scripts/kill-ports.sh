#!/bin/bash
# This script kills processes running on specified ports
# permission: chmod +x scripts/kill-ports.sh
# command to run: ./scripts/kill-ports.sh

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

# Function to kill process by name
kill_process() {
    echo "Attempting to kill process: $1..."
    pkill -f "$1" 2>/dev/null || true
}

# Detect OS and use appropriate command
case "$(uname -s)" in
    Linux*)
        kill_port_unix 3000
        kill_port_unix 3002
        kill_port_unix 4040  # Ngrok default port
        kill_port_unix 4041  # Ngrok web interface port
        kill_port_unix 11434 # Ollama port
        kill_process "ngrok"  # Kill any remaining ngrok processes
        ;;
    Darwin*)
        kill_port_mac 3000
        kill_port_mac 3002
        kill_port_mac 4040  # Ngrok default port
        kill_port_mac 4041  # Ngrok web interface port
        kill_port_mac 11434 # Ollama port
        killall "ngrok" 2>/dev/null || true  # Kill any remaining ngrok processes
        ;;
    *)
        echo "Unsupported operating system"
        exit 1
        ;;
esac

echo "Ports cleared" 
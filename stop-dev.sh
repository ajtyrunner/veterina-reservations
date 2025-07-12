#!/bin/bash

echo "🛑 Zastavuji dev procesy..."

# Najdi a zastav procesy na portech 3000 a 4000
echo "📍 Hledám procesy na portech 3000 a 4000..."

# Pro macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Port 3000
    PID_3000=$(lsof -ti:3000)
    if [ ! -z "$PID_3000" ]; then
        echo "✅ Zastavuji proces na portu 3000 (PID: $PID_3000)"
        kill -9 $PID_3000
    else
        echo "ℹ️  Port 3000 je volný"
    fi
    
    # Port 4000
    PID_4000=$(lsof -ti:4000)
    if [ ! -z "$PID_4000" ]; then
        echo "✅ Zastavuji proces na portu 4000 (PID: $PID_4000)"
        kill -9 $PID_4000
    else
        echo "ℹ️  Port 4000 je volný"
    fi
else
    # Pro Linux
    # Port 3000
    PID_3000=$(lsof -ti:3000 2>/dev/null)
    if [ ! -z "$PID_3000" ]; then
        echo "✅ Zastavuji proces na portu 3000 (PID: $PID_3000)"
        kill -9 $PID_3000
    else
        echo "ℹ️  Port 3000 je volný"
    fi
    
    # Port 4000
    PID_4000=$(lsof -ti:4000 2>/dev/null)
    if [ ! -z "$PID_4000" ]; then
        echo "✅ Zastavuji proces na portu 4000 (PID: $PID_4000)"
        kill -9 $PID_4000
    else
        echo "ℹ️  Port 4000 je volný"
    fi
fi

# Zastav také ts-node-dev procesy
echo "📍 Hledám ts-node-dev procesy..."
pkill -f "ts-node-dev" 2>/dev/null && echo "✅ Zastaveny ts-node-dev procesy" || echo "ℹ️  Žádné ts-node-dev procesy neběží"

# Zastav také next dev procesy
echo "📍 Hledám next dev procesy..."
pkill -f "next dev" 2>/dev/null && echo "✅ Zastaveny next dev procesy" || echo "ℹ️  Žádné next dev procesy neběží"

echo "✨ Hotovo! Dev prostředí je zastaveno."
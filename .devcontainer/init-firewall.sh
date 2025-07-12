#!/bin/bash
# Dev Container Firewall Initialization Script
# Based on Claude Code security recommendations

set -euo pipefail

echo "🔒 Initializing Dev Container security settings..."

# Function to check if running in container
is_container() {
    [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null
}

# Only run if in container
if ! is_container; then
    echo "⚠️  Not running in a container, skipping firewall setup"
    exit 0
fi

# Check if iptables is available
if ! command -v iptables &> /dev/null; then
    echo "⚠️  iptables not found, skipping firewall setup"
    exit 0
fi

# Check for NET_ADMIN capability
if ! capsh --print | grep -q cap_net_admin; then
    echo "⚠️  NET_ADMIN capability not available, skipping firewall setup"
    exit 0
fi

echo "📋 Setting up firewall rules..."

# Flush existing rules
iptables -F 2>/dev/null || true
iptables -X 2>/dev/null || true

# Set default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# Allow loopback traffic
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow DNS resolution
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT

# Allow HTTPS for package managers and git
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT

# Allow HTTP for package managers
iptables -A OUTPUT -p tcp --dport 80 -j ACCEPT

# Allow SSH for git operations
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT

# Whitelist specific domains for development
ALLOWED_DOMAINS=(
    "github.com"
    "api.github.com"
    "raw.githubusercontent.com"
    "registry.npmjs.org"
    "registry.yarnpkg.com"
    "deb.debian.org"
    "security.debian.org"
    "packages.microsoft.com"
    "*.docker.io"
    "*.docker.com"
    "anthropic.com"
    "api.anthropic.com"
)

echo "🌐 Configuring allowed domains..."
for domain in "${ALLOWED_DOMAINS[@]}"; do
    # Resolve domain to IPs and allow them
    if host "$domain" &>/dev/null; then
        for ip in $(host "$domain" | grep "has address" | awk '{print $4}'); do
            iptables -A OUTPUT -d "$ip" -j ACCEPT 2>/dev/null || true
        done
    fi
done

# Allow internal Docker network communication
iptables -A INPUT -s 172.16.0.0/12 -j ACCEPT
iptables -A OUTPUT -d 172.16.0.0/12 -j ACCEPT

# Log dropped packets (optional, can be verbose)
# iptables -A INPUT -j LOG --log-prefix "DROPPED INPUT: "
# iptables -A OUTPUT -j LOG --log-prefix "DROPPED OUTPUT: "

echo "✅ Firewall rules configured successfully"

# Display current rules
echo ""
echo "📊 Current firewall rules:"
iptables -L -n -v --line-numbers

# Create a script to check firewall status
cat > /usr/local/bin/check-firewall << 'EOF'
#!/bin/bash
echo "🔒 Dev Container Firewall Status"
echo "================================"
echo ""
echo "📊 Current rules:"
iptables -L -n -v --line-numbers
echo ""
echo "🌐 Allowed domains:"
for domain in github.com api.github.com registry.npmjs.org; do
    if timeout 2 nc -zv "$domain" 443 &>/dev/null; then
        echo "✅ $domain:443 - accessible"
    else
        echo "❌ $domain:443 - blocked"
    fi
done
EOF

chmod +x /usr/local/bin/check-firewall

echo ""
echo "💡 To check firewall status later, run: check-firewall"
echo "🎉 Dev Container security initialization complete!"
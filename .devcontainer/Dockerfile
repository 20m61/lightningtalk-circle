# Use the official Node.js image as base
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-20

# Install additional system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    postgresql-client \
    redis-tools \
    jq \
    netcat \
    iputils-ping \
    dnsutils \
    iptables \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    nodemon \
    typescript \
    ts-node \
    jest \
    npm-check-updates \
    concurrently \
    wait-on

# Install zsh and oh-my-zsh for better terminal experience
RUN sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended \
    && chsh -s /bin/zsh node

# Copy and set up zsh configuration
COPY <<EOF /home/node/.zshrc
export ZSH="/home/node/.oh-my-zsh"
ZSH_THEME="robbyrussell"
plugins=(git node npm docker docker-compose)
source \$ZSH/oh-my-zsh.sh

# Node.js aliases
alias nr="npm run"
alias nrd="npm run dev"
alias nrt="npm run test"
alias nrb="npm run build"

# Git aliases
alias gs="git status"
alias gco="git checkout"
alias gcm="git commit -m"
alias gp="git push"
alias gl="git log --oneline --graph --decorate"

# Docker aliases
alias dc="docker-compose"
alias dcu="docker-compose up"
alias dcd="docker-compose down"
alias dcl="docker-compose logs -f"

# Navigation
alias ..="cd .."
alias ...="cd ../.."
alias ll="ls -la"

# Project specific
alias dev="npm run dev"
alias test="npm test"
alias build="npm run build"
alias lint="npm run lint"

# Environment
export NODE_ENV=development
export TZ=Asia/Tokyo

# Path
export PATH=\$PATH:/workspace/node_modules/.bin

# History
export HISTFILE=/commandhistory/.zsh_history
EOF

# Set proper permissions
RUN chown -R node:node /home/node/.zshrc /home/node/.oh-my-zsh

# Create workspace directory
RUN mkdir -p /workspace && chown -R node:node /workspace

# Switch to node user
USER node

# Set working directory
WORKDIR /workspace

# Keep container running
CMD ["sleep", "infinity"]
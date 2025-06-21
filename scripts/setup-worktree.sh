#!/bin/bash
# setup-worktree.sh - Git worktree のセットアップスクリプト

set -e

# カラー出力の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ヘルプ関数
show_help() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

Commands:
    create <branch-name> [worktree-name]   Create a new worktree
    list                                    List all worktrees
    remove <worktree-name>                  Remove a worktree
    clean                                   Clean up merged worktrees
    setup                                   Initial setup for worktree development

Options:
    -h, --help                              Show this help message

Examples:
    $0 create feature/new-feature
    $0 create hotfix/bug-123 hotfix-bug
    $0 list
    $0 remove feature-x
    $0 clean
EOF
}

# ログ関数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# worktree ベースディレクトリ
WORKTREE_BASE="../lightningtalk-worktrees"

# 初期セットアップ
setup_worktree_environment() {
    log_info "Setting up worktree environment..."
    
    # ベースディレクトリの作成
    if [ ! -d "$WORKTREE_BASE" ]; then
        mkdir -p "$WORKTREE_BASE"
        log_info "Created worktree base directory: $WORKTREE_BASE"
    fi
    
    # .gitignore に worktree ディレクトリを追加
    if ! grep -q "lightningtalk-worktrees" .gitignore; then
        echo -e "\n# Git worktrees\n../lightningtalk-worktrees/" >> .gitignore
        log_info "Added worktree directory to .gitignore"
    fi
    
    log_info "Worktree environment setup complete!"
}

# worktree 作成
create_worktree() {
    local branch_name=$1
    local worktree_name=${2:-$(echo $branch_name | sed 's/\//-/g')}
    local worktree_path="$WORKTREE_BASE/$worktree_name"
    
    if [ -z "$branch_name" ]; then
        log_error "Branch name is required"
        exit 1
    fi
    
    # ブランチが存在するかチェック
    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
        log_info "Using existing branch: $branch_name"
        git worktree add "$worktree_path" "$branch_name"
    else
        log_info "Creating new branch: $branch_name"
        git worktree add -b "$branch_name" "$worktree_path"
    fi
    
    if [ $? -eq 0 ]; then
        log_info "Worktree created successfully at: $worktree_path"
        
        # 環境ファイルをコピー
        if [ -f .env.example ]; then
            cp .env.example "$worktree_path/.env"
            log_info "Copied .env.example to worktree"
        fi
        
        # node_modules のシンボリックリンクを作成（オプション）
        if [ -d node_modules ] && [ ! -d "$worktree_path/node_modules" ]; then
            log_info "Creating symlink for node_modules..."
            ln -s "$(pwd)/node_modules" "$worktree_path/node_modules"
        fi
        
        echo -e "\n${GREEN}Next steps:${NC}"
        echo "1. cd $worktree_path"
        echo "2. npm install (if needed)"
        echo "3. Start developing!"
    else
        log_error "Failed to create worktree"
        exit 1
    fi
}

# worktree 一覧表示
list_worktrees() {
    log_info "Current worktrees:"
    git worktree list | while read -r line; do
        echo "  $line"
    done
}

# worktree 削除
remove_worktree() {
    local worktree_name=$1
    local worktree_path="$WORKTREE_BASE/$worktree_name"
    
    if [ -z "$worktree_name" ]; then
        log_error "Worktree name is required"
        exit 1
    fi
    
    if git worktree remove "$worktree_path" 2>/dev/null; then
        log_info "Worktree removed: $worktree_name"
    else
        log_error "Failed to remove worktree. It might be locked or have uncommitted changes."
        log_info "Try: git worktree remove --force $worktree_path"
    fi
}

# マージ済み worktree のクリーンアップ
clean_merged_worktrees() {
    log_info "Cleaning up merged worktrees..."
    
    local cleaned=0
    git worktree list --porcelain | grep -E "^worktree" | while read -r line; do
        local worktree_path=$(echo "$line" | cut -d' ' -f2)
        local branch=$(git worktree list --porcelain | grep -A2 "^worktree $worktree_path" | grep "^branch" | cut -d' ' -f2)
        
        if [ -n "$branch" ] && git branch --merged main | grep -q "^  ${branch}$"; then
            log_info "Removing merged worktree: $worktree_path (branch: $branch)"
            git worktree remove "$worktree_path"
            ((cleaned++))
        fi
    done
    
    if [ $cleaned -eq 0 ]; then
        log_info "No merged worktrees to clean up"
    else
        log_info "Cleaned up $cleaned worktree(s)"
    fi
}

# メイン処理
case "$1" in
    create)
        create_worktree "$2" "$3"
        ;;
    list)
        list_worktrees
        ;;
    remove)
        remove_worktree "$2"
        ;;
    clean)
        clean_merged_worktrees
        ;;
    setup)
        setup_worktree_environment
        ;;
    -h|--help)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
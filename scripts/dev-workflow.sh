#!/bin/bash
# dev-workflow.sh - 開発ワークフロー管理スクリプト

set -e

# カラー出力
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ログ関数
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ヘルプ表示
show_help() {
    cat << EOF
Lightning Talk Circle - Development Workflow Manager

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    start <env>                 Start development environment
        Environments: main, feature, hotfix, all
    
    stop <env>                  Stop development environment
    
    test [type]                 Run tests
        Types: unit, integration, e2e, all
    
    worktree <action>           Manage worktrees
        Actions: create, list, remove, clean
    
    db <action>                 Database operations
        Actions: start, stop, reset, migrate
    
    logs <service>              Show logs for a service
    
    status                      Show development environment status

Examples:
    $0 start main               Start main branch environment
    $0 start feature            Start feature branch environment
    $0 test unit                Run unit tests
    $0 worktree create feature/auth
    $0 db reset                 Reset development database
EOF
}

# 開発環境の開始
start_env() {
    local env=$1
    
    case $env in
        main)
            log_info "Starting main development environment..."
            docker-compose -f docker-compose.dev.yml up -d app-main redis
            ;;
        feature)
            log_info "Starting feature development environment..."
            docker-compose -f docker-compose.dev.yml --profile feature up -d app-feature redis
            ;;
        hotfix)
            log_info "Starting hotfix development environment..."
            docker-compose -f docker-compose.dev.yml --profile hotfix up -d app-hotfix redis
            ;;
        all)
            log_info "Starting all development environments..."
            docker-compose -f docker-compose.dev.yml --profile feature --profile hotfix up -d
            ;;
        *)
            log_error "Invalid environment: $env"
            show_help
            exit 1
            ;;
    esac
    
    log_info "Environment started successfully!"
    log_info "Available URLs:"
    [ "$env" = "main" ] || [ "$env" = "all" ] && echo "  Main: http://localhost:3000"
    [ "$env" = "feature" ] || [ "$env" = "all" ] && echo "  Feature: http://localhost:3001"
    [ "$env" = "hotfix" ] || [ "$env" = "all" ] && echo "  Hotfix: http://localhost:3002"
}

# 開発環境の停止
stop_env() {
    local env=$1
    
    case $env in
        main)
            docker-compose -f docker-compose.dev.yml stop app-main
            ;;
        feature)
            docker-compose -f docker-compose.dev.yml stop app-feature
            ;;
        hotfix)
            docker-compose -f docker-compose.dev.yml stop app-hotfix
            ;;
        all)
            docker-compose -f docker-compose.dev.yml down
            ;;
        *)
            log_error "Invalid environment: $env"
            exit 1
            ;;
    esac
    
    log_info "$env environment stopped"
}

# テスト実行
run_tests() {
    local test_type=${1:-all}
    
    case $test_type in
        unit)
            log_info "Running unit tests..."
            docker-compose -f docker-compose.dev.yml run --rm test-runner npm run test:unit
            ;;
        integration)
            log_info "Running integration tests..."
            docker-compose -f docker-compose.dev.yml run --rm test-runner npm run test:integration
            ;;
        e2e)
            log_info "Running E2E tests..."
            docker-compose -f docker-compose.dev.yml --profile e2e run --rm test-runner npm run test:e2e
            ;;
        all)
            log_info "Running all tests..."
            docker-compose -f docker-compose.dev.yml --profile test run --rm test-runner npm test
            ;;
        coverage)
            log_info "Running tests with coverage..."
            docker-compose -f docker-compose.dev.yml run --rm test-runner npm run test:coverage
            log_info "Coverage report available at: ./coverage/lcov-report/index.html"
            ;;
        *)
            log_error "Invalid test type: $test_type"
            exit 1
            ;;
    esac
}

# Worktree 管理
manage_worktree() {
    local action=$1
    shift
    
    case $action in
        create)
            ./scripts/setup-worktree.sh create "$@"
            ;;
        list)
            ./scripts/setup-worktree.sh list
            ;;
        remove)
            ./scripts/setup-worktree.sh remove "$@"
            ;;
        clean)
            ./scripts/setup-worktree.sh clean
            ;;
        *)
            log_error "Invalid worktree action: $action"
            exit 1
            ;;
    esac
}

# データベース操作
manage_db() {
    local action=$1
    
    case $action in
        start)
            log_info "Starting database..."
            docker-compose -f docker-compose.dev.yml --profile database up -d postgres
            ;;
        stop)
            log_info "Stopping database..."
            docker-compose -f docker-compose.dev.yml stop postgres
            ;;
        reset)
            log_warn "Resetting database (all data will be lost)..."
            read -p "Are you sure? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                docker-compose -f docker-compose.dev.yml down postgres
                docker volume rm lightningtalk-circle_postgres-data 2>/dev/null || true
                docker-compose -f docker-compose.dev.yml --profile database up -d postgres
                log_info "Database reset complete"
            fi
            ;;
        migrate)
            log_info "Running database migrations..."
            # 将来の実装用プレースホルダー
            echo "Database migration feature coming soon..."
            ;;
        *)
            log_error "Invalid database action: $action"
            exit 1
            ;;
    esac
}

# ログ表示
show_logs() {
    local service=$1
    
    if [ -z "$service" ]; then
        docker-compose -f docker-compose.dev.yml logs -f
    else
        docker-compose -f docker-compose.dev.yml logs -f "$service"
    fi
}

# 環境ステータス表示
show_status() {
    log_info "Development Environment Status:"
    echo
    
    # Docker コンテナの状態
    docker-compose -f docker-compose.dev.yml ps
    echo
    
    # Worktree の状態
    if command -v git &> /dev/null; then
        log_info "Git Worktrees:"
        git worktree list 2>/dev/null || echo "  No worktrees found"
    fi
    echo
    
    # ディスク使用量
    log_info "Docker Disk Usage:"
    docker system df
}

# メイン処理
case "$1" in
    start)
        start_env "$2"
        ;;
    stop)
        stop_env "$2"
        ;;
    test)
        run_tests "$2"
        ;;
    worktree)
        manage_worktree "${@:2}"
        ;;
    db)
        manage_db "$2"
        ;;
    logs)
        show_logs "$2"
        ;;
    status)
        show_status
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
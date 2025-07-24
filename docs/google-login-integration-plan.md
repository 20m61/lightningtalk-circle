# Googleログイン統合計画

## 現在の状況

1. **Cognito認証システム**
   - 本番環境: `lightningtalk-auth-v2.auth.ap-northeast-1.amazoncognito.com`
   - クライアントID: `5s4ogan946f0dc19tklh0s1tim`
   - Google IDプロバイダー設定済み

2. **管理者ログイン**
   - `/admin-login.html` - 独立した管理者用ログイン
   - JWTモックトークンで動作

3. **ユーザーログイン**
   - `/user-login.html` - 新規作成（一般ユーザー用）
   - Googleログインボタン実装

## 実装オプション

### オプション1: ヘッダーにログインボタン追加（推奨）

```javascript
// index.htmlのヘッダーに追加
<div class="auth-container">
  <button id="loginBtn" class="login-btn" onclick="window.location.href='/user-login.html'">
    ログイン
  </button>
  <div id="userInfo" class="user-info" style="display: none;">
    <img id="userAvatar" class="user-avatar" src="" alt="">
    <span id="userName"></span>
    <button onclick="logout()">ログアウト</button>
  </div>
</div>
```

### オプション2: モーダルでのログイン

```javascript
// 参加登録時にログインモーダルを表示
function showLoginModal() {
  if (!isLoggedIn()) {
    // ログインモーダルを表示
    const modal = document.getElementById('loginModal');
    modal.style.display = 'block';
  }
}
```

### オプション3: 条件付き表示

```javascript
// ログイン状態に応じてUIを変更
function updateUIForAuth() {
  const isAuthenticated = !!localStorage.getItem('id_token');
  
  if (isAuthenticated) {
    // ログイン済み: 参加登録ボタンを表示
    document.querySelector('.register-btn').style.display = 'block';
  } else {
    // 未ログイン: ログインボタンを表示
    document.querySelector('.login-prompt').style.display = 'block';
  }
}
```

## 実装手順

### 1. メインページの更新

```html
<!-- index.html のヘッダー部分 -->
<header class="navbar">
  <div class="container">
    <nav>
      <!-- 既存のナビゲーション -->
    </nav>
    <div class="auth-section">
      <button id="authButton" class="auth-button">
        ログイン / 登録
      </button>
    </div>
  </div>
</header>
```

### 2. 認証状態の管理

```javascript
// auth-state.js
class AuthStateManager {
  constructor() {
    this.checkAuthState();
    this.setupEventListeners();
  }

  checkAuthState() {
    const token = localStorage.getItem('id_token');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
      this.showAuthenticatedState(JSON.parse(user));
    } else {
      this.showUnauthenticatedState();
    }
  }

  showAuthenticatedState(user) {
    // ユーザー情報を表示
    document.getElementById('authButton').innerHTML = `
      <img src="${user.picture || '/icons/user-default.svg'}" alt="${user.name}">
      <span>${user.name}</span>
    `;
  }

  showUnauthenticatedState() {
    // ログインボタンを表示
    document.getElementById('authButton').innerHTML = 'ログイン / 登録';
    document.getElementById('authButton').onclick = () => {
      window.location.href = '/user-login.html';
    };
  }
}
```

### 3. 参加登録フローの更新

```javascript
// registration.js
async function handleRegistration(eventId) {
  // 認証チェック
  if (!isAuthenticated()) {
    // ログインページへリダイレクト（戻り先を保存）
    localStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = '/user-login.html';
    return;
  }
  
  // 認証済みの場合は登録処理を続行
  const user = JSON.parse(localStorage.getItem('currentUser'));
  const registrationData = {
    eventId,
    userId: user.id,
    email: user.email,
    name: user.name
  };
  
  // API呼び出し
  await submitRegistration(registrationData);
}
```

## セキュリティ考慮事項

1. **トークン管理**
   - JWTトークンの有効期限チェック
   - リフレッシュトークンの実装
   - セキュアなストレージ（HttpOnly Cookie推奨）

2. **CORS設定**
   - Cognito URLを許可リストに追加
   - APIエンドポイントのCORS設定

3. **XSS対策**
   - ユーザー入力のサニタイズ
   - CSPヘッダーの適切な設定

## 移行計画

### フェーズ1: 基本実装（現在）
- [x] 管理者ログイン分離
- [x] ユーザーログインページ作成
- [ ] メインページへの統合

### フェーズ2: 機能拡張
- [ ] ユーザープロフィール機能
- [ ] 参加履歴表示
- [ ] トーク申し込み管理

### フェーズ3: 最適化
- [ ] SSO（シングルサインオン）
- [ ] モバイルアプリ対応
- [ ] 多要素認証（MFA）

## テスト計画

1. **ローカルテスト**
   - モックモードでの動作確認
   - UIの表示確認

2. **統合テスト**
   - Cognito接続テスト
   - Google OAuth フロー確認

3. **本番テスト**
   - 実際のGoogleアカウントでのテスト
   - エラーハンドリング確認
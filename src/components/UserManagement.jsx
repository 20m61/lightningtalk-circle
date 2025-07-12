/**
 * User Management Component
 * Admin panel for managing users
 */

import React, { useState, useEffect } from 'react';
import authService from '../services/authService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getUsers();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async e => {
    e.preventDefault();
    try {
      await authService.register(formData);
      setShowCreateForm(false);
      setFormData({ email: '', name: '', password: '', role: 'user' });
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateUser = async userId => {
    try {
      await authService.updateUser(userId, {
        name: editingUser.name,
        role: editingUser.role
      });
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async userId => {
    if (!window.confirm('このユーザを削除してもよろしいですか？')) {
      return;
    }

    try {
      await authService.deleteUser(userId);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!authService.isAdmin()) {
    return (
      <div className="user-management-container">
        <div className="alert alert-error">管理者権限が必要です</div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h2>ユーザ管理</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
          新規ユーザ作成
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">
            ×
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>新規ユーザ作成</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>メールアドレス</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>名前</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>パスワード</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
                <small>8文字以上、大文字・小文字・数字・特殊文字を含む</small>
              </div>
              <div className="form-group">
                <label>役割</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">一般ユーザ</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  作成
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>メールアドレス</th>
                <th>名前</th>
                <th>役割</th>
                <th>プロバイダー</th>
                <th>最終ログイン</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    {editingUser?.id === user.id ? (
                      <input
                        type="text"
                        value={editingUser.name}
                        onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                      />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td>
                    {editingUser?.id === user.id ? (
                      <select
                        value={editingUser.role}
                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                      >
                        <option value="user">一般ユーザ</option>
                        <option value="admin">管理者</option>
                      </select>
                    ) : (
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === 'admin' ? '管理者' : '一般ユーザ'}
                      </span>
                    )}
                  </td>
                  <td>
                    {user.provider === 'google' ? (
                      <span className="provider-badge provider-google">
                        <i className="fab fa-google"></i> Google
                      </span>
                    ) : (
                      <span className="provider-badge provider-email">
                        <i className="fas fa-envelope"></i> メール
                      </span>
                    )}
                  </td>
                  <td>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString('ja-JP')
                      : '未ログイン'}
                  </td>
                  <td className="user-actions">
                    {editingUser?.id === user.id ? (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdateUser(user.id)}
                        >
                          保存
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setEditingUser(null)}
                        >
                          キャンセル
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setEditingUser(user)}
                          disabled={user.id === authService.user?.id}
                        >
                          編集
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === authService.user?.id}
                        >
                          削除
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { authService } from '../lib/auth';

export const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [step, setStep] = useState('form'); // 'form' or 'verify'
  const [error, setError] = useState('');

  const handleChange = e => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError('パスワードが一致しません');
          return;
        }

        const result = await authService.signUp(
          formData.email,
          formData.password,
          formData.fullName
        );

        if (result.success) {
          setStep('verify');
        } else {
          setError(result.error || 'アカウント作成に失敗しました');
        }
      } else {
        const result = await authService.signIn(formData.email, formData.password);

        if (result.success) {
          onSuccess?.(result.user);
          onClose();
        } else {
          setError(result.error || 'ログインに失敗しました');
        }
      }
    } catch (error) {
      setError('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.confirmSignUp(formData.email, formData.verificationCode);

      if (result.success) {
        // After verification, sign in automatically
        const signInResult = await authService.signIn(formData.email, formData.password);

        if (signInResult.success) {
          onSuccess?.(signInResult.user);
          onClose();
        } else {
          setMode('signin');
          setStep('form');
          setError('アカウントが確認されました。ログインしてください。');
        }
      } else {
        setError(result.error || '確認コードが無効です');
      }
    } catch (error) {
      setError('確認に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = provider => {
    try {
      if (provider === 'google') {
        authService.googleSignIn();
      } else if (provider === 'apple') {
        // Apple Sign-In will be implemented when available
        setError('Apple Sign-Inは現在準備中です');
      }
    } catch (error) {
      setError('ソーシャルログインでエラーが発生しました');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      confirmPassword: '',
      verificationCode: ''
    });
    setStep('form');
    setError('');
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'verify' ? 'メール確認' : mode === 'signin' ? 'ログイン' : 'アカウント作成'}
      size="md"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {step === 'verify' ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {formData.email} に確認コードを送信しました。
                <br />
                メールをご確認ください。
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">確認コード</label>
              <input
                type="text"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleChange}
                required
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="123456"
              />
            </div>

            <Button type="submit" variant="primary" fullWidth loading={isLoading}>
              確認する
            </Button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="山田 太郎"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="example@domain.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="8文字以上"
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード確認
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="パスワードを再入力"
                  />
                </div>
              )}

              <Button type="submit" variant="primary" fullWidth loading={isLoading}>
                {mode === 'signin' ? 'ログイン' : 'アカウント作成'}
              </Button>
            </form>

            {/* Social Login */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => handleSocialLogin('google')}
                icon="🌐"
              >
                Googleでログイン
              </Button>

              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => handleSocialLogin('apple')}
                icon="🍎"
              >
                Appleでログイン
              </Button>
            </div>

            {/* Switch Mode */}
            <div className="text-center">
              <button
                type="button"
                onClick={switchMode}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {mode === 'signin'
                  ? 'アカウントをお持ちでない方はこちら'
                  : 'すでにアカウントをお持ちの方はこちら'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

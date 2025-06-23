/**
 * Registration Form Component
 * Lightning Talk イベントの参加登録フォーム
 */

import React, { useState, useEffect } from 'react';
import { useWordPressPost } from '../hooks/useWordPressApi';

interface RegistrationData {
  name: string;
  email: string;
  eventId: string;
  participationType: 'listener' | 'speaker' | 'both';
  talkTitle?: string;
  talkDescription?: string;
  category?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  dietaryRestrictions?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  marketingConsent: boolean;
  privacyConsent: boolean;
  message?: string;
}

interface RegistrationFormProps {
  eventId?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  eventId,
  onSuccess,
  onError
}) => {
  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    eventId: eventId || '',
    participationType: 'listener',
    emergencyContact: { name: '', phone: '' },
    marketingConsent: false,
    privacyConsent: false
  });

  const [showTalkForm, setShowTalkForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { post, loading, error } = useWordPressPost('/lightningtalk/v1/register');

  useEffect(() => {
    // URL パラメータからイベントIDを取得
    if (!eventId) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlEventId = urlParams.get('event');
      if (urlEventId) {
        setFormData(prev => ({ ...prev, eventId: urlEventId }));
      }
    }
  }, [eventId]);

  useEffect(() => {
    // 参加タイプが変更された時の処理
    setShowTalkForm(formData.participationType === 'speaker' || formData.participationType === 'both');
  }, [formData.participationType]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name.includes('.')) {
      // ネストされたプロパティの処理（emergencyContact.nameなど）
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof RegistrationData] as object),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // バリデーションエラーをクリア
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 必須フィールドの検証
    if (!formData.name.trim()) {
      errors.name = 'お名前を入力してください';
    }

    if (!formData.email.trim()) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.eventId) {
      errors.eventId = 'イベントを選択してください';
    }

    // 発表者の場合の追加検証
    if (showTalkForm) {
      if (!formData.talkTitle?.trim()) {
        errors.talkTitle = '発表タイトルを入力してください';
      }
      if (!formData.talkDescription?.trim()) {
        errors.talkDescription = '発表概要を入力してください';
      }
    }

    // プライバシーポリシー同意の確認
    if (!formData.privacyConsent) {
      errors.privacyConsent = 'プライバシーポリシーに同意していただく必要があります';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await post(formData);
      
      if (result) {
        setSubmitted(true);
        onSuccess?.(result);
        
        // 成功メッセージの表示
        setTimeout(() => {
          setSubmitted(false);
          // フォームリセット
          setFormData({
            name: '',
            email: '',
            eventId: formData.eventId, // イベントIDは保持
            participationType: 'listener',
            emergencyContact: { name: '', phone: '' },
            marketingConsent: false,
            privacyConsent: false
          });
        }, 3000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登録に失敗しました';
      onError?.(errorMessage);
    }
  };

  if (submitted) {
    return (
      <div className="registration-success">
        <div className="success-message">
          <h3>✅ 登録完了</h3>
          <p>参加登録が完了しました。確認メールをお送りしましたので、ご確認ください。</p>
          <p>Lightning Talkイベントでお会いできることを楽しみにしています！</p>
        </div>
      </div>
    );
  }

  return (
    <form className="registration-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h3>基本情報</h3>
        
        <div className="form-group">
          <label htmlFor="name">お名前 *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={validationErrors.name ? 'error' : ''}
            required
          />
          {validationErrors.name && <span className="error-message">{validationErrors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">メールアドレス *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={validationErrors.email ? 'error' : ''}
            required
          />
          {validationErrors.email && <span className="error-message">{validationErrors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="participationType">参加形式 *</label>
          <select
            id="participationType"
            name="participationType"
            value={formData.participationType}
            onChange={handleInputChange}
            required
          >
            <option value="listener">聴講のみ</option>
            <option value="speaker">発表のみ</option>
            <option value="both">発表 + 聴講</option>
          </select>
        </div>
      </div>

      {showTalkForm && (
        <div className="form-section">
          <h3>発表情報</h3>
          
          <div className="form-group">
            <label htmlFor="talkTitle">発表タイトル *</label>
            <input
              type="text"
              id="talkTitle"
              name="talkTitle"
              value={formData.talkTitle || ''}
              onChange={handleInputChange}
              className={validationErrors.talkTitle ? 'error' : ''}
              required
            />
            {validationErrors.talkTitle && <span className="error-message">{validationErrors.talkTitle}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="talkDescription">発表概要 *</label>
            <textarea
              id="talkDescription"
              name="talkDescription"
              value={formData.talkDescription || ''}
              onChange={handleInputChange}
              className={validationErrors.talkDescription ? 'error' : ''}
              rows={4}
              required
            />
            {validationErrors.talkDescription && <span className="error-message">{validationErrors.talkDescription}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category">カテゴリー</label>
            <select
              id="category"
              name="category"
              value={formData.category || ''}
              onChange={handleInputChange}
            >
              <option value="">選択してください</option>
              <option value="tech">技術</option>
              <option value="business">ビジネス</option>
              <option value="design">デザイン</option>
              <option value="career">キャリア</option>
              <option value="hobby">趣味</option>
              <option value="other">その他</option>
            </select>
          </div>
        </div>
      )}

      <div className="form-section">
        <h3>連絡先情報</h3>
        
        <div className="form-group">
          <label htmlFor="phone">電話番号</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="company">所属企業・団体</label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="jobTitle">職種・役職</label>
          <input
            type="text"
            id="jobTitle"
            name="jobTitle"
            value={formData.jobTitle || ''}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>緊急連絡先</h3>
        
        <div className="form-group">
          <label htmlFor="emergencyContact.name">緊急連絡先名</label>
          <input
            type="text"
            id="emergencyContact.name"
            name="emergencyContact.name"
            value={formData.emergencyContact?.name || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="emergencyContact.phone">緊急連絡先電話番号</label>
          <input
            type="tel"
            id="emergencyContact.phone"
            name="emergencyContact.phone"
            value={formData.emergencyContact?.phone || ''}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>その他</h3>
        
        <div className="form-group">
          <label htmlFor="dietaryRestrictions">食事制限・アレルギー</label>
          <textarea
            id="dietaryRestrictions"
            name="dietaryRestrictions"
            value={formData.dietaryRestrictions || ''}
            onChange={handleInputChange}
            rows={2}
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">メッセージ・質問等</label>
          <textarea
            id="message"
            name="message"
            value={formData.message || ''}
            onChange={handleInputChange}
            rows={3}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>同意事項</h3>
        
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="marketingConsent"
              checked={formData.marketingConsent}
              onChange={handleInputChange}
            />
            今後のイベント情報の受け取りを希望する
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="privacyConsent"
              checked={formData.privacyConsent}
              onChange={handleInputChange}
              required
            />
            プライバシーポリシーに同意する *
          </label>
          {validationErrors.privacyConsent && <span className="error-message">{validationErrors.privacyConsent}</span>}
        </div>
      </div>

      {error && (
        <div className="form-error">
          <p>エラー: {error}</p>
        </div>
      )}

      <div className="form-submit">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? '送信中...' : '参加登録する'}
        </button>
      </div>
    </form>
  );
};
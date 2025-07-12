import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export const EventRegistrationModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    participationType: 'onsite',
    talkTitle: '',
    talkDescription: '',
    isPresenter: false,
    dietaryRestrictions: '',
    emergencyContact: '',
    // Honeypot fields
    website: '',
    url: '',
    homepage: '',
    _formStartTime: Date.now()
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
    // Reset form
    setFormData({
      name: '',
      email: '',
      participationType: 'onsite',
      talkTitle: '',
      talkDescription: '',
      isPresenter: false,
      dietaryRestrictions: '',
      emergencyContact: ''
    });
    setCurrentStep(1);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">基本情報</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="山田 太郎"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="taro@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                参加方法 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-primary-50 transition-colors">
                  <input
                    type="radio"
                    name="participationType"
                    value="onsite"
                    checked={formData.participationType === 'onsite'}
                    onChange={handleChange}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-3">
                    <span className="block font-medium">会場参加</span>
                    <span className="block text-sm text-gray-500">会場で直接参加します</span>
                  </span>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-primary-50 transition-colors">
                  <input
                    type="radio"
                    name="participationType"
                    value="online"
                    checked={formData.participationType === 'online'}
                    onChange={handleChange}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-3">
                    <span className="block font-medium">オンライン参加</span>
                    <span className="block text-sm text-gray-500">Zoomで参加します</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">発表について</h4>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPresenter"
                  checked={formData.isPresenter}
                  onChange={handleChange}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  ライトニングトークで発表する
                </span>
              </label>
            </div>

            {formData.isPresenter && (
              <>
                <div className="animate-slide-up">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    発表タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="talkTitle"
                    value={formData.talkTitle}
                    onChange={handleChange}
                    required={formData.isPresenter}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="5分で分かる○○の魅力"
                  />
                </div>

                <div className="animate-slide-up">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    発表内容の概要
                  </label>
                  <textarea
                    name="talkDescription"
                    value={formData.talkDescription}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="どんな内容を話すか簡単に教えてください"
                  />
                </div>
              </>
            )}

            {formData.participationType === 'onsite' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  食事制限・アレルギー
                </label>
                <input
                  type="text"
                  name="dietaryRestrictions"
                  value={formData.dietaryRestrictions}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="ベジタリアン、卵アレルギーなど"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">確認・その他</h4>

            {formData.participationType === 'onsite' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">緊急連絡先</label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="090-1234-5678"
                />
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">登録内容の確認</h5>
              <dl className="space-y-1 text-sm">
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-24">お名前:</dt>
                  <dd className="text-gray-900">{formData.name || '未入力'}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-24">メール:</dt>
                  <dd className="text-gray-900">{formData.email || '未入力'}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-24">参加方法:</dt>
                  <dd className="text-gray-900">
                    {formData.participationType === 'onsite' ? '会場参加' : 'オンライン参加'}
                  </dd>
                </div>
                {formData.isPresenter && (
                  <div className="flex">
                    <dt className="font-medium text-gray-600 w-24">発表:</dt>
                    <dd className="text-gray-900">{formData.talkTitle}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-sm text-primary-800">
                ✨ 登録完了後、確認メールをお送りします。
                <br />
                📧 イベント前日にリマインダーメールをお送りします。
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="イベント参加登録" size="lg">
      <form onSubmit={handleSubmit}>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map(step => (
              <div key={step} className={`flex-1 ${step < 3 ? 'mr-2' : ''}`}>
                <div
                  className={`h-2 rounded-full transition-colors ${
                    step <= currentStep
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600'
                      : 'bg-gray-200'
                  }`}
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            ステップ {currentStep} / {totalSteps}
          </p>
        </div>

        {/* Form content */}
        <div className="min-h-[300px]">
          {renderStep()}

          {/* Honeypot fields - hidden from users */}
          <div
            style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden' }}
          >
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              tabIndex="-1"
              autoComplete="off"
            />
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              tabIndex="-1"
              autoComplete="off"
            />
            <input
              type="text"
              name="homepage"
              value={formData.homepage}
              onChange={handleChange}
              tabIndex="-1"
              autoComplete="off"
            />
            <input type="hidden" name="_formStartTime" value={formData._formStartTime} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 1}>
            戻る
          </Button>

          <div className="space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>

            {currentStep < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                次へ
              </Button>
            ) : (
              <Button type="submit" variant="primary" icon="🎉">
                登録する
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

/**
 * Enhanced Form System
 * インライン検証、自動保存、プログレス表示を含む高度なフォームUX
 */

class FormEnhancements {
  constructor(form, options = {}) {
    this.form = form;
    this.options = {
      autoSave: options.autoSave !== false,
      autoSaveInterval: options.autoSaveInterval || 30000, // 30秒
      inlineValidation: options.inlineValidation !== false,
      showProgress: options.showProgress !== false,
      animateErrors: options.animateErrors !== false,
      passwordStrength: options.passwordStrength !== false,
      ...options
    };

    this.fields = new Map();
    this.validators = new Map();
    this.autoSaveTimer = null;
    this.formId = form.id || `form-${Date.now()}`;

    this.init();
  }

  init() {
    // フォームフィールドの初期化
    this.initializeFields();

    // バリデーターの設定
    this.setupValidators();

    // インライン検証の設定
    if (this.options.inlineValidation) {
      this.setupInlineValidation();
    }

    // 自動保存の設定
    if (this.options.autoSave) {
      this.setupAutoSave();
      this.restoreFormData();
    }

    // プログレス表示の設定
    if (this.options.showProgress) {
      this.setupProgressIndicator();
    }

    // パスワード強度メーターの設定
    if (this.options.passwordStrength) {
      this.setupPasswordStrength();
    }

    // フォーム送信の拡張
    this.enhanceFormSubmission();

    // アクセシビリティの強化
    this.enhanceAccessibility();
  }

  initializeFields() {
    const fields = this.form.querySelectorAll('input, textarea, select');

    fields.forEach(field => {
      const fieldData = {
        element: field,
        name: field.name,
        type: field.type || 'text',
        required: field.required,
        pattern: field.pattern,
        minLength: field.minLength,
        maxLength: field.maxLength,
        min: field.min,
        max: field.max,
        validationMessage: field.dataset.validationMessage || '',
        pristine: true,
        valid: true,
        errors: []
      };

      this.fields.set(field.name, fieldData);

      // カスタムバリデーション属性
      if (field.dataset.validate) {
        this.parseCustomValidation(field);
      }
    });
  }

  setupValidators() {
    // 組み込みバリデーター
    this.validators.set('required', {
      validate: value => value.trim().length > 0,
      message: 'このフィールドは必須です'
    });

    this.validators.set('email', {
      validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: '有効なメールアドレスを入力してください'
    });

    this.validators.set('phone', {
      validate: value => /^[0-9\-+()\\s]+$/.test(value.replace(/\s/g, '')),
      message: '有効な電話番号を入力してください'
    });

    this.validators.set('url', {
      validate: value => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: '有効なURLを入力してください'
    });

    this.validators.set('minLength', {
      validate: (value, param) => value.length >= parseInt(param),
      message: param => `${param}文字以上で入力してください`
    });

    this.validators.set('maxLength', {
      validate: (value, param) => value.length <= parseInt(param),
      message: param => `${param}文字以内で入力してください`
    });

    this.validators.set('pattern', {
      validate: (value, param) => new RegExp(param).test(value),
      message: 'フォーマットが正しくありません'
    });

    this.validators.set('match', {
      validate: (value, param) => {
        const targetField = this.form.querySelector(`[name="${param}"]`);
        return targetField && value === targetField.value;
      },
      message: param => `${param}と一致しません`
    });

    this.validators.set('strength', {
      validate: value => this.calculatePasswordStrength(value).score >= 3,
      message: 'パスワードが弱すぎます'
    });
  }

  parseCustomValidation(field) {
    const rules = field.dataset.validate.split('|');
    const fieldData = this.fields.get(field.name);

    fieldData.customValidators = rules.map(rule => {
      const [name, param] = rule.split(':');
      return { name, param };
    });
  }

  setupInlineValidation() {
    this.fields.forEach((fieldData, name) => {
      const field = fieldData.element;

      // フォーカスアウト時の検証
      field.addEventListener('blur', () => {
        if (!fieldData.pristine) {
          this.validateField(name);
        }
      });

      // 入力中のリアルタイム検証（デバウンス付き）
      let debounceTimer;
      field.addEventListener('input', () => {
        fieldData.pristine = false;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.validateField(name);
        }, 300);

        // 文字数カウンター更新
        this.updateCharacterCount(field);
      });

      // ペースト時の検証
      field.addEventListener('paste', () => {
        setTimeout(() => this.validateField(name), 100);
      });
    });
  }

  validateField(name) {
    const fieldData = this.fields.get(name);
    if (!fieldData) return true;

    const field = fieldData.element;
    const value = field.value;
    const errors = [];

    // HTML5バリデーション
    if (!field.validity.valid) {
      if (field.validity.valueMissing && fieldData.required) {
        errors.push(this.validators.get('required').message);
      }
      if (field.validity.typeMismatch) {
        errors.push(`有効な${field.type}を入力してください`);
      }
      if (field.validity.patternMismatch) {
        errors.push(fieldData.validationMessage || this.validators.get('pattern').message);
      }
      if (field.validity.tooShort) {
        errors.push(this.validators.get('minLength').message(field.minLength));
      }
      if (field.validity.tooLong) {
        errors.push(this.validators.get('maxLength').message(field.maxLength));
      }
    }

    // カスタムバリデーション
    if (fieldData.customValidators) {
      fieldData.customValidators.forEach(({ name, param }) => {
        const validator = this.validators.get(name);
        if (validator && !validator.validate(value, param)) {
          const message =
            typeof validator.message === 'function' ? validator.message(param) : validator.message;
          errors.push(message);
        }
      });
    }

    // 結果の更新
    fieldData.valid = errors.length === 0;
    fieldData.errors = errors;

    // UI更新
    this.updateFieldUI(fieldData);

    return fieldData.valid;
  }

  updateFieldUI(fieldData) {
    const field = fieldData.element;
    const wrapper = field.closest('.form-field') || field.parentElement;
    const errorContainer =
      wrapper.querySelector('.field-error') || this.createErrorContainer(wrapper);

    // 既存のエラー表示をクリア
    errorContainer.innerHTML = '';
    field.classList.remove('is-valid', 'is-invalid');

    if (!fieldData.pristine) {
      if (fieldData.valid) {
        field.classList.add('is-valid');
        this.showSuccessIcon(field);
      } else {
        field.classList.add('is-invalid');
        this.showErrorIcon(field);

        // エラーメッセージ表示
        fieldData.errors.forEach(error => {
          const errorElement = document.createElement('div');
          errorElement.className = 'error-message';
          errorElement.textContent = error;
          errorContainer.appendChild(errorElement);
        });

        // アニメーション
        if (this.options.animateErrors) {
          field.classList.add('error-shake');
          setTimeout(() => field.classList.remove('error-shake'), 500);
        }
      }
    }

    // ARIA属性の更新
    field.setAttribute('aria-invalid', !fieldData.valid);
    field.setAttribute('aria-describedby', errorContainer.id);
  }

  createErrorContainer(wrapper) {
    const container = document.createElement('div');
    container.className = 'field-error';
    container.id = `error-${Date.now()}`;
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'polite');
    wrapper.appendChild(container);
    return container;
  }

  showSuccessIcon(field) {
    const icon =
      field.parentElement.querySelector('.validation-icon') || this.createValidationIcon(field);
    icon.innerHTML = `
      <svg class="icon-success" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
    `;
    icon.className = 'validation-icon success';
  }

  showErrorIcon(field) {
    const icon =
      field.parentElement.querySelector('.validation-icon') || this.createValidationIcon(field);
    icon.innerHTML = `
      <svg class="icon-error" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
    `;
    icon.className = 'validation-icon error';
  }

  createValidationIcon(field) {
    const icon = document.createElement('span');
    icon.className = 'validation-icon';
    field.parentElement.style.position = 'relative';
    field.parentElement.appendChild(icon);
    return icon;
  }

  setupAutoSave() {
    const triggerAutoSave = () => {
      this.saveFormData();
      this.showAutoSaveIndicator();
    };

    // 定期的な自動保存
    this.autoSaveTimer = setInterval(triggerAutoSave, this.options.autoSaveInterval);

    // 入力時の自動保存（デバウンス付き）
    let inputTimer;
    this.form.addEventListener('input', () => {
      clearTimeout(inputTimer);
      inputTimer = setTimeout(triggerAutoSave, 2000);
    });

    // ページ離脱時の保存
    window.addEventListener('beforeunload', () => {
      this.saveFormData();
    });
  }

  saveFormData() {
    const formData = {};

    this.fields.forEach((fieldData, name) => {
      const field = fieldData.element;

      if (field.type === 'checkbox') {
        formData[name] = field.checked;
      } else if (field.type === 'radio') {
        if (field.checked) {
          formData[name] = field.value;
        }
      } else {
        formData[name] = field.value;
      }
    });

    localStorage.setItem(
      `form-autosave-${this.formId}`,
      JSON.stringify({
        data: formData,
        timestamp: Date.now()
      })
    );
  }

  restoreFormData() {
    const saved = localStorage.getItem(`form-autosave-${this.formId}`);
    if (!saved) return;

    const { data, timestamp } = JSON.parse(saved);

    // 24時間以内のデータのみ復元
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`form-autosave-${this.formId}`);
      return;
    }

    // 復元確認
    if (Object.keys(data).some(key => data[key])) {
      this.showRestorePrompt(data);
    }
  }

  showRestorePrompt(data) {
    const prompt = document.createElement('div');
    prompt.className = 'autosave-prompt';
    prompt.innerHTML = `
      <div class="prompt-content">
        <p>以前の入力内容が保存されています。復元しますか？</p>
        <div class="prompt-actions">
          <button class="btn-restore">復元する</button>
          <button class="btn-discard">破棄する</button>
        </div>
      </div>
    `;

    this.form.insertBefore(prompt, this.form.firstChild);

    prompt.querySelector('.btn-restore').addEventListener('click', () => {
      this.restoreData(data);
      prompt.remove();
    });

    prompt.querySelector('.btn-discard').addEventListener('click', () => {
      localStorage.removeItem(`form-autosave-${this.formId}`);
      prompt.remove();
    });
  }

  restoreData(data) {
    Object.entries(data).forEach(([name, value]) => {
      const fieldData = this.fields.get(name);
      if (!fieldData) return;

      const field = fieldData.element;

      if (field.type === 'checkbox') {
        field.checked = value;
      } else if (field.type === 'radio') {
        const radio = this.form.querySelector(`input[name="${name}"][value="${value}"]`);
        if (radio) radio.checked = true;
      } else {
        field.value = value;
      }

      // 復元後の検証
      fieldData.pristine = false;
      this.validateField(name);
    });
  }

  showAutoSaveIndicator() {
    const indicator =
      document.getElementById('autosave-indicator') || this.createAutoSaveIndicator();

    indicator.textContent = '保存中...';
    indicator.classList.add('saving');

    setTimeout(() => {
      indicator.textContent = '自動保存されました';
      indicator.classList.remove('saving');

      setTimeout(() => {
        indicator.classList.remove('visible');
      }, 2000);
    }, 500);
  }

  createAutoSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'autosave-indicator';
    indicator.className = 'autosave-indicator';
    document.body.appendChild(indicator);
    return indicator;
  }

  setupProgressIndicator() {
    const progress = document.createElement('div');
    progress.className = 'form-progress';
    progress.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-text">
        <span class="progress-current">0</span> / <span class="progress-total">0</span> 完了
      </div>
    `;

    this.form.insertBefore(progress, this.form.firstChild);
    this.updateProgress();

    // フィールド変更時の進捗更新
    this.form.addEventListener('input', () => this.updateProgress());
  }

  updateProgress() {
    const total = this.fields.size;
    let completed = 0;

    this.fields.forEach(fieldData => {
      const field = fieldData.element;
      if (field.value || (field.type === 'checkbox' && field.checked)) {
        completed++;
      }
    });

    const percentage = (completed / total) * 100;
    const progressBar = this.form.querySelector('.progress-fill');
    const progressCurrent = this.form.querySelector('.progress-current');
    const progressTotal = this.form.querySelector('.progress-total');

    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
      progressCurrent.textContent = completed;
      progressTotal.textContent = total;
    }
  }

  updateCharacterCount(field) {
    const maxLength = field.maxLength;
    if (maxLength <= 0) return;

    const wrapper = field.closest('.form-field') || field.parentElement;
    let counter = wrapper.querySelector('.character-counter');

    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'character-counter';
      wrapper.appendChild(counter);
    }

    const current = field.value.length;
    const remaining = maxLength - current;

    counter.textContent = `${current} / ${maxLength}`;
    counter.classList.toggle('warning', remaining < 20);
    counter.classList.toggle('danger', remaining < 10);
  }

  setupPasswordStrength() {
    const passwordFields = this.form.querySelectorAll('input[type="password"]');

    passwordFields.forEach(field => {
      const meter = document.createElement('div');
      meter.className = 'password-strength-meter';
      meter.innerHTML = `
        <div class="strength-bar">
          <div class="strength-fill"></div>
        </div>
        <div class="strength-text"></div>
      `;

      field.parentElement.appendChild(meter);

      field.addEventListener('input', () => {
        const strength = this.calculatePasswordStrength(field.value);
        this.updatePasswordStrengthUI(meter, strength);
      });
    });
  }

  calculatePasswordStrength(password) {
    let score = 0;
    const feedback = [];

    // 長さ
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    else feedback.push('12文字以上にすることを推奨');

    // 複雑さ
    if (/[a-z]/.test(password)) score++;
    else feedback.push('小文字を含める');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('大文字を含める');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('数字を含める');

    if (/[^a-zA-Z0-9]/.test(password)) score++;
    else feedback.push('記号を含める');

    // 一般的なパスワードチェック
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      score = Math.max(0, score - 2);
      feedback.push('より複雑なパスワードを使用');
    }

    const levels = ['非常に弱い', '弱い', '普通', '強い', '非常に強い'];
    const level = Math.min(Math.floor(score / 1.4), levels.length - 1);

    return {
      score,
      level,
      text: levels[level],
      feedback
    };
  }

  updatePasswordStrengthUI(meter, strength) {
    const fill = meter.querySelector('.strength-fill');
    const text = meter.querySelector('.strength-text');

    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997'];
    const widths = ['20%', '40%', '60%', '80%', '100%'];

    fill.style.width = widths[strength.level];
    fill.style.backgroundColor = colors[strength.level];
    text.textContent = strength.text;

    // フィードバック表示
    if (strength.feedback.length > 0) {
      text.title = strength.feedback.join('\n');
    }
  }

  enhanceFormSubmission() {
    this.form.addEventListener('submit', async e => {
      e.preventDefault();

      // 全フィールドの検証
      let isValid = true;
      this.fields.forEach((fieldData, name) => {
        fieldData.pristine = false;
        if (!this.validateField(name)) {
          isValid = false;
        }
      });

      if (!isValid) {
        // 最初のエラーフィールドにフォーカス
        const firstError = Array.from(this.fields.values()).find(f => !f.valid);
        if (firstError) {
          firstError.element.focus();
          firstError.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // エラー通知
        if (this.options.onValidationError) {
          this.options.onValidationError(this.getErrors());
        }

        return;
      }

      // 送信処理
      const submitButton = this.form.querySelector('[type="submit"]');
      const originalText = submitButton.textContent;

      submitButton.disabled = true;
      submitButton.textContent = '送信中...';

      try {
        // カスタム送信ハンドラー
        if (this.options.onSubmit) {
          await this.options.onSubmit(this.getFormData());
        } else {
          // デフォルトの送信
          this.form.submit();
        }

        // 成功処理
        this.clearAutoSave();
        this.showSuccessMessage();
      } catch (error) {
        // エラー処理
        submitButton.disabled = false;
        submitButton.textContent = originalText;

        if (this.options.onSubmitError) {
          this.options.onSubmitError(error);
        }
      }
    });
  }

  enhanceAccessibility() {
    // フォームのラベル付け
    this.form.setAttribute('role', 'form');

    // 必須フィールドの明示
    this.fields.forEach(fieldData => {
      const field = fieldData.element;

      if (fieldData.required) {
        field.setAttribute('aria-required', 'true');

        // ラベルに必須マークを追加
        const label = this.form.querySelector(`label[for="${field.id}"]`);
        if (label && !label.querySelector('.required-mark')) {
          const mark = document.createElement('span');
          mark.className = 'required-mark';
          mark.textContent = ' *';
          mark.setAttribute('aria-label', '必須');
          label.appendChild(mark);
        }
      }
    });

    // エラーサマリーの作成
    this.createErrorSummary();
  }

  createErrorSummary() {
    const summary = document.createElement('div');
    summary.id = 'error-summary';
    summary.className = 'error-summary';
    summary.setAttribute('role', 'alert');
    summary.setAttribute('aria-live', 'assertive');
    summary.style.display = 'none';

    this.form.insertBefore(summary, this.form.firstChild);
  }

  updateErrorSummary() {
    const summary = document.getElementById('error-summary');
    const errors = this.getErrors();

    if (errors.length === 0) {
      summary.style.display = 'none';
      return;
    }

    summary.innerHTML = `
      <h3>入力エラーがあります</h3>
      <ul>
        ${errors
          .map(
            error => `
          <li>
            <a href="#${error.fieldId}">${error.label}: ${error.messages.join(', ')}</a>
          </li>
        `
          )
          .join('')}
      </ul>
    `;

    summary.style.display = 'block';
    summary.focus();
  }

  getErrors() {
    const errors = [];

    this.fields.forEach((fieldData, name) => {
      if (!fieldData.valid && fieldData.errors.length > 0) {
        const field = fieldData.element;
        const label = this.form.querySelector(`label[for="${field.id}"]`);

        errors.push({
          fieldId: field.id,
          name: name,
          label: label ? label.textContent.replace(' *', '') : name,
          messages: fieldData.errors
        });
      }
    });

    return errors;
  }

  getFormData() {
    const formData = new FormData(this.form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    return data;
  }

  clearAutoSave() {
    localStorage.removeItem(`form-autosave-${this.formId}`);
    clearInterval(this.autoSaveTimer);
  }

  showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'form-success-message';
    message.innerHTML = `
      <div class="success-icon">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
      </div>
      <p>送信が完了しました！</p>
    `;

    this.form.appendChild(message);

    // アニメーション
    setTimeout(() => message.classList.add('visible'), 100);

    // 自動的に非表示
    setTimeout(() => {
      message.classList.remove('visible');
      setTimeout(() => message.remove(), 300);
    }, 5000);
  }

  // Public API
  reset() {
    this.form.reset();
    this.fields.forEach(fieldData => {
      fieldData.pristine = true;
      fieldData.valid = true;
      fieldData.errors = [];
      this.updateFieldUI(fieldData);
    });
    this.updateProgress();
  }

  destroy() {
    clearInterval(this.autoSaveTimer);
    this.fields.clear();
    this.validators.clear();
  }
}

// CSS スタイル
if (!document.querySelector('#form-enhancements-style')) {
  const style = document.createElement('style');
  style.id = 'form-enhancements-style';
  style.textContent = `
    /* バリデーション状態 */
    .form-field {
      position: relative;
      margin-bottom: 1.5rem;
    }
    
    input.is-valid,
    textarea.is-valid,
    select.is-valid {
      border-color: #28a745;
      padding-right: 2.5rem;
    }
    
    input.is-invalid,
    textarea.is-invalid,
    select.is-invalid {
      border-color: #dc3545;
      padding-right: 2.5rem;
    }
    
    .validation-icon {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 1.25rem;
      height: 1.25rem;
      pointer-events: none;
    }
    
    .validation-icon.success {
      color: #28a745;
    }
    
    .validation-icon.error {
      color: #dc3545;
    }
    
    /* エラーメッセージ */
    .field-error {
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: #dc3545;
    }
    
    .error-message {
      margin-top: 0.125rem;
    }
    
    /* エラーアニメーション */
    @keyframes error-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
    
    .error-shake {
      animation: error-shake 0.5s ease-out;
    }
    
    /* 自動保存インジケーター */
    .autosave-indicator {
      position: fixed;
      top: 1rem;
      right: 1rem;
      background: #28a745;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      opacity: 0;
      transform: translateY(-1rem);
      transition: all 0.3s ease;
      z-index: 1000;
    }
    
    .autosave-indicator.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    .autosave-indicator.saving {
      background: #ffc107;
    }
    
    /* 自動保存プロンプト */
    .autosave-prompt {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 0.375rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    
    .prompt-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    /* プログレスバー */
    .form-progress {
      margin-bottom: 2rem;
    }
    
    .progress-bar {
      height: 0.5rem;
      background: #e9ecef;
      border-radius: 0.25rem;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: #007bff;
      width: 0;
      transition: width 0.3s ease;
    }
    
    .progress-text {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #6c757d;
    }
    
    /* 文字数カウンター */
    .character-counter {
      font-size: 0.75rem;
      color: #6c757d;
      text-align: right;
      margin-top: 0.25rem;
    }
    
    .character-counter.warning {
      color: #ffc107;
    }
    
    .character-counter.danger {
      color: #dc3545;
    }
    
    /* パスワード強度メーター */
    .password-strength-meter {
      margin-top: 0.5rem;
    }
    
    .strength-bar {
      height: 0.25rem;
      background: #e9ecef;
      border-radius: 0.125rem;
      overflow: hidden;
    }
    
    .strength-fill {
      height: 100%;
      width: 0;
      transition: all 0.3s ease;
    }
    
    .strength-text {
      font-size: 0.75rem;
      margin-top: 0.25rem;
      text-align: right;
    }
    
    /* エラーサマリー */
    .error-summary {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 0.375rem;
      color: #721c24;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    
    .error-summary h3 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
    }
    
    .error-summary ul {
      margin: 0;
      padding-left: 1.5rem;
    }
    
    .error-summary a {
      color: inherit;
      text-decoration: underline;
    }
    
    /* 成功メッセージ */
    .form-success-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      text-align: center;
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 1001;
    }
    
    .form-success-message.visible {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    
    .success-icon {
      width: 4rem;
      height: 4rem;
      margin: 0 auto 1rem;
      color: #28a745;
    }
    
    /* 必須マーク */
    .required-mark {
      color: #dc3545;
      margin-left: 0.25rem;
    }
  `;
  document.head.appendChild(style);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormEnhancements;
}
